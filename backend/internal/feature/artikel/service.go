package artikel

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"time"

	artikelDomain "github.com/stringptr/SiGizi/backend/internal/domain/artikel"
	auditlogDomain "github.com/stringptr/SiGizi/backend/internal/domain/auditlog"
	notificationDomain "github.com/stringptr/SiGizi/backend/internal/domain/notification"
	"github.com/stringptr/SiGizi/backend/internal/errorutils"
	"github.com/stringptr/SiGizi/backend/internal/infrastructure/jet/imunisasi/public/model"
	"github.com/stringptr/SiGizi/backend/internal/pagination"
)

type Service struct {
	repo          artikelDomain.Repo
	auditRepo     auditlogDomain.Repo
	notifRepo     notificationDomain.Repo
	notifPublisher notificationDomain.Publisher
}

func NewService(repo artikelDomain.Repo, auditRepo auditlogDomain.Repo, notifRepo notificationDomain.Repo, notifPublisher notificationDomain.Publisher) *Service {
	return &Service{
		repo:          repo,
		auditRepo:     auditRepo,
		notifRepo:     notifRepo,
		notifPublisher: notifPublisher,
	}
}

func (s *Service) logAudit(ctx context.Context, endpoint string, tipeAktivitas model.TipeAktivitas, berhasil bool, tableName string, recordID string, detail string) {
	tipeAktor := model.TipeAktor_User
	s.auditRepo.Log(ctx, &model.AuditLog{
		TipeAktor:     &tipeAktor,
		TipeAktivitas: &tipeAktivitas,
		Berhasil:      &berhasil,
		Endpoint:      &endpoint,
		TableName:     &tableName,
		RecordID:      &recordID,
		Detail:        &detail,
	})
}

func (s *Service) GetAllPublished(ctx context.Context, req *artikelDomain.GetAllPublishedRequest) (*artikelDomain.ArtikelListData, *errorutils.Error) {
	if req == nil {
		req = &artikelDomain.GetAllPublishedRequest{}
	}
	page := pagination.ValidatePage(req.Page)
	perPage := pagination.ValidatePerPage(req.PerPage)

	rows, total, err := s.repo.GetAllPublished(ctx, page, perPage)
	if err != nil {
		return nil, &errorutils.Error{Status: http.StatusInternalServerError, Message: "Terjadi kesalahan. Mohon dicoba kembali."}
	}

	items := make([]artikelDomain.ArtikelListItem, len(rows))
	for i, r := range rows {
		items[i] = artikelDomain.ArtikelListItem{
			IDArtikel:      r.IDArtikel,
			Judul:          r.Judul,
			Kategori:       r.Kategori,
			Ringkasan:      r.Ringkasan,
			IDPenulis:      r.IDPenulis,
			NamaPenulis:    r.NamaPenulis,
			TanggalPublish: r.TanggalPublish,
			StatusArtikel:  r.StatusArtikel,
		}
	}

	if items == nil {
		items = []artikelDomain.ArtikelListItem{}
	}

	return &artikelDomain.ArtikelListData{
		Artikel: items,
		Meta:    pagination.NewMeta(int32(page), int32(perPage), int32(total)),
	}, nil
}

func (s *Service) GetAll(ctx context.Context, req *artikelDomain.GetAllPublishedRequest) (*artikelDomain.ArtikelListData, *errorutils.Error) {
	if req == nil {
		req = &artikelDomain.GetAllPublishedRequest{}
	}
	page := pagination.ValidatePage(req.Page)
	perPage := pagination.ValidatePerPage(req.PerPage)

	rows, total, err := s.repo.GetAll(ctx, page, perPage)
	if err != nil {
		return nil, &errorutils.Error{Status: http.StatusInternalServerError, Message: "Terjadi kesalahan. Mohon dicoba kembali."}
	}

	items := make([]artikelDomain.ArtikelListItem, len(rows))
	for i, r := range rows {
		items[i] = artikelDomain.ArtikelListItem{
			IDArtikel:      r.IDArtikel,
			Judul:          r.Judul,
			Kategori:       r.Kategori,
			Ringkasan:      r.Ringkasan,
			IDPenulis:      r.IDPenulis,
			NamaPenulis:    r.NamaPenulis,
			TanggalPublish: r.TanggalPublish,
			StatusArtikel:  r.StatusArtikel,
		}
	}

	if items == nil {
		items = []artikelDomain.ArtikelListItem{}
	}

	return &artikelDomain.ArtikelListData{
		Artikel: items,
		Meta:    pagination.NewMeta(int32(page), int32(perPage), int32(total)),
	}, nil
}

