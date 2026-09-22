package artikel

import (
	"context"
	"time"

	artikelDomain "github.com/stringptr/SiGizi/backend/internal/domain/artikel"
	"github.com/stringptr/SiGizi/backend/internal/infrastructure/jet/imunisasi/public/enum"
	"github.com/stringptr/SiGizi/backend/internal/infrastructure/jet/imunisasi/public/model"
	. "github.com/stringptr/SiGizi/backend/internal/infrastructure/jet/imunisasi/public/table"

	"github.com/go-jet/jet/v2/pgxV5"
	. "github.com/go-jet/jet/v2/postgres"
	"github.com/jackc/pgx/v5/pgxpool"
)

var statusArtikelExpr = map[model.StatusArtikel]StringExpression{
	model.StatusArtikel_Draft:              enum.StatusArtikel.Draft,
	model.StatusArtikel_MenungguVerifikasi: enum.StatusArtikel.MenungguVerifikasi,
	model.StatusArtikel_Dipublikasikan:     enum.StatusArtikel.Dipublikasikan,
	model.StatusArtikel_Ditolak:            enum.StatusArtikel.Ditolak,
	model.StatusArtikel_Diarsipkan:         enum.StatusArtikel.Diarsipkan,
}

type Repo struct {
	db *pgxpool.Pool
}

func NewRepo(db *pgxpool.Pool) *Repo {
	return &Repo{db: db}
}

func (r *Repo) GetAllPublished(ctx context.Context, page int, perPage int) ([]*artikelDomain.ArtikelJoinRow, int, error) {
	offset := int64((page - 1) * perPage)

	fromWhere := `
		FROM artikel a
		JOIN user_account penulis ON penulis.id_user = a.id_penulis
		WHERE a.status_artikel = 'Dipublikasikan'
	`

	var countResult struct{ Count int64 }
	err := pgxV5.Query(ctx, RawStatement("SELECT COUNT(*)"+fromWhere), r.db, &countResult)
	if err != nil {
		return nil, 0, err
	}

	dataSQL := `
		SELECT
			a.id_artikel,
			a.judul,
			COALESCE(a.kategori, '') AS kategori,
			LEFT(a.isi_artikel, 200) AS ringkasan,
			a.id_penulis,
			penulis.nama AS nama_penulis,
			COALESCE(a.tanggal_publish::text, '') AS tanggal_publish,
			a.status_artikel::text AS status_artikel
	` + fromWhere + `
		ORDER BY a.tanggal_publish DESC
		OFFSET $1 LIMIT $2
	`

	pgxRows, err := r.db.Query(ctx, dataSQL, offset, perPage)
	if err != nil {
		return nil, 0, err
	}
	defer pgxRows.Close()

	var rows []*artikelDomain.ArtikelJoinRow
	for pgxRows.Next() {
		var row artikelDomain.ArtikelJoinRow
		err := pgxRows.Scan(&row.IDArtikel, &row.Judul, &row.Kategori, &row.Ringkasan, &row.IDPenulis, &row.NamaPenulis, &row.TanggalPublish, &row.StatusArtikel)
		if err != nil {
			return nil, 0, err
		}
		rows = append(rows, &row)
	}

	return rows, int(countResult.Count), nil
}

