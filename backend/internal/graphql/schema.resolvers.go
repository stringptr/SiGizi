package graphql

import (
	"context"
	"slices"

	artikelDomain "github.com/stringptr/SiGizi/backend/internal/domain/artikel"
	"github.com/stringptr/SiGizi/backend/internal/errorutils"
	"github.com/stringptr/SiGizi/backend/internal/httputils"
	"github.com/stringptr/SiGizi/backend/internal/pagination"
)

// --- Query resolvers ---

func (r *queryResolver) Artikel(ctx context.Context, id int) (*Artikel, error) {
	repo := r.Resolver.ArtikelRepo

	article, err := repo.GetByID(ctx, int32(id))
	if err != nil {
		return nil, err
	}
	if article == nil {
		return nil, &errorutils.Error{Status: 404, Message: "Artikel tidak ditemukan."}
	}

	detail, err := repo.GetDetailJoinByID(ctx, int32(id))
	if err != nil {
		return nil, err
	}

	// Batch-load penulis and verifikator names via DataLoader.
	if loaders := LoadersFromContext(ctx); loaders != nil {
		ids := []int32{article.IDPenulis}
		if article.IDVerifikator != nil {
			ids = append(ids, *article.IDVerifikator)
		}
		ctx = loaders.UserLoader.BatchLoad(ctx, ids)
	}

	a := &Artikel{
		IDArtikel:      int(article.IDArtikel),
		Judul:          article.Judul,
		IsiArtikel:     article.IsiArtikel,
		Kategori:       article.Kategori,
		StatusArtikel:  string(article.StatusArtikel),
		IDPenulis:      int(article.IDPenulis),
		TanggalPublish: detail.TanggalPublish,
		CreatedAt:      detail.CreatedAt,
		UpdatedAt:      detail.UpdatedAt,
	}

	if article.IDVerifikator != nil {
		idVer := int(*article.IDVerifikator)
		a.IDVerifikator = &idVer
	}

	return a, nil
}

func (r *queryResolver) DaftarArtikel(ctx context.Context, page *int, perPage *int) (*ArtikelListPayload, error) {
	svc := r.Resolver.ArtikelService
	p := pagination.ValidatePage(ptrToInt(page))
	pp := pagination.ValidatePerPage(ptrToInt(perPage))

	data, err := svc.GetAllPublished(ctx, &artikelDomain.GetAllPublishedRequest{
		Page:    p,
		PerPage: pp,
	})
	if err != nil {
		return nil, err
	}

	// Batch-load all penulis names via DataLoader.
	if loaders := LoadersFromContext(ctx); loaders != nil {
		ids := make([]int32, 0, len(data.Artikel))
		for _, item := range data.Artikel {
			ids = append(ids, item.IDPenulis)
		}
		ctx = loaders.UserLoader.BatchLoad(ctx, ids)
	}

	items := make([]*ArtikelListItem, len(data.Artikel))
	for i, item := range data.Artikel {
		items[i] = &ArtikelListItem{
			IDArtikel:      int(item.IDArtikel),
			Judul:          item.Judul,
			Kategori:       item.Kategori,
			Ringkasan:      item.Ringkasan,
			IDPenulis:      int(item.IDPenulis),
			TanggalPublish: item.TanggalPublish,
			StatusArtikel:  item.StatusArtikel,
		}
	}

	return &ArtikelListPayload{
		Items: items,
		Meta: &PageInfo{
			CurrentPage: int(data.Meta.CurrentPage),
			PerPage:     int(data.Meta.PerPage),
			Total:       int(data.Meta.Total),
			LastPage:    int(data.Meta.LastPage),
		},
	}, nil
}

