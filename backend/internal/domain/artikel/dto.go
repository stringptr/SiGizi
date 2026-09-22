package artikel

import "github.com/stringptr/SiGizi/backend/internal/pagination"

type GetAllPublishedRequest struct {
	Page    int `query:"page" minimum:"1" default:"1"`
	PerPage int `query:"per_page" minimum:"1" maximum:"100" default:"20"`
}

type GetPendingRequest struct {
	Page    int `query:"page" minimum:"1" default:"1"`
	PerPage int `query:"per_page" minimum:"1" maximum:"100" default:"20"`
}

type CreateArtikelRequest struct {
	Judul      string `json:"judul" minLength:"1" maxLength:"255"`
	IsiArtikel string `json:"isi_artikel" minLength:"1"`
	Kategori   string `json:"kategori,omitempty" maxLength:"100"`
}

type CreateArtikelResponse struct {
	IDArtikel     int32  `json:"id_artikel"`
	StatusArtikel string `json:"status_artikel"`
}

type ArtikelListItem struct {
	IDArtikel      int32  `json:"id_artikel"`
	Judul          string `json:"judul"`
	Kategori       string `json:"kategori"`
	Ringkasan      string `json:"ringkasan"`
	IDPenulis      int32  `json:"id_penulis"`
	NamaPenulis    string `json:"nama_penulis"`
	TanggalPublish string `json:"tanggal_publish"`
	StatusArtikel  string `json:"status_artikel"`
}

type ArtikelListData struct {
	Artikel []ArtikelListItem `json:"artikel"`
	Meta    pagination.Meta   `json:"meta"`
}

type ArtikelDetail struct {
	IDArtikel       int32   `json:"id_artikel"`
	Judul           string  `json:"judul"`
	IsiArtikel      string  `json:"isi_artikel"`
	Kategori        string  `json:"kategori"`
	NamaPenulis     string  `json:"nama_penulis"`
	NamaVerifikator *string `json:"nama_verifikator"`
	TanggalPublish  *string `json:"tanggal_publish"`
	CreatedAt       string  `json:"created_at"`
	UpdatedAt       string  `json:"updated_at"`
}

type UpdateArtikelRequest struct {
	Judul      *string `json:"judul,omitempty" minLength:"1" maxLength:"255"`
	IsiArtikel *string `json:"isi_artikel,omitempty" minLength:"1"`
	Kategori   *string `json:"kategori,omitempty" maxLength:"100"`
}

type ArtikelPendingItem struct {
	IDArtikel     int32  `json:"id_artikel"`
	Judul         string `json:"judul"`
	IDPenulis     int32  `json:"id_penulis"`
	NamaPenulis   string `json:"nama_penulis"`
	CreatedAt     string `json:"created_at"`
	StatusArtikel string `json:"status_artikel"`
}

type ArtikelPendingData struct {
	Artikel []ArtikelPendingItem `json:"artikel"`
	Meta    pagination.Meta      `json:"meta"`
}

type ReviewArtikelRequest struct {
	Aksi          string `json:"aksi" enum:"setujui,tolak"`
	CatatanReview string `json:"catatan_review,omitempty"`
}

type ReviewArtikelResponse struct {
	IDArtikel      int32   `json:"id_artikel"`
	StatusArtikel  string  `json:"status_artikel"`
	TanggalPublish *string `json:"tanggal_publish"`
}

type UpdateArtikelInput struct {
	IDArtikel int32 `path:"id" minimum:"1"`
	Body      *UpdateArtikelRequest
}
