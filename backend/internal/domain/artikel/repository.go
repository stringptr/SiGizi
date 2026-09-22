package artikel

import (
	"context"

	"github.com/stringptr/SiGizi/backend/internal/infrastructure/jet/imunisasi/public/model"
)

type Repo interface {
	GetAllPublished(ctx context.Context, page int, perPage int) ([]*ArtikelJoinRow, int, error)
	GetAll(ctx context.Context, page int, perPage int) ([]*ArtikelJoinRow, int, error)
	GetByID(ctx context.Context, idArtikel int32) (*model.Artikel, error)
	GetDetailJoinByID(ctx context.Context, idArtikel int32) (*DetailJoinRow, error)
	GetPending(ctx context.Context, page int, perPage int) ([]*PendingJoinRow, int, error)
	GetPenulisByID(ctx context.Context, idUser int32) (string, error)
	Create(ctx context.Context, data *model.Artikel) error
	Update(ctx context.Context, data *model.Artikel) error
	Delete(ctx context.Context, idArtikel int32) error
	ReviewArtikel(ctx context.Context, idArtikel int32, idVerifikator int32, aksi string) (*model.Artikel, error)
}

type ArtikelJoinRow struct {
	IDArtikel      int32
	Judul          string
	Kategori       string
	Ringkasan      string
	IDPenulis      int32
	NamaPenulis    string
	TanggalPublish string
	StatusArtikel  string
}

type DetailJoinRow struct {
	IDArtikel       int32
	Judul           string
	IsiArtikel      string
	Kategori        string
	NamaPenulis     string
	NamaVerifikator *string
	TanggalPublish  *string
	CreatedAt       string
	UpdatedAt       string
}

type PendingJoinRow struct {
	IDArtikel     int32
	Judul         string
	IDPenulis     int32
	NamaPenulis   string
	CreatedAt     string
	StatusArtikel string
}