func (s *Service) GetByID(ctx context.Context, idArtikel int32) (*artikelDomain.ArtikelDetail, *errorutils.Error) {
	row, err := s.repo.GetDetailJoinByID(ctx, idArtikel)
	if err != nil {
		return nil, &errorutils.Error{Status: http.StatusInternalServerError, Message: "Terjadi kesalahan. Mohon dicoba kembali."}
	}
	if row == nil {
		return nil, &errorutils.Error{Status: http.StatusNotFound, Message: "Artikel tidak ditemukan."}
	}

	return &artikelDomain.ArtikelDetail{
		IDArtikel:       row.IDArtikel,
		Judul:           row.Judul,
		IsiArtikel:      row.IsiArtikel,
		Kategori:        row.Kategori,
		NamaPenulis:     row.NamaPenulis,
		NamaVerifikator: row.NamaVerifikator,
		TanggalPublish:  row.TanggalPublish,
		CreatedAt:       row.CreatedAt,
		UpdatedAt:       row.UpdatedAt,
	}, nil
}

func (s *Service) Create(ctx context.Context, idPenulis int32, isDinkes bool, req *artikelDomain.CreateArtikelRequest) (*artikelDomain.CreateArtikelResponse, *errorutils.Error) {
	now := time.Now()
	status := model.StatusArtikel_MenungguVerifikasi
	if isDinkes {
		status = model.StatusArtikel_Dipublikasikan
	}
	modelData := &model.Artikel{
		Judul:         req.Judul,
		IsiArtikel:    req.IsiArtikel,
		Kategori:      strPtr(req.Kategori),
		StatusArtikel: status,
		IDPenulis:     idPenulis,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	err := s.repo.Create(ctx, modelData)
	if err != nil {
		return nil, &errorutils.Error{Status: http.StatusInternalServerError, Message: "Gagal membuat artikel."}
	}

	idStr := strconv.Itoa(int(modelData.IDArtikel))
	s.logAudit(ctx, "POST /artikel", model.TipeAktivitas_DataInsert, true, "artikel", idStr, "Berhasil membuat artikel")

	penulis, _ := s.repo.GetPenulisByID(ctx, idPenulis)
	notifJudul := "Artikel Baru untuk Direview"
	notifPesan := fmt.Sprintf("Artikel '%s' oleh %s telah diajukan dan menunggu review.", req.Judul, penulis)

	s.notifRepo.Create(ctx, &model.Notifikasi{
		IDUser:         idPenulis,
		Judul:          notifJudul,
		Pesan:          &notifPesan,
		TipeNotifikasi: model.TipeNotifikasi_Edukasi,
		StatusBaca:     false,
		TanggalKirim:   time.Now(),
	})

	s.notifPublisher.PublishToUser(idPenulis, &notificationDomain.Notification{
		Judul: notifJudul,
		Pesan: notifPesan,
		Tipe:  string(model.TipeNotifikasi_Edukasi),
	})

	return &artikelDomain.CreateArtikelResponse{
		IDArtikel:     modelData.IDArtikel,
		StatusArtikel: string(status),
	}, nil
}

func (s *Service) Update(ctx context.Context, idPenulis int32, isDinkes bool, req *artikelDomain.UpdateArtikelRequest, idArtikel int32) (*artikelDomain.ArtikelDetail, *errorutils.Error) {
	existing, err := s.repo.GetByID(ctx, idArtikel)
	if err != nil {
		return nil, &errorutils.Error{Status: http.StatusInternalServerError, Message: "Terjadi kesalahan. Mohon dicoba kembali."}
	}
	if existing == nil {
		return nil, &errorutils.Error{Status: http.StatusNotFound, Message: "Artikel tidak ditemukan."}
	}

	if !isDinkes {
		if existing.IDPenulis != idPenulis {
			return nil, &errorutils.Error{Status: http.StatusForbidden, Message: "Anda tidak memiliki izin untuk mengakses ini."}
		}
		if existing.StatusArtikel != model.StatusArtikel_MenungguVerifikasi {
			return nil, &errorutils.Error{Status: http.StatusForbidden, Message: "Artikel sudah diproses dan tidak dapat diedit lagi."}
		}
	}

	if req.Judul != nil {
		existing.Judul = *req.Judul
	}
	if req.IsiArtikel != nil {
		existing.IsiArtikel = *req.IsiArtikel
	}
	if req.Kategori != nil {
		existing.Kategori = req.Kategori
	}

	existing.UpdatedAt = time.Now()

	err = s.repo.Update(ctx, existing)
	if err != nil {
		return nil, &errorutils.Error{Status: http.StatusInternalServerError, Message: "Gagal memperbarui artikel."}
	}

	idStr := strconv.Itoa(int(idArtikel))
	s.logAudit(ctx, "PATCH /artikel/"+idStr, model.TipeAktivitas_DataUpdate, true, "artikel", idStr, "Berhasil memperbarui artikel")

	return s.GetByID(ctx, idArtikel)
}

func (s *Service) Delete(ctx context.Context, idArtikel int32) *errorutils.Error {
	existing, err := s.repo.GetByID(ctx, idArtikel)
	if err != nil {
		return &errorutils.Error{Status: http.StatusInternalServerError, Message: "Terjadi kesalahan. Mohon dicoba kembali."}
	}
	if existing == nil {
		return &errorutils.Error{Status: http.StatusNotFound, Message: "Artikel tidak ditemukan."}
	}

	err = s.repo.Delete(ctx, idArtikel)
	if err != nil {
		return &errorutils.Error{Status: http.StatusInternalServerError, Message: "Gagal menghapus artikel."}
	}

	idStr := strconv.Itoa(int(idArtikel))
	s.logAudit(ctx, "DELETE /artikel/"+idStr, model.TipeAktivitas_DataDelete, true, "artikel", idStr, "Berhasil menghapus artikel")

	return nil
}

func (s *Service) Review(ctx context.Context, idVerifikator int32, idArtikel int32, req *artikelDomain.ReviewArtikelRequest) (*artikelDomain.ReviewArtikelResponse, *errorutils.Error) {
	existing, err := s.repo.GetByID(ctx, idArtikel)
	if err != nil {
		return nil, &errorutils.Error{Status: http.StatusInternalServerError, Message: "Terjadi kesalahan. Mohon dicoba kembali."}
	}
	if existing == nil || existing.StatusArtikel != model.StatusArtikel_MenungguVerifikasi {
		return nil, &errorutils.Error{Status: http.StatusNotFound, Message: "Artikel tidak ditemukan atau bukan dalam status Menunggu Verifikasi."}
	}

	result, err := s.repo.ReviewArtikel(ctx, idArtikel, idVerifikator, req.Aksi)
	if err != nil {
		return nil, &errorutils.Error{Status: http.StatusInternalServerError, Message: "Gagal mereview artikel."}
	}

	status := string(result.StatusArtikel)
	var tanggalPublish *string
	if result.TanggalPublish != nil {
		t := result.TanggalPublish.Format("2006-01-02")
		tanggalPublish = &t
	}

	idStr := strconv.Itoa(int(idArtikel))
	s.logAudit(ctx, "PATCH /artikel/"+idStr+"/review", model.TipeAktivitas_DataUpdate, true, "artikel", idStr, "Berhasil mereview artikel dengan aksi: "+req.Aksi)

	statusLabel := "disetujui dan dipublikasikan"
	if req.Aksi == "tolak" {
		statusLabel = "ditolak"
	}
	notifPesan := fmt.Sprintf("Artikel '%s' telah %s.", existing.Judul, statusLabel)
	s.notifRepo.Create(ctx, &model.Notifikasi{
		IDUser:         existing.IDPenulis,
		Judul:          "Artikel " + statusLabel,
		Pesan:          &notifPesan,
		TipeNotifikasi: model.TipeNotifikasi_Edukasi,
		StatusBaca:     false,
		TanggalKirim:   time.Now(),
	})
	s.notifPublisher.PublishToUser(existing.IDPenulis, &notificationDomain.Notification{
		Judul: "Artikel " + statusLabel,
		Pesan: notifPesan,
		Tipe:  string(model.TipeNotifikasi_Edukasi),
	})

	return &artikelDomain.ReviewArtikelResponse{
		IDArtikel:      idArtikel,
		StatusArtikel:  status,
		TanggalPublish: tanggalPublish,
	}, nil
}

func (s *Service) GetPending(ctx context.Context, req *artikelDomain.GetPendingRequest) (*artikelDomain.ArtikelPendingData, *errorutils.Error) {
	if req == nil {
		req = &artikelDomain.GetPendingRequest{}
	}
	page := pagination.ValidatePage(req.Page)
	perPage := pagination.ValidatePerPage(req.PerPage)

	rows, total, err := s.repo.GetPending(ctx, page, perPage)
	if err != nil {
		return nil, &errorutils.Error{Status: http.StatusInternalServerError, Message: "Terjadi kesalahan. Mohon dicoba kembali."}
	}

	items := make([]artikelDomain.ArtikelPendingItem, len(rows))
	for i, r := range rows {
		items[i] = artikelDomain.ArtikelPendingItem{
			IDArtikel:     r.IDArtikel,
			Judul:         r.Judul,
			IDPenulis:     r.IDPenulis,
			NamaPenulis:   r.NamaPenulis,
			CreatedAt:     r.CreatedAt,
			StatusArtikel: r.StatusArtikel,
		}
	}

	if items == nil {
		items = []artikelDomain.ArtikelPendingItem{}
	}

	return &artikelDomain.ArtikelPendingData{
		Artikel: items,
		Meta:    pagination.NewMeta(int32(page), int32(perPage), int32(total)),
	}, nil
}

func strPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