func (r *Repo) GetAll(ctx context.Context, page int, perPage int) ([]*artikelDomain.ArtikelJoinRow, int, error) {
	offset := int64((page - 1) * perPage)

	fromWhere := `
		FROM artikel a
		JOIN user_account penulis ON penulis.id_user = a.id_penulis
	`

	var countResult struct{ Count int64 }
	err := pgxV5.Query(ctx, RawStatement("SELECT COUNT(*)"+fromWhere), r.db, &countResult)
	if err != nil {
		return nil, 0, err
	}

	dataSQL := `
		SELECT
			a.id_artikel,
			a.judul,
			COALESCE(a.kategori, '') AS kategori,
			LEFT(a.isi_artikel, 200) AS ringkasan,
			a.id_penulis,
			penulis.nama AS nama_penulis,
			COALESCE(a.tanggal_publish::text, '') AS tanggal_publish,
			a.status_artikel::text AS status_artikel
	` + fromWhere + `
		ORDER BY a.created_at DESC
		OFFSET $1 LIMIT $2
	`

	pgxRows, err := r.db.Query(ctx, dataSQL, offset, perPage)
	if err != nil {
		return nil, 0, err
	}
	defer pgxRows.Close()

	var rows []*artikelDomain.ArtikelJoinRow
	for pgxRows.Next() {
		var row artikelDomain.ArtikelJoinRow
		err := pgxRows.Scan(&row.IDArtikel, &row.Judul, &row.Kategori, &row.Ringkasan, &row.IDPenulis, &row.NamaPenulis, &row.TanggalPublish, &row.StatusArtikel)
		if err != nil {
			return nil, 0, err
		}
		rows = append(rows, &row)
	}

	return rows, int(countResult.Count), nil
}

func (r *Repo) GetByID(ctx context.Context, idArtikel int32) (*model.Artikel, error) {
	var results []*model.Artikel
	stmt := SELECT(Artikel.AllColumns).
		FROM(Artikel).
		WHERE(Artikel.IDArtikel.EQ(Int32(idArtikel)))
	err := pgxV5.Query(ctx, stmt, r.db, &results)
	if err != nil {
		return nil, err
	}
	if len(results) == 0 {
		return nil, nil
	}
	return results[0], nil
}

