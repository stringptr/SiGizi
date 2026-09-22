package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	v1 "github.com/stringptr/SiGizi/backend/internal/api/v1"
	"github.com/stringptr/SiGizi/backend/internal/config"
	authDomain "github.com/stringptr/SiGizi/backend/internal/domain/auth"
	artikelFeature "github.com/stringptr/SiGizi/backend/internal/feature/artikel"
	"github.com/stringptr/SiGizi/backend/internal/feature/auditlog"
	"github.com/stringptr/SiGizi/backend/internal/feature/auth"
	"github.com/stringptr/SiGizi/backend/internal/feature/bannedip"
	dashboardFeature "github.com/stringptr/SiGizi/backend/internal/feature/dashboard"
	faskesFeature "github.com/stringptr/SiGizi/backend/internal/feature/faskes"
	imunisasiFeature "github.com/stringptr/SiGizi/backend/internal/feature/imunisasi"
	"github.com/stringptr/SiGizi/backend/internal/feature/jwtblacklist"
	lokasiFeature "github.com/stringptr/SiGizi/backend/internal/feature/lokasi"
	"github.com/stringptr/SiGizi/backend/internal/feature/notification"
	pasienFeature "github.com/stringptr/SiGizi/backend/internal/feature/pasien"
	pemeriksaanFeature "github.com/stringptr/SiGizi/backend/internal/feature/pemeriksaan"
	tindaklanjutFeature "github.com/stringptr/SiGizi/backend/internal/feature/tindaklanjut"
	"github.com/stringptr/SiGizi/backend/internal/feature/userAccount"
	"github.com/stringptr/SiGizi/backend/internal/feature/userSession"
	"github.com/stringptr/SiGizi/backend/internal/graphql"
	"github.com/stringptr/SiGizi/backend/internal/httputils"
	"github.com/stringptr/SiGizi/backend/internal/infrastructure/mail"
	natsutil "github.com/stringptr/SiGizi/backend/internal/infrastructure/nats"
	"github.com/stringptr/SiGizi/backend/internal/jwtutils"
	"github.com/stringptr/SiGizi/backend/internal/middleware"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humachi"
	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	cfg := config.Load()
	config, _ := pgxpool.ParseConfig(cfg.DBMasterConfig.DSN())
	config.AfterConnect = func(ctx context.Context, conn *pgx.Conn) error {
		conn.TypeMap().RegisterType(&pgtype.Type{
			Name:  "inet",
			OID:   pgtype.InetOID,
			Codec: &pgtype.TextCodec{},
		})
		return nil
	}

	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		log.Fatalf("unable to connect to database: %v", err)
	}

	defer pool.Close()

	jwtUtil := jwtutils.New(cfg.AuthConfig.JWTSecret)

	natsConn, err := natsutil.Connect(cfg.NATSConfig.URL(), cfg.NATSConfig.Token)
	if err != nil {
		log.Fatalf("unable to connect to NATS: %v", err)
	}
	defer natsConn.Close()

	bannedIPKV, err := natsConn.CreateKeyValue(context.Background(), "banned_ips", cfg.RestrictAuthConfig.Duration)
	if err != nil {
		log.Fatalf("unable to create banned_ips KV bucket: %v", err)
	}
	jwtBlacklistKV, err := natsConn.CreateKeyValue(context.Background(), "jwt_blacklist", 30*time.Minute)
	if err != nil {
		log.Fatalf("unable to create jwt_blacklist KV bucket: %v", err)
	}

	authRepo := auth.NewRepo(pool)
	userAccountRepo := userAccount.NewRepo(pool)
	auditLogRepo := auditlog.NewRepo(pool)
	userAccountService := userAccount.NewService(userAccountRepo, authRepo, auditLogRepo)
	userAccountHandler := userAccount.NewHandler(userAccountService)
	userSessionRepo := userSession.NewRepo(pool)
	banRepo := bannedip.NewRepo(natsutil.NewKV(bannedIPKV))
	blacklistRepo := jwtblacklist.NewRepo(natsutil.NewKV(jwtBlacklistKV))
	notifPublisher := notification.NewPublisher(natsutil.NewPubSub(natsConn.Conn()))

	notifRepo := notification.NewRepo(pool)
	notifService := notification.NewService(notifRepo)
	notifHandler := notification.NewHandler(notifService)

	pasienRepo := pasienFeature.NewRepo(pool)
	pasienService := pasienFeature.NewService(pasienRepo, auditLogRepo)
	pasienHandler := pasienFeature.NewHandler(pasienService)

	lokasiRepo := lokasiFeature.NewRepo(pool)
	lokasiService := lokasiFeature.NewService(lokasiRepo)
	lokasiHandler := lokasiFeature.NewHandler(lokasiService)

	pemeriksaanRepo := pemeriksaanFeature.NewRepo(pool)

	imunisasiRepo := imunisasiFeature.NewRepo(pool)
	imunisasiService := imunisasiFeature.NewService(imunisasiRepo, auditLogRepo, notifRepo, notifPublisher)
	imunisasiHandler := imunisasiFeature.NewHandler(imunisasiService)

	artikelRepo := artikelFeature.NewRepo(pool)
	artikelService := artikelFeature.NewService(artikelRepo, auditLogRepo, notifRepo, notifPublisher)
	artikelHandler := artikelFeature.NewHandler(artikelService)

	faskesRepo := faskesFeature.NewRepo(pool)
	faskesService := faskesFeature.NewService(faskesRepo)
	faskesHandler := faskesFeature.NewHandler(faskesService)

	tindaklanjutRepo := tindaklanjutFeature.NewRepo(pool)

	// dashboardRepo is created early so it can be passed as MVRefresher to
	// services that write data (pemeriksaan, tindaklanjut), ensuring that
	// all dashboard materialized views stay fresh after mutations.
	dashboardRepo := dashboardFeature.NewRepo(pool)
	dashboardService := dashboardFeature.NewService(dashboardRepo)
	dashboardHandler := dashboardFeature.NewHandler(dashboardService)

	pemeriksaanService := pemeriksaanFeature.NewService(pemeriksaanRepo, auditLogRepo, notifRepo, notifPublisher, dashboardRepo)
	pemeriksaanHandler := pemeriksaanFeature.NewHandler(pemeriksaanService)

	tindaklanjutService := tindaklanjutFeature.NewService(tindaklanjutRepo, auditLogRepo, notifRepo, notifPublisher, dashboardRepo)
	tindaklanjutHandler := tindaklanjutFeature.NewHandler(tindaklanjutService)


	authService := auth.NewService(authRepo, userSessionRepo, userAccountRepo, jwtUtil, &cfg.AuthConfig, &cfg.RestrictAuthConfig, banRepo, blacklistRepo, auditLogRepo, mail.New(cfg.MailConfig), notifRepo, notifPublisher)
	authHandler := auth.NewHandler(authService, &jwtUtil)

	r := chi.NewMux()

	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)
	r.Use(chimw.ClientIPFromHeader("X-Real-IP"))
	r.Use(chimw.RequestID)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   cfg.CORSOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	rConfig := huma.DefaultConfig("RESTful API", "1.0.0")
	rConfig.DocsPath = "/"
	rConfig.Servers = []*huma.Server{
		{URL: "/api"},
	}
	rConfig.Transformers = []huma.Transformer{
		httputils.NewUnifiedTransformer(authDomain.MapValidationError),
	}

	api := humachi.New(r, rConfig)
	api.UseMiddleware(middleware.RealIPMiddleware())
	api.UseMiddleware(middleware.AccessTokenMiddleware(api, &jwtUtil, blacklistRepo))

	r.Get("/docs", func(w http.ResponseWriter, r *http.Request) {
		csp := []string{
			"default-src 'none'",
			"base-uri 'none'",
			"connect-src 'self'",
			"form-action 'none'",
			"frame-ancestors 'none'",
			"sandbox allow-same-origin allow-scripts",
			"script-src 'unsafe-eval' https://unpkg.com/@scalar/api-reference@1.44.20/dist/browser/standalone.js",
			"style-src 'unsafe-inline'",
		}
		w.Header().Set("Content-Security-Policy", strings.Join(csp, "; "))
		w.Header().Set("Content-Type", "text/html")
		w.Write([]byte(`<!doctype html>
		<html lang="en">
			<head>
				<meta charset="utf-8">
				<meta name="referrer" content="no-referrer">
				<meta name="viewport" content="initial-scale=1">
				<title>API Reference</title>
			</head>
			<body>
				<script id="api-reference" data-url="./openapi.json"></script>
				<script src="https://unpkg.com/@scalar/api-reference@1.44.20/dist/browser/standalone.js" crossorigin integrity="sha384-tMz7GAo6dMy55x9tLFtH+sHtogji6Scmb+feBR31TAHmvSPRUTboK9H3M5NFaP4R"></script>
			</body>
		</html>`))
	})

	sseHandler := notification.NewSSEHandler(natsutil.NewPubSub(natsConn.Conn()), &jwtUtil, notifRepo)
	r.Get("/v1/sse/notification", sseHandler.ServeHTTP)

	// GraphQL endpoint (does not interfere with existing REST endpoints).
	graphqlHandler := graphql.NewHandler(pool, &jwtUtil, artikelService, artikelRepo)
	r.Handle("/graphql", graphqlHandler)
	r.Handle("/graphql/playground", graphql.NewPlaygroundHandler())

	v1Group := huma.NewGroup(api, "/v1")
	v1.RegisterRoutes(v1Group, r, &v1.Dependency{
		AuthConfig:          cfg.AuthConfig,
		JWTUtil:             jwtUtil,
		UserAccountHandler:  userAccountHandler,
		AuthHandler:         authHandler,
		BlacklistRepo:       blacklistRepo,
		NotifPublisher:      notifPublisher,
		NotifHandler:        notifHandler,
		PasienHandler:       pasienHandler,
		LokasiHandler:       lokasiHandler,
		FaskesHandler:       faskesHandler,
		PemeriksaanHandler:  pemeriksaanHandler,
		ImunisasiHandler:    imunisasiHandler,
		ArtikelHandler:      artikelHandler,
		TindakLanjutHandler: tindaklanjutHandler,
		DashboardHandler:    dashboardHandler,
	})

	log.Printf("server starting on %s:%s", cfg.Host, cfg.Port)
	http.ListenAndServe(fmt.Sprintf("%s:%s", cfg.Host, cfg.Port), api.Adapter())
}
