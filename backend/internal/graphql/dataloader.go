package graphql

import (
	"context"
	"fmt"
	"strings"
	"sync"

	"github.com/jackc/pgx/v5/pgxpool"
)

type loadersKey struct{}
type userCacheKey struct{}

// Loaders holds request-scoped DataLoader instances.
type Loaders struct {
	UserLoader *UserLoader
}

// UserLoader batches user name lookups by ID.
type UserLoader struct {
	db      *pgxpool.Pool
	mu      sync.Mutex
	results map[int32]string
}

// NewLoaders creates DataLoaders for a single request scope.
func NewLoaders(db *pgxpool.Pool) *Loaders {
	return &Loaders{
		UserLoader: &UserLoader{
			db:      db,
			results: make(map[int32]string),
		},
	}
}

// LoadersFromContext retrieves the request-scoped DataLoaders.
func LoadersFromContext(ctx context.Context) *Loaders {
	loaders, _ := ctx.Value(loadersKey{}).(*Loaders)
	return loaders
}

// WithLoaders injects DataLoaders into the request context.
func WithLoaders(ctx context.Context, loaders *Loaders) context.Context {
	return context.WithValue(ctx, loadersKey{}, loaders)
}

// BatchLoad fetches names for all given user IDs in a single query
// and stores them in context. Call this from the parent resolver
// before child resolvers need the data.
func (ul *UserLoader) BatchLoad(ctx context.Context, ids []int32) context.Context {
	if len(ids) == 0 {
		return ctx
	}

	// Deduplicate.
	unique := make(map[int32]struct{}, len(ids))
	for _, id := range ids {
		if id > 0 {
			unique[id] = struct{}{}
		}
	}
	if len(unique) == 0 {
		return ctx
	}

	uniqueIDs := make([]int32, 0, len(unique))
	for id := range unique {
		uniqueIDs = append(uniqueIDs, id)
	}

	// Build parameterized query.
	placeholders := make([]string, len(uniqueIDs))
	args := make([]interface{}, len(uniqueIDs))
	for i, id := range uniqueIDs {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
		args[i] = id
	}

	query := fmt.Sprintf(
		`SELECT id_user, nama FROM user_account WHERE id_user IN (%s)`,
		strings.Join(placeholders, ", "),
	)

	rows, err := ul.db.Query(ctx, query, args...)
	if err != nil {
		return ctx
	}
	defer rows.Close()

	ul.mu.Lock()
	for rows.Next() {
		var (
			id   int32
			nama string
		)
		if err := rows.Scan(&id, &nama); err != nil {
			continue
		}
		ul.results[id] = nama
	}
	ul.mu.Unlock()

	// Also store in context for direct access by child resolvers.
	cache := make(map[int32]string, len(ul.results))
	for k, v := range ul.results {
		cache[k] = v
	}
	return context.WithValue(ctx, userCacheKey{}, cache)
}

// GetUser returns the user name from the batch-loaded cache.
// Must call BatchLoad in the parent resolver first.
func (ul *UserLoader) GetUser(ctx context.Context, idUser int32) string {
	if idUser == 0 {
		return ""
	}

	// Try context cache first (set by BatchLoad).
	if cache, ok := ctx.Value(userCacheKey{}).(map[int32]string); ok {
		if name, ok := cache[idUser]; ok {
			return name
		}
	}

	// Fallback to loader results.
	ul.mu.Lock()
	defer ul.mu.Unlock()
	return ul.results[idUser]
}
