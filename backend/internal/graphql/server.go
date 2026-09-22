package graphql

import (
	"context"
	"net/http"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	artikelDomain "github.com/stringptr/SiGizi/backend/internal/domain/artikel"
	"github.com/stringptr/SiGizi/backend/internal/httputils"
	"github.com/stringptr/SiGizi/backend/internal/jwtutils"
)

// NewHandler returns an http.Handler that serves the GraphQL endpoint.
// It sets up per-request DataLoaders and extracts JWT claims from cookies.
//
// Usage in main.go:
//
//	graphqlHandler := graphql.NewHandler(db, &jwtUtil, artikelService, artikelRepo)
//	r.Handle("/graphql", graphqlHandler)
//	r.Handle("/graphql/playground", graphql.NewPlaygroundHandler())
//
// IMPORTANT: Run `go generate ./internal/graphql/...` before building,
// to produce generated.go and models_gen.go from the schema.
func NewHandler(db *pgxpool.Pool, jwtUtil *jwtutils.JWT, artikelService artikelDomain.Service, artikelRepo artikelDomain.Repo) http.Handler {
	r := chi.NewMux()

	// Middleware: extract JWT from access_token cookie.
	r.Use(AuthMiddleware(jwtUtil))

	// Middleware: inject per-request DataLoaders.
	r.Use(DataLoaderMiddleware(db))

	// Create gqlgen executable schema.
	// Config and NewExecutableSchema are defined in generated.go.
	srv := handler.NewDefaultServer(NewExecutableSchema(Config{
		Resolvers: &Resolver{
			ArtikelService: artikelService,
			ArtikelRepo:    artikelRepo,
		},
	}))

	r.Handle("/graphql", srv)
	return r
}

// NewPlaygroundHandler returns the GraphQL Playground UI handler.
func NewPlaygroundHandler() http.Handler {
	return playground.Handler("GraphQL Playground", "/graphql")
}

// AuthMiddleware extracts the JWT from the access_token cookie and stores
// the decoded claims in context. Resolvers retrieve them via
// httputils.GetAccessClaim(ctx).
func AuthMiddleware(jwtUtil *jwtutils.JWT) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			cookie, err := r.Cookie("access_token")
			if err == nil {
				claims, err := jwtUtil.Decode(cookie.Value)
				if err == nil {
					ctx := context.WithValue(r.Context(), httputils.AccessKey, claims)
					r = r.WithContext(ctx)
				}
			}
			next.ServeHTTP(w, r)
		})
	}
}

// DataLoaderMiddleware injects per-request DataLoaders into the context.
func DataLoaderMiddleware(db *pgxpool.Pool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			loaders := NewLoaders(db)
			ctx := WithLoaders(r.Context(), loaders)
			r = r.WithContext(ctx)
			next.ServeHTTP(w, r)
		})
	}
}