func (r *queryResolver) DaftarArtikelSemua(ctx context.Context, page *int, perPage *int) (*ArtikelListPayload, error) {
	claims := httputils.GetAccessClaim(ctx)
	if claims == nil {
		return nil, &errorutils.Error{Status: 401, Message: "Silahkan login terlebih dahulu."}
	}
	if !slices.Contains(claims.Roles, "ADMIN") && !slices.Contains(claims.Roles, "SUPER_ADMIN") {
		return nil, &errorutils.Error{Status: 403, Message: "Tidak mempunyai akses."}
	}

	svc := r.Resolver.ArtikelService
	p := pagination.ValidatePage(ptrToInt(page))
	pp := pagination.ValidatePerPage(ptrToInt(perPage))

	data, err := svc.GetAll(ctx, &artikelDomain.GetAllPublishedRequest{
		Page:    p,
		PerPage: pp,
	})
	if err != nil {
		return nil, err
	}

	if loaders := LoadersFromContext(ctx); loaders != nil {
		ids := make([]int32, 0, len(data.Artikel))
		for _, item := range data.Artikel {
			ids = append(ids, item.IDPenulis)
		}
		ctx = loaders.UserLoader.BatchLoad(ctx, ids)
	}

	items := make([]*ArtikelListItem, len(data.Artikel))
	for i, item := range data.Artikel {
		items[i] = &ArtikelListItem{
			IDArtikel:      int(item.IDArtikel),
			Judul:          item.Judul,
			Kategori:       item.Kategori,
			Ringkasan:      item.Ringkasan,
			IDPenulis:      int(item.IDPenulis),
			TanggalPublish: item.TanggalPublish,
			StatusArtikel:  item.StatusArtikel,
		}
	}

	return &ArtikelListPayload{
		Items: items,
		Meta: &PageInfo{
			CurrentPage: int(data.Meta.CurrentPage),
			PerPage:     int(data.Meta.PerPage),
			Total:       int(data.Meta.Total),
			LastPage:    int(data.Meta.LastPage),
		},
	}, nil
}

func (r *queryResolver) DaftarArtikelPending(ctx context.Context, page *int, perPage *int) (*ArtikelPendingPayload, error) {
	claims := httputils.GetAccessClaim(ctx)
	if claims == nil {
		return nil, &errorutils.Error{Status: 401, Message: "Silahkan login terlebih dahulu."}
	}
	if !slices.Contains(claims.Roles, "DINKES") && !slices.Contains(claims.Roles, "SUPER_ADMIN") {
		return nil, &errorutils.Error{Status: 403, Message: "Tidak mempunyai akses."}
	}

	svc := r.Resolver.ArtikelService
	p := pagination.ValidatePage(ptrToInt(page))
	pp := pagination.ValidatePerPage(ptrToInt(perPage))

	data, err := svc.GetPending(ctx, &artikelDomain.GetPendingRequest{
		Page:    p,
		PerPage: pp,
	})
	if err != nil {
		return nil, err
	}

	if loaders := LoadersFromContext(ctx); loaders != nil {
		ids := make([]int32, 0, len(data.Artikel))
		for _, item := range data.Artikel {
			ids = append(ids, item.IDPenulis)
		}
		ctx = loaders.UserLoader.BatchLoad(ctx, ids)
	}

	items := make([]*ArtikelPendingItem, len(data.Artikel))
	for i, item := range data.Artikel {
		items[i] = &ArtikelPendingItem{
			IDArtikel:     int(item.IDArtikel),
			Judul:         item.Judul,
			IDPenulis:     int(item.IDPenulis),
			CreatedAt:     item.CreatedAt,
			StatusArtikel: item.StatusArtikel,
		}
	}

	return &ArtikelPendingPayload{
		Items: items,
		Meta: &PageInfo{
			CurrentPage: int(data.Meta.CurrentPage),
			PerPage:     int(data.Meta.PerPage),
			Total:       int(data.Meta.Total),
			LastPage:    int(data.Meta.LastPage),
		},
	}, nil
}

// --- Mutation resolvers ---

func (r *mutationResolver) CreateArtikel(ctx context.Context, input CreateArtikelInput) (*CreateArtikelPayload, error) {
	claims := httputils.GetAccessClaim(ctx)
	if claims == nil {
		return nil, &errorutils.Error{Status: 401, Message: "Silahkan login terlebih dahulu."}
	}

	svc := r.Resolver.ArtikelService
	isDinkes := slices.Contains(claims.Roles, "DINKES")

	data, err := svc.Create(ctx, claims.IDUser, isDinkes, &artikelDomain.CreateArtikelRequest{
		Judul:      input.Judul,
		IsiArtikel: input.IsiArtikel,
		Kategori:   safePtrStr(input.Kategori),
	})
	if err != nil {
		return nil, err
	}

	return &CreateArtikelPayload{
		IDArtikel:     int(data.IDArtikel),
		StatusArtikel: data.StatusArtikel,
	}, nil
}

