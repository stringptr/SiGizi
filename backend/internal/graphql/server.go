package graphql

import (
	"net/http"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/jackc/pgx/v5/pgxpool"

	artikelDomain "github.com/stringptr/SiGizi/backend/internal/domain/artikel"
	"github.com/stringptr/SiGizi/backend/internal/jwtutils"
)

// NewHandler returns an http.Handler that serves the GraphQL endpoint.
// It sets up per-request DataLoaders, extracts JWT claims from cookies,
// and maps errorutils.Error into standardized GraphQL errors[] via
// ErrorPresenter (middleware.go).
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
	srv := handler.NewDefaultServer(NewExecutableSchema(Config{
		Resolvers: &Resolver{
			ArtikelService: artikelService,
			ArtikelRepo:    artikelRepo,
		},
	}))
	srv.SetErrorPresenter(ErrorPresenter)

	var h http.Handler = srv
	h = DataLoaderMiddleware(db)(h)
	h = AuthMiddleware(jwtUtil)(h)
	return h
}

// NewPlaygroundHandler returns the GraphQL Playground UI handler.
func NewPlaygroundHandler() http.Handler {
	return playground.Handler("GraphQL Playground", "/graphql")
}