func (r *Repo) GetDetailJoinByID(ctx context.Context, idArtikel int32) (*artikelDomain.DetailJoinRow, error) {
	sql := `
		SELECT
			a.id_artikel,
			a.judul,
			a.isi_artikel,
			COALESCE(a.kategori, '') AS kategori,
			penulis.nama AS nama_penulis,
			verifikator.nama AS nama_verifikator,
			a.tanggal_publish::text AS tanggal_publish,
			a.created_at::text AS created_at,
			a.updated_at::text AS updated_at
		FROM artikel a
		JOIN user_account penulis ON penulis.id_user = a.id_penulis
		LEFT JOIN user_account verifikator ON verifikator.id_user = a.id_verifikator
		WHERE a.id_artikel = $1 AND a.status_artikel = 'Dipublikasikan'
		LIMIT 1
	`

	pgxRows, err := r.db.Query(ctx, sql, idArtikel)
	if err != nil {
		return nil, err
	}
	defer pgxRows.Close()

	if !pgxRows.Next() {
		return nil, nil
	}

	var row artikelDomain.DetailJoinRow
	err = pgxRows.Scan(&row.IDArtikel, &row.Judul, &row.IsiArtikel, &row.Kategori, &row.NamaPenulis, &row.NamaVerifikator, &row.TanggalPublish, &row.CreatedAt, &row.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *Repo) GetPending(ctx context.Context, page int, perPage int) ([]*artikelDomain.PendingJoinRow, int, error) {
	offset := int64((page - 1) * perPage)

	fromWhere := `
		FROM artikel a
		JOIN user_account penulis ON penulis.id_user = a.id_penulis
		WHERE a.status_artikel = 'Menunggu Verifikasi'
	`

	var countResult struct{ Count int64 }
	err := pgxV5.Query(ctx, RawStatement("SELECT COUNT(*)"+fromWhere), r.db, &countResult)
	if err != nil {
		return nil, 0, err
	}

	dataSQL := `
		SELECT
			a.id_artikel,
			a.judul,
			a.id_penulis,
			penulis.nama AS nama_penulis,
			a.created_at::text,
			a.status_artikel::text
	` + fromWhere + `
		ORDER BY a.created_at DESC
		OFFSET $1 LIMIT $2
	`

	pgxRows, err := r.db.Query(ctx, dataSQL, offset, perPage)
	if err != nil {
		return nil, 0, err
	}
	defer pgxRows.Close()

	var rows []*artikelDomain.PendingJoinRow
	for pgxRows.Next() {
		var row artikelDomain.PendingJoinRow
		err := pgxRows.Scan(&row.IDArtikel, &row.Judul, &row.IDPenulis, &row.NamaPenulis, &row.CreatedAt, &row.StatusArtikel)
		if err != nil {
			return nil, 0, err
		}
		rows = append(rows, &row)
	}

	return rows, int(countResult.Count), nil
}

func (r *Repo) GetPenulisByID(ctx context.Context, idUser int32) (string, error) {
	var results []struct {
		Nama string
	}
	stmt := SELECT(UserAccount.Nama).
		FROM(UserAccount).
		WHERE(UserAccount.IDUser.EQ(Int32(idUser)))
	err := pgxV5.Query(ctx, stmt, r.db, &results)
	if err != nil {
		return "", err
	}
	if len(results) == 0 {
		return "", nil
	}
	return results[0].Nama, nil
}

func (r *Repo) Create(ctx context.Context, data *model.Artikel) error {
	stmt := Artikel.INSERT(
		Artikel.Judul,
		Artikel.IsiArtikel,
		Artikel.Kategori,
		Artikel.StatusArtikel,
		Artikel.IDPenulis,
		Artikel.CreatedAt,
		Artikel.UpdatedAt,
	).MODEL(data).
		RETURNING(Artikel.IDArtikel)

	var results []*model.Artikel
	err := pgxV5.Query(ctx, stmt, r.db, &results)
	if err != nil {
		return err
	}
	if len(results) > 0 {
		data.IDArtikel = results[0].IDArtikel
	}
	return nil
}

func (r *Repo) Update(ctx context.Context, data *model.Artikel) error {
	stmt := Artikel.UPDATE(
		Artikel.Judul,
		Artikel.IsiArtikel,
		Artikel.Kategori,
		Artikel.UpdatedAt,
	).MODEL(data).
		WHERE(Artikel.IDArtikel.EQ(Int32(data.IDArtikel)))

	_, err := pgxV5.Exec(ctx, stmt, r.db)
	return err
}

func (r *Repo) Delete(ctx context.Context, idArtikel int32) error {
	stmt := Artikel.DELETE().
		WHERE(Artikel.IDArtikel.EQ(Int32(idArtikel)))

	_, err := pgxV5.Exec(ctx, stmt, r.db)
	return err
}

func (r *Repo) ReviewArtikel(ctx context.Context, idArtikel int32, idVerifikator int32, aksi string) (*model.Artikel, error) {
	var statusArtikel model.StatusArtikel
	var now = time.Now()

	if aksi == "setujui" {
		statusArtikel = model.StatusArtikel_Dipublikasikan
	} else {
		statusArtikel = model.StatusArtikel_Ditolak
	}

	var results []*model.Artikel
	stmt := Artikel.UPDATE(
		Artikel.StatusArtikel,
		Artikel.IDVerifikator,
		Artikel.TanggalPublish,
		Artikel.UpdatedAt,
	).SET(
		statusArtikelExpr[statusArtikel],
		Int32(idVerifikator),
		TimestampzT(now),
		TimestampzT(now),
	).WHERE(Artikel.IDArtikel.EQ(Int32(idArtikel))).
		RETURNING(Artikel.AllColumns)

	if aksi != "setujui" {
		stmt = Artikel.UPDATE(
			Artikel.StatusArtikel,
			Artikel.IDVerifikator,
			Artikel.UpdatedAt,
		).SET(
			statusArtikelExpr[statusArtikel],
			Int32(idVerifikator),
			TimestampzT(now),
		).WHERE(Artikel.IDArtikel.EQ(Int32(idArtikel))).
			RETURNING(Artikel.AllColumns)
	}

	err := pgxV5.Query(ctx, stmt, r.db, &results)
	if err != nil {
		return nil, err
	}
	if len(results) == 0 {
		return nil, nil
	}
	return results[0], nil
}
