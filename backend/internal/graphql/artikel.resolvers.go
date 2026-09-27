package graphql

// =============================================================================
// Orang 2 — Backend Developer 2
// Mutation Resolvers untuk Artikel (Mutations, Logic & Workflow).
//
// Prinsip:
//   - Resolver TIDAK menulis ulang logika bisnis. Semua mutasi memanggil
//     artikelDomain.Service (backend/internal/feature/artikel/service.go)
//     yang sama dengan yang dipakai endpoint REST, sehingga audit-log,
//     notifikasi NATS, auto-publish Dinkes, dan ownership dijamin perilakunya
//     identik.
//   - Validasi role & kepemilikan di-resume di resolver:
//       * buat/edit artikel  : role ADMIN (penulis Bidan/Kader/Dinkes).
//       * review/hapus artikel: role DINKES.
//       * kepemilikan: non-DINKES hanya boleh mengedit artikel miliknya yang
//         masih "Menunggu Verifikasi" (dijamin di dalam service.Update).
//       * alur Dinkes via service.Review:
//           - setujui -> Dipublikasikan + id_verifikator + tanggal_publish
//           - tolak   -> Ditolak (catatan_review diterima di input).
//
// Error handling standar: setiap *errorutils.Error yang dikembalikan service
// dipetakan ke GraphQL errors[] oleh ErrorPresenter (middleware.go):
//   422 -> invalid, 401 -> unauthorized, 403 -> forbidden,
//   404 -> not_found, 500 -> internal.
// =============================================================================

import (
	"context"

	artikelDomain "github.com/stringptr/SiGizi/backend/internal/domain/artikel"
	"github.com/stringptr/SiGizi/backend/internal/httputils"
)

// =============================================================================
// Resolver plumbing (dihubungkan ke root Resolver)
// =============================================================================

// Mutation returns MutationResolver implementation.
func (r *Resolver) Mutation() MutationResolver { return &mutationResolver{r} }

// Artikel returns ArtikelResolver implementation.
func (r *Resolver) Artikel() ArtikelResolver { return &artikelResolver{r} }

// ArtikelListItem returns ArtikelListItemResolver implementation.
func (r *Resolver) ArtikelListItem() ArtikelListItemResolver { return &artikelListItemResolver{r} }

// ArtikelPendingItem returns ArtikelPendingItemResolver implementation.
func (r *Resolver) ArtikelPendingItem() ArtikelPendingItemResolver {
	return &artikelPendingItemResolver{r}
}

type (
	mutationResolver           struct{ *Resolver }
	artikelResolver            struct{ *Resolver }
	artikelListItemResolver    struct{ *Resolver }
	artikelPendingItemResolver struct{ *Resolver }
)

// =============================================================================
// Mutation Resolvers
// =============================================================================

// CreateArtikel is the resolver for the createArtikel field.
//
// Role: ADMIN (Bidan/Kader/Dinkes — sesuai adminGroup REST).
// Service otomatis:
//   - Dinkes  -> status langsung "Dipublikasikan" (auto-publish).
//   - lainnya -> status "Menunggu Verifikasi" + notifikasi review (NATS/DB).
func (r *mutationResolver) CreateArtikel(ctx context.Context, input CreateArtikelInput) (*CreateArtikelPayload, error) {
	claims := httputils.GetAccessClaim(ctx)
	if err := requireRole(claims, "ADMIN"); err != nil {
		return nil, err
	}

	// Panggil service yang sama dengan REST (audit-log + notifikasi dijamin).
	data, err := r.ArtikelService.Create(ctx, claims.IDUser, hasRole(claims, "DINKES"), &artikelDomain.CreateArtikelRequest{
		Judul:      input.Judul,
		IsiArtikel: input.IsiArtikel,
		Kategori:   safePtrStr(input.Kategori),
	})
	if err != nil {
		return nil, err // -> ErrorPresenter -> errors[]
	}

	return &CreateArtikelPayload{
		IDArtikel:     int(data.IDArtikel),
		StatusArtikel: data.StatusArtikel,
	}, nil
}

// UpdateArtikel is the resolver for the updateArtikel field.
//
// Role: ADMIN. Validasi kepemilikan & status "Menunggu Verifikasi" untuk
// non-Dinkes sudah dijamin di dalam service.Update (dipakai ulang).
func (r *mutationResolver) UpdateArtikel(ctx context.Context, id int, input UpdateArtikelInput) (*Artikel, error) {
	claims := httputils.GetAccessClaim(ctx)
	if err := requireRole(claims, "ADMIN"); err != nil {
		return nil, err
	}

	// Panggil service yang sama dengan REST (ownership + state check dijamin).
	detail, err := r.ArtikelService.Update(ctx, claims.IDUser, hasRole(claims, "DINKES"), &artikelDomain.UpdateArtikelRequest{
		Judul:      input.Judul,
		IsiArtikel: input.IsiArtikel,
		Kategori:   input.Kategori,
	}, int32(id))
	if err != nil {
		return nil, err // 403 forbidden / 404 not_found / 500 internal
	}

	// Ambil IDPenulis dari repo untuk field relasi `penulis`, lalu batch-load
	// namanya via DataLoader (payload service.ArtikelDetail tidak memuat ID).
	a := &Artikel{
		IDArtikel:      int(detail.IDArtikel),
		Judul:          detail.Judul,
		IsiArtikel:     detail.IsiArtikel,
		Kategori:       strPtr(detail.Kategori),
		StatusArtikel:  detail.StatusArtikel,
		TanggalPublish: detail.TanggalPublish,
		CreatedAt:      detail.CreatedAt,
		UpdatedAt:      detail.UpdatedAt,
	}
	if existing, rerr := r.ArtikelRepo.GetByID(ctx, int32(id)); rerr == nil && existing != nil {
		a.IDPenulis = int(existing.IDPenulis)
		batchLoadPenulis(ctx, existing.IDPenulis)
	}

	return a, nil
}

