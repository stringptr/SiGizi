package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strings"

	v1 "github.com/stringptr/SiGizi/backend/internal/api/v1"
	"github.com/stringptr/SiGizi/backend/internal/config"
	"github.com/stringptr/SiGizi/backend/internal/httputils"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humachi"
	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	cfg := config.Load()
	pool, err := pgxpool.New(context.Background(), cfg.DBMasterConfig.DSN())
	if err != nil {
		log.Fatalf("unable to connect to database: %v", err)
	}

	defer pool.Close()

	r := chi.NewMux()

	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)
	r.Use(chimw.ClientIPFromHeader("X-Real-IP"))
	r.Use(chimw.RequestID)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: cfg.CORSOrigins,
		AllowedMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"*"},
		MaxAge:         300,
	}))

	rConfig := huma.DefaultConfig("RESTful API", "1.0.0")
	rConfig.DocsPath = "/docs"
	rConfig.Servers = []*huma.Server{
		{URL: "/api"},
	}
	rConfig.Transformers = []huma.Transformer{httputils.UnifiedTransformer}

	api := humachi.New(r, rConfig)

	r.Get("/docs/scalar", func(w http.ResponseWriter, r *http.Request) {
		// Please also refer to the "DocsRendererScalar" renderer code inside api.go on what to return here
		csp := []string{
			"default-src 'none'",
			"base-uri 'none'",
			"connect-src 'self'",
			"form-action 'none'",
			"frame-ancestors 'none'",
			"sandbox allow-same-origin allow-scripts",
			"script-src 'unsafe-eval' https://unpkg.com/@scalar/api-reference@1.44.20/dist/browser/standalone.js", // TODO: Somehow drop 'unsafe-eval'
			"style-src 'unsafe-inline'", // TODO: Somehow drop 'unsafe-inline'
		}
		w.Header().Set("Content-Security-Policy", strings.Join(csp, "; "))
		w.Header().Set("Content-Type", "text/html")
		w.Write([]byte(`<!doctype html>
		<html lang="en">
			<head>
				<meta charset="utf-8">
				<meta name="referrer" content="no-referrer">
				<meta name="viewport" content="width=device-width, initial-scale=1">
				<title>API Reference</title>
			</head>
			<body>
				<script id="api-reference" data-url="../openapi.json"></script>
				<script src="https://unpkg.com/@scalar/api-reference@1.44.20/dist/browser/standalone.js" crossorigin integrity="sha384-tMz7GAo6dMy55x9tLFtH+sHtogji6Scmb+feBR31TAHmvSPRUTboK9H3M5NFaP4R"></script>
			</body>
		</html>`))
	})

	v1Group := huma.NewGroup(api, "/v1")
	v1.RegisterRoutes(v1Group, r, pool, cfg)

	huma.Get(api, "/", func(ctx context.Context, input *struct{}) (*struct {
		Body httputils.APIResponse[struct{ Thing string }]
	}, error,
	) {
		return &struct {
			Body httputils.APIResponse[struct{ Thing string }]
		}{Body: httputils.OK(struct{ Thing string }{Thing: "thing"})}, nil
	})

	http.ListenAndServe(fmt.Sprintf("%s:%s", cfg.Host, cfg.Port), api.Adapter())
}
