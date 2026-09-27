package graphql

// This file contains the QUERY resolvers for the artikel service.
// Mutation resolvers live in artikel.resolvers.go (Orang 2 — mutations,
// logic & workflow); field resolvers and resolver plumbing also live there.

import (
	"context"
	"slices"

	artikelDomain "github.com/stringptr/SiGizi/backend/internal/domain/artikel"
	"github.com/stringptr/SiGizi/backend/internal/errorutils"
	"github.com/stringptr/SiGizi/backend/internal/httputils"
	"github.com/stringptr/SiGizi/backend/internal/pagination"
)

// Artikel is the resolver for the artikel field.
func (r *queryResolver) Artikel(ctx context.Context, id int) (*Artikel, error) {
	repo := r.ArtikelRepo

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
		loaders.UserLoader.BatchLoad(ctx, ids)
	}

	a := &Artikel{
		IDArtikel:     int(article.IDArtikel),
		Judul:         article.Judul,
		IsiArtikel:    article.IsiArtikel,
		Kategori:      article.Kategori,
		StatusArtikel: string(article.StatusArtikel),
		IDPenulis:     int(article.IDPenulis),
	}

	if detail != nil {
		a.TanggalPublish = detail.TanggalPublish
		a.CreatedAt = detail.CreatedAt
		a.UpdatedAt = detail.UpdatedAt
	} else {
		created := article.CreatedAt.Format("2006-01-02T15:04:05Z07:00")
		updated := article.UpdatedAt.Format("2006-01-02T15:04:05Z07:00")
		a.CreatedAt = created
		a.UpdatedAt = updated
	}

	if article.IDVerifikator != nil {
		idVer := int(*article.IDVerifikator)
		a.IDVerifikator = &idVer
	}

	return a, nil
}

// DaftarArtikel is the resolver for the daftarArtikel field.
func (r *queryResolver) DaftarArtikel(ctx context.Context, page *int, perPage *int) (*ArtikelListPayload, error) {
	svc := r.ArtikelService
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
		loaders.UserLoader.BatchLoad(ctx, ids)
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

// DaftarArtikelSemua is the resolver for the daftarArtikelSemua field.
func (r *queryResolver) DaftarArtikelSemua(ctx context.Context, page *int, perPage *int) (*ArtikelListPayload, error) {
	claims := httputils.GetAccessClaim(ctx)
	if claims == nil {
		return nil, &errorutils.Error{Status: 401, Message: "Silahkan login terlebih dahulu."}
	}
	if !slices.Contains(claims.Roles, "ADMIN") && !slices.Contains(claims.Roles, "SUPER_ADMIN") {
		return nil, &errorutils.Error{Status: 403, Message: "Tidak mempunyai akses."}
	}

	svc := r.ArtikelService
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
		loaders.UserLoader.BatchLoad(ctx, ids)
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

// DaftarArtikelPending is the resolver for the daftarArtikelPending field.
func (r *queryResolver) DaftarArtikelPending(ctx context.Context, page *int, perPage *int) (*ArtikelPendingPayload, error) {
	claims := httputils.GetAccessClaim(ctx)
	if claims == nil {
		return nil, &errorutils.Error{Status: 401, Message: "Silahkan login terlebih dahulu."}
	}
	if !slices.Contains(claims.Roles, "DINKES") && !slices.Contains(claims.Roles, "SUPER_ADMIN") {
		return nil, &errorutils.Error{Status: 403, Message: "Tidak mempunyai akses."}
	}

	svc := r.ArtikelService
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
		loaders.UserLoader.BatchLoad(ctx, ids)
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

// Query returns QueryResolver implementation.
func (r *Resolver) Query() QueryResolver { return &queryResolver{r} }

type queryResolver struct{ *Resolver }