// DeleteArtikel is the resolver for the deleteArtikel field.
//
// Role: DINKES (SUPER_ADMIN bypass) — sama dengan dinkesGroup REST.
func (r *mutationResolver) DeleteArtikel(ctx context.Context, id int) (bool, error) {
	claims := httputils.GetAccessClaim(ctx)
	if err := requireRole(claims, "DINKES"); err != nil {
		return false, err
	}

	// Panggil service yang sama dengan REST (audit-log dijamin).
	err := r.ArtikelService.Delete(ctx, int32(id))
	if err != nil {
		return false, err // 404 not_found / 500 internal
	}
	return true, nil
}

// ReviewArtikel is the resolver for the reviewArtikel field.
//
// Role: DINKES (SUPER_ADMIN bypass). State machine artikel di service:
//   - aksi "setujui" -> StatusArtikel "Dipublikasikan" + id_verifikator
//     (claims.IDUser) + tanggal_publish terisi.
//   - aksi "tolak"   -> StatusArtikel "Ditolak"; catatanReview diterima di
//     input dan diteruskan ke service (persisten catatan ke DB opsional).
func (r *mutationResolver) ReviewArtikel(ctx context.Context, id int, input ReviewArtikelInput) (*ReviewArtikelPayload, error) {
	claims := httputils.GetAccessClaim(ctx)
	if err := requireRole(claims, "DINKES"); err != nil {
		return nil, err
	}

	// Panggil service yang sama dengan REST (audit-log + notifikasi dijamin).
	data, err := r.ArtikelService.Review(ctx, claims.IDUser, int32(id), &artikelDomain.ReviewArtikelRequest{
		Aksi:          input.Aksi,
		CatatanReview: safePtrStr(input.CatatanReview),
	})
	if err != nil {
		return nil, err // 404 not_found / 500 internal
	}

	return &ReviewArtikelPayload{
		IDArtikel:      int(data.IDArtikel),
		StatusArtikel:  data.StatusArtikel,
		TanggalPublish: data.TanggalPublish,
	}, nil
}

// =============================================================================
// Field Resolvers (relasi penulis/verifikator via DataLoader)
// =============================================================================

// batchLoadPenulis menyiapkan cache DataLoader untuk beberapa user ID.
func batchLoadPenulis(ctx context.Context, ids ...int32) {
	if loaders := LoadersFromContext(ctx); loaders != nil {
		_ = loaders.UserLoader.BatchLoad(ctx, ids)
	}
}

// Penulis is the resolver for the penulis field.
func (r *artikelResolver) Penulis(ctx context.Context, obj *Artikel) (*User, error) {
	if loaders := LoadersFromContext(ctx); loaders != nil {
		name := loaders.UserLoader.GetUser(ctx, int32(obj.IDPenulis))
		return &User{IDUser: obj.IDPenulis, Nama: name}, nil
	}
	return &User{IDUser: obj.IDPenulis}, nil
}

// Verifikator is the resolver for the verifikator field.
func (r *artikelResolver) Verifikator(ctx context.Context, obj *Artikel) (*User, error) {
	if obj.IDVerifikator == nil {
		return nil, nil
	}
	if loaders := LoadersFromContext(ctx); loaders != nil {
		name := loaders.UserLoader.GetUser(ctx, int32(*obj.IDVerifikator))
		return &User{IDUser: *obj.IDVerifikator, Nama: name}, nil
	}
	return &User{IDUser: *obj.IDVerifikator}, nil
}

// Penulis is the resolver for the penulis field.
func (r *artikelListItemResolver) Penulis(ctx context.Context, obj *ArtikelListItem) (*User, error) {
	if loaders := LoadersFromContext(ctx); loaders != nil {
		name := loaders.UserLoader.GetUser(ctx, int32(obj.IDPenulis))
		return &User{IDUser: obj.IDPenulis, Nama: name}, nil
	}
	return &User{IDUser: obj.IDPenulis}, nil
}

// Penulis is the resolver for the penulis field.
func (r *artikelPendingItemResolver) Penulis(ctx context.Context, obj *ArtikelPendingItem) (*User, error) {
	if loaders := LoadersFromContext(ctx); loaders != nil {
		name := loaders.UserLoader.GetUser(ctx, int32(obj.IDPenulis))
		return &User{IDUser: obj.IDPenulis, Nama: name}, nil
	}
	return &User{IDUser: obj.IDPenulis}, nil
}
