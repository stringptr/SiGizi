package userAccount

import (
	"time"
)

type RegisterRequestDTO struct {
	Email            string    `json:"email"           validate:"required,email"`
	Password         string    `json:"password"        validate:"required,max=255"`
	NoHp             string    `json:"no_hp"           validate:"required,max=20"`
	Nama             string    `json:"nama"            validate:"required,min=1,max=255"`
	NIK              string    `json:"nik"             validate:"required,len=16"`
	JenisKelamin     string    `json:"jenis_kelamin"   validate:"required,oneof=Laki-Laki Perempuan"`
	TanggalLahir     time.Time `json:"tanggal_lahir"   validate:"required"`
	IDLokasi         int32     `json:"id_lokasi"       validate:"required"`
	IDPendidikan     *int32    `json:"id_pendidikan,omitempty"   validate:"min=1"`
	IDPekerjaan      *int32    `json:"id_pekerjaan,omitempty"    validate:"min=1"`
	IDPendapatan     *int32    `json:"id_pendapatan,omitempty"   validate:"min=1"`
	JumlahTanggungan *int32    `json:"jumlah_tanggungan,omitempty" validate:"min=0"`
}

type AdminGetAllResponseDTO struct {
	Email            string    `json:"email"           validate:"required,email"`
	NoHp             string    `json:"no_hp"           validate:"required,max=20"`
	Nama             string    `json:"nama"            validate:"required,min=1,max=255"`
	NIK              string    `json:"nik"             validate:"required,len=16"`
	JenisKelamin     string    `json:"jenis_kelamin"   validate:"required,oneof=Laki-Laki Perempuan"`
	TanggalLahir     time.Time `json:"tanggal_lahir"   validate:"required"`
	IDLokasi         int32     `json:"id_lokasi"       validate:"required"`
	IDPendidikan     *int32    `json:"id_pendidikan"   validate:"min=1"`
	IDPekerjaan      *int32    `json:"id_pekerjaan"    validate:"min=1"`
	IDPendapatan     *int32    `json:"id_pendapatan"   validate:"min=1"`
	JumlahTanggungan *int32    `json:"jumlah_tanggungan" validate:"min=0"`
}