func (r *mutationResolver) UpdateArtikel(ctx context.Context, id int, input UpdateArtikelInput) (*Artikel, error) {
	claims := httputils.GetAccessClaim(ctx)
	if claims == nil {
		return nil, &errorutils.Error{Status: 401, Message: "Silahkan login terlebih dahulu."}
	}

	svc := r.Resolver.ArtikelService
	isDinkes := slices.Contains(claims.Roles, "DINKES")

	detail, err := svc.Update(ctx, claims.IDUser, isDinkes, &artikelDomain.UpdateArtikelRequest{
		Judul:      input.Judul,
		IsiArtikel: input.IsiArtikel,
		Kategori:   input.Kategori,
	}, int32(id))
	if err != nil {
		return nil, err
	}

	return &Artikel{
		IDArtikel:      int(detail.IDArtikel),
		Judul:          detail.Judul,
		IsiArtikel:     detail.IsiArtikel,
		Kategori:       strPtr(detail.Kategori),
		StatusArtikel:  detail.StatusArtikel,
		TanggalPublish: detail.TanggalPublish,
		CreatedAt:      detail.CreatedAt,
		UpdatedAt:      detail.UpdatedAt,
	}, nil
}

func (r *mutationResolver) DeleteArtikel(ctx context.Context, id int) (bool, error) {
	claims := httputils.GetAccessClaim(ctx)
	if claims == nil {
		return false, &errorutils.Error{Status: 401, Message: "Silahkan login terlebih dahulu."}
	}
	if !slices.Contains(claims.Roles, "DINKES") && !slices.Contains(claims.Roles, "SUPER_ADMIN") {
		return false, &errorutils.Error{Status: 403, Message: "Tidak mempunyai akses."}
	}

	svc := r.Resolver.ArtikelService
	err := svc.Delete(ctx, int32(id))
	if err != nil {
		return false, err
	}
	return true, nil
}

func (r *mutationResolver) ReviewArtikel(ctx context.Context, id int, input ReviewArtikelInput) (*ReviewArtikelPayload, error) {
	claims := httputils.GetAccessClaim(ctx)
	if claims == nil {
		return nil, &errorutils.Error{Status: 401, Message: "Silahkan login terlebih dahulu."}
	}
	if !slices.Contains(claims.Roles, "DINKES") && !slices.Contains(claims.Roles, "SUPER_ADMIN") {
		return nil, &errorutils.Error{Status: 403, Message: "Tidak mempunyai akses."}
	}

	svc := r.Resolver.ArtikelService
	data, err := svc.Review(ctx, claims.IDUser, int32(id), &artikelDomain.ReviewArtikelRequest{
		Aksi:          input.Aksi,
		CatatanReview: safePtrStr(input.CatatanReview),
	})
	if err != nil {
		return nil, err
	}

	return &ReviewArtikelPayload{
		IDArtikel:      int(data.IDArtikel),
		StatusArtikel:  data.StatusArtikel,
		TanggalPublish: data.TanggalPublish,
	}, nil
}

// --- Field resolvers for Artikel type ---

func (r *artikelResolver) Penulis(ctx context.Context, obj *Artikel) (*User, error) {
	if loaders := LoadersFromContext(ctx); loaders != nil {
		name := loaders.UserLoader.GetUser(ctx, int32(obj.IDPenulis))
		return &User{IDUser: obj.IDPenulis, Nama: name}, nil
	}
	return &User{IDUser: obj.IDPenulis}, nil
}

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

// --- Field resolvers for ArtikelListItem type ---

func (r *artikelListItemResolver) Penulis(ctx context.Context, obj *ArtikelListItem) (*User, error) {
	if loaders := LoadersFromContext(ctx); loaders != nil {
		name := loaders.UserLoader.GetUser(ctx, int32(obj.IDPenulis))
		return &User{IDUser: obj.IDPenulis, Nama: name}, nil
	}
	return &User{IDUser: obj.IDPenulis}, nil
}

// --- Field resolvers for ArtikelPendingItem type ---

func (r *artikelPendingItemResolver) Penulis(ctx context.Context, obj *ArtikelPendingItem) (*User, error) {
	if loaders := LoadersFromContext(ctx); loaders != nil {
		name := loaders.UserLoader.GetUser(ctx, int32(obj.IDPenulis))
		return &User{IDUser: obj.IDPenulis, Nama: name}, nil
	}
	return &User{IDUser: obj.IDPenulis}, nil
}

// --- Helper functions ---

func ptrToInt(p *int) int {
	if p == nil {
		return 0
	}
	return *p
}

func strPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func safePtrStr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
