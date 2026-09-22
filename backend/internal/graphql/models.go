package graphql

type Artikel struct {
	IDArtikel      int     `json:"idArtikel"`
	Judul          string  `json:"judul"`
	IsiArtikel     string  `json:"isiArtikel"`
	Kategori       *string `json:"kategori"`
	StatusArtikel  string  `json:"statusArtikel"`
	IDPenulis      int     `json:"idPenulis"`
	IDVerifikator  *int    `json:"idVerifikator"`
	TanggalPublish *string `json:"tanggalPublish"`
	CreatedAt      string  `json:"createdAt"`
	UpdatedAt      string  `json:"updatedAt"`
}

type ArtikelListItem struct {
	IDArtikel      int    `json:"idArtikel"`
	Judul          string `json:"judul"`
	Kategori       string `json:"kategori"`
	Ringkasan      string `json:"ringkasan"`
	IDPenulis      int    `json:"idPenulis"`
	TanggalPublish string `json:"tanggalPublish"`
	StatusArtikel  string `json:"statusArtikel"`
}

type ArtikelPendingItem struct {
	IDArtikel     int    `json:"idArtikel"`
	Judul         string `json:"judul"`
	IDPenulis     int    `json:"idPenulis"`
	CreatedAt     string `json:"createdAt"`
	StatusArtikel string `json:"statusArtikel"`
}

type User struct {
	IDUser int    `json:"idUser"`
	Nama   string `json:"nama"`
}

type PageInfo struct {
	CurrentPage int `json:"currentPage"`
	PerPage     int `json:"perPage"`
	Total       int `json:"total"`
	LastPage    int `json:"lastPage"`
}

type ArtikelListPayload struct {
	Items []*ArtikelListItem `json:"items"`
	Meta  *PageInfo          `json:"meta"`
}

type ArtikelPendingPayload struct {
	Items []*ArtikelPendingItem `json:"items"`
	Meta  *PageInfo             `json:"meta"`
}

type CreateArtikelPayload struct {
	IDArtikel     int    `json:"idArtikel"`
	StatusArtikel string `json:"statusArtikel"`
}

type ReviewArtikelPayload struct {
	IDArtikel      int     `json:"idArtikel"`
	StatusArtikel  string  `json:"statusArtikel"`
	TanggalPublish *string `json:"tanggalPublish"`
}
