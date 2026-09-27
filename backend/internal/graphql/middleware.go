package graphql

import (
	"context"
	"errors"
	"net/http"

	"github.com/99designs/gqlgen/graphql"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/vektah/gqlparser/v2/gqlerror"

	"github.com/stringptr/SiGizi/backend/internal/errorutils"
	"github.com/stringptr/SiGizi/backend/internal/httputils"
	"github.com/stringptr/SiGizi/backend/internal/jwtutils"
)

// =============================================================================
// Auth Middleware (JWT cookie -> claims)
// =============================================================================

// AuthMiddleware extracts the JWT from the access_token cookie and stores
// the decoded claims in the request context. Resolvers retrieve them via
// httputils.GetAccessClaim(ctx).
//
// Perilaku identik dengan middleware.AccessTokenMiddleware pada REST:
// cookie tidak ada / token invalid -> request tetap dilanjutkan tanpa claims,
// validasi 401 ditangani di level resolver (biar terjemah ke GraphQL errors[]).
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

// =============================================================================
// Validasi Role (resume aturan bisnis di resolver)
// =============================================================================

// requireRole memvalidasi claims user terhadap daftar role yang diizinkan.
// Semantik persis sama dengan middleware.RequireRole pada REST:
//   - belum login                  -> 401 (unauthorized)
//   - SUPER_ADMIN                  -> selalu diizinkan (bypass)
//   - role tidak termasuk yang diizinkan -> 403 (forbidden)
//
// Pemakaian:
//   - buat/edit artikel : requireRole(claims, "ADMIN") -> ADMIN mencakup
//     penulis Bidan/Kader/Dinkes (SUPER_ADMIN bypass, sama seperti REST
//     adminGroup di routes.go).
//   - review/hapus artikel: requireRole(claims, "DINKES").
func requireRole(claims *jwtutils.Claim, roles ...string) *errorutils.Error {
	if claims == nil {
		return &errorutils.Error{Status: 401, Message: "Silahkan login terlebih dahulu."}
	}

	if hasRole(claims, "SUPER_ADMIN") {
		return nil
	}

	for _, required := range roles {
		if hasRole(claims, required) {
			return nil
		}
	}
	return &errorutils.Error{Status: 403, Message: "Tidak mempunyai akses untuk halaman ini."}
}

// hasRole memeriksa apakah claims memiliki salah satu role.
func hasRole(claims *jwtutils.Claim, roles ...string) bool {
	if claims == nil {
		return false
	}
	for _, r := range claims.Roles {
		for _, want := range roles {
			if r == want {
				return true
			}
		}
	}
	return false
}

// =============================================================================
// Standarisasi Error Handling: errorutils.Error -> GraphQL errors[]
// =============================================================================

// ErrorCodeFromStatus memetakan status HTTP errorutils.Error menjadi code
// pada extensions GraphQL:
//
//	422 -> invalid      401 -> unauthorized    403 -> forbidden
//	404 -> not_found    500 (dan lainnya) -> internal
func ErrorCodeFromStatus(status int) string {
	switch status {
	case 422:
		return "invalid"
	case 401:
		return "unauthorized"
	case 403:
		return "forbidden"
	case 404:
		return "not_found"
	default:
		return "internal"
	}
}

// ErrorPresenter adalah error presenter gqlgen. Setiap *errorutils.Error yang
// dikembalikan resolver (dari service maupun validasi di resolver) dipetakan
// ke entry GraphQL errors[] dengan:
//   - message  : pesan Indonesia yang sama dengan REST,
//   - extensions.code   : invalid | unauthorized | forbidden | not_found | internal,
//   - extensions.status : status HTTP aslinya,
//   - extensions.errors : rincian field-level bila ada (hasil validasi 422).
func ErrorPresenter(ctx context.Context, err error) *gqlerror.Error {
	var e *errorutils.Error
	if !errors.As(err, &e) {
		// Error non-domain (gqlparser, dsb.) diteruskan apa adanya.
		return gqlerror.WrapPath(graphql.GetPath(ctx), err)
	}

	gerr := gqlerror.WrapPath(graphql.GetPath(ctx), err)
	gerr.Message = e.Message
	gerr.Extensions = map[string]any{
		"code":   ErrorCodeFromStatus(e.Status),
		"status": e.Status,
	}
	if len(e.Errors) > 0 {
		items := make([]map[string]any, 0, len(e.Errors))
		for _, it := range e.Errors {
			item := map[string]any{"message": it.Message}
			if it.ID != "" {
				item["id"] = it.ID
			}
			if it.Location != "" {
				item["location"] = it.Location
			}
			items = append(items, item)
		}
		gerr.Extensions["errors"] = items
	}
	return gerr
}
