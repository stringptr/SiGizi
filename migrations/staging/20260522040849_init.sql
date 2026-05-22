-- +goose Up

-- ============================================================
-- DATABASE
-- SQL SERVER VERSION
-- ============================================================

-- CREATE DATABASE imunisasi;
-- GO

USE imunisasi;
GO

-- ============================================================
-- DROP ALL TABLES
-- ============================================================

DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS notifikasi;
DROP TABLE IF EXISTS rujukan;
DROP TABLE IF EXISTS tindak_lanjut;
DROP TABLE IF EXISTS hasil_pemeriksaan;
DROP TABLE IF EXISTS artikel;
DROP TABLE IF EXISTS jadwal_imunisasi;
DROP TABLE IF EXISTS anak;
DROP TABLE IF EXISTS ibu_hamil;
DROP TABLE IF EXISTS kategori_pendapatan;
DROP TABLE IF EXISTS pekerjaan;
DROP TABLE IF EXISTS pendidikan;
DROP TABLE IF EXISTS pasien;
DROP TABLE IF EXISTS fasilitas_kesehatan;
DROP TABLE IF EXISTS kader_posyandu;
DROP TABLE IF EXISTS posyandu;
DROP TABLE IF EXISTS bidan;
DROP TABLE IF EXISTS dinas_kesehatan;
DROP TABLE IF EXISTS user_account;
DROP TABLE IF EXISTS lokasi;
GO

-- ============================================================
-- 1. LOKASI STAGING
-- ============================================================

CREATE TABLE lokasi (
    id_lokasi INT,

    nama_lokasi VARCHAR(255),

    tipe_lokasi VARCHAR(50)
        CHECK (
            tipe_lokasi IN (
                'Provinsi',
                'Kabupaten',
                'Kota',
                'Kecamatan',
                'Kelurahan'
            )
        ),

    bagian_dari INT
);

-- ============================================================
-- 2. USER ACCOUNT STAGING
-- ============================================================

CREATE TABLE user_account (
    id_user INT,

    email VARCHAR(255),

    password VARCHAR(255),

    no_hp VARCHAR(20),

    status_verifikasi BIT DEFAULT 0,

    nama VARCHAR(255),

    nik CHAR(16)
        CHECK (
            nik NOT LIKE '%[^0-9]%'
            AND LEN(nik) = 16
        ),

    jenis_kelamin VARCHAR(20)
        CHECK (
            jenis_kelamin IN (
                'Laki-laki',
                'Perempuan'
            )
        ),

    tanggal_lahir DATE,

    id_lokasi INT,

    id_pendidikan INT,

    id_pekerjaan INT,

    id_pendapatan INT,

    jumlah_tanggungan INT
        CHECK (jumlah_tanggungan >= 0),

    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),

    updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);

-- ============================================================
-- 3. DINAS KESEHATAN STAGING
-- ============================================================

CREATE TABLE dinas_kesehatan (
    id_user INT,

    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),

    updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);

-- ============================================================
-- 4. BIDAN STAGING
-- ============================================================

CREATE TABLE bidan (
    id_user INT,

    no_str VARCHAR(100),

    wilayah_kerja INT,

    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),

    updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);

-- ============================================================
-- 5. POSYANDU STAGING
-- ============================================================

CREATE TABLE posyandu (
    id_posyandu INT,

    nama_posyandu VARCHAR(255),

    id_lokasi INT,

    id_bidan INT,

    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),

    updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);

-- ============================================================
-- 6. KADER POSYANDU STAGING
-- ============================================================

CREATE TABLE kader_posyandu (
    id_user INT,

    no_sk VARCHAR(100),

    id_posyandu INT,

    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),

    updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);

-- ============================================================
-- 7. PASIEN STAGING
-- ============================================================

CREATE TABLE pasien (
    id_pasien INT,

    id_posyandu INT,

    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),

    updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);

-- ============================================================
-- 8. FASILITAS KESEHATAN STAGING
-- ============================================================

CREATE TABLE fasilitas_kesehatan (
    id_faskes INT,

    nama_faskes VARCHAR(255),

    tipe_faskes VARCHAR(50)
        CHECK (
            tipe_faskes IN (
                'Faskes Tingkat Pertama',
                'Faskes Rujukan Tingkat Lanjutan',
                'Faskes Penunjang'
            )
        ),

    id_lokasi INT,

    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),

    updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);

-- ============================================================
-- 9. PENDIDIKAN STAGING
-- ============================================================

CREATE TABLE pendidikan (
    id_pendidikan INT,

    nama_pendidikan VARCHAR(50),

    jenjang VARCHAR(50),

    lama_tahun INT
        CHECK (lama_tahun >= 0)
);

-- ============================================================
-- 10. PEKERJAAN STAGING
-- ============================================================

CREATE TABLE pekerjaan (
    id_pekerjaan INT,

    nama_pekerjaan VARCHAR(100),

    sektor VARCHAR(50)
        CHECK (
            sektor IN (
                'Formal',
                'Informal',
                'Pemerintah',
                'Kesehatan',
                'Pendidikan',
                'Pertanian',
                'Domestik',
                'Transportasi'
            )
        )
);

-- ============================================================
-- 11. KATEGORI PENDAPATAN STAGING
-- ============================================================

CREATE TABLE kategori_pendapatan (
    id_pendapatan INT,

    kategori_pendapatan VARCHAR(100),

    pendapatan_min DECIMAL(12,2)
        CHECK (pendapatan_min >= 0),

    pendapatan_max DECIMAL(12,2)
);

-- ============================================================
-- 12. IBU HAMIL STAGING
-- ============================================================

CREATE TABLE ibu_hamil (
    id_ibu_hamil INT,

    id_pasien INT,

    hamil_ke INT
        CHECK (hamil_ke > 0),

    bulan_mulai_hamil DATE,

    hpht DATE,

    status_kehamilan VARCHAR(30)
        CHECK (
            status_kehamilan IN (
                'Trimester 1',
                'Trimester 2',
                'Trimester 3',
                'Melahirkan',
                'Nifas',
                'Keguguran'
            )
        ),

    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),

    updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);

-- ============================================================
-- 13. ANAK STAGING
-- ============================================================

CREATE TABLE anak (
    id_pasien INT,

    id_ibu_hamil INT,

    id_wali INT,

    nama_anak VARCHAR(255),

    nik CHAR(16)
        CHECK (
            nik NOT LIKE '%[^0-9]%'
            AND LEN(nik) = 16
        ),

    tanggal_lahir DATE,

    jenis_kelamin VARCHAR(20)
        CHECK (
            jenis_kelamin IN (
                'Laki-laki',
                'Perempuan'
            )
        ),

    berat_lahir DECIMAL(5,2),

    panjang_lahir DECIMAL(5,2),

    hubungan_dengan_ibu VARCHAR(20)
        CHECK (
            hubungan_dengan_ibu IN (
                'Kandung',
                'Tiri',
                'Angkat'
            )
        ),

    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),

    updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);

-- ============================================================
-- 14. JADWAL IMUNISASI STAGING
-- ============================================================

CREATE TABLE jadwal_imunisasi (
    id_imunisasi INT,

    id_pasien INT,

    nama_vaksin VARCHAR(255),

    tanggal_jadwal DATE,

    tanggal_realisasi DATE,

    status_imunisasi VARCHAR(10)
        CHECK (
            status_imunisasi IN (
                'Sudah',
                'Belum'
            )
        ),

    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),

    updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);

-- ============================================================
-- 15. ARTIKEL STAGING
-- ============================================================

CREATE TABLE artikel (
    id_artikel INT,

    judul VARCHAR(255),

    isi_artikel VARCHAR(MAX),

    kategori VARCHAR(100),

    status_artikel VARCHAR(50)
        CHECK (
            status_artikel IN (
                'Draft',
                'Menunggu Verifikasi',
                'Dipublikasikan',
                'Ditolak',
                'Diarsipkan'
            )
        ),

    id_penulis INT,

    id_verifikator INT,

    tanggal_publish DATE,

    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),

    updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);

-- ============================================================
-- 16. HASIL PEMERIKSAAN STAGING
-- ============================================================

CREATE TABLE hasil_pemeriksaan (
    id_hasil_pemeriksaan INT,

    id_petugas_input INT,

    id_jadwal_imunisasi INT,

    berat_badan DECIMAL(5,2),

    tinggi_badan DECIMAL(5,2),

    lingkar_kepala DECIMAL(5,2),

    tekanan_darah VARCHAR(20),

    status_stunting VARCHAR(30)
        CHECK (
            status_stunting IN (
                'Normal',
                'Berisiko Stunting',
                'Stunting',
                'Stunting Berat'
            )
        ),

    status_gizi VARCHAR(30)
        CHECK (
            status_gizi IN (
                'Gizi Baik',
                'Gizi Kurang',
                'Gizi Buruk',
                'Risiko Gizi Lebih',
                'Gizi Lebih',
                'Obesitas'
            )
        ),

    catatan VARCHAR(1000),

    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),

    updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);

-- ============================================================
-- 17. TINDAK LANJUT STAGING
-- ============================================================

CREATE TABLE tindak_lanjut (
    id_tindak_lanjut INT,

    id_hasil_pemeriksaan INT,

    id_bidan INT,

    catatan_medis VARCHAR(1000),

    rekomendasi VARCHAR(1000),

    jadwal_kontrol DATE,

    status_pasien VARCHAR(50)
        CHECK (
            status_pasien IN (
                'Dalam Pemantauan',
                'Membaik',
                'Perlu Rujukan',
                'Selesai Pemantauan'
            )
        ),

    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),

    updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);

-- ============================================================
-- 18. RUJUKAN STAGING
-- ============================================================

CREATE TABLE rujukan (
    id_rujukan INT,

    id_tindak_lanjut INT,

    alasan_rujukan VARCHAR(1000),

    tanggal_rujukan DATE,

    status_rujukan VARCHAR(50)
        CHECK (
            status_rujukan IN (
                'Diajukan',
                'Diproses',
                'Diterima',
                'Ditolak',
                'Selesai'
            )
        ),

    id_faskes INT,

    created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),

    updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);

-- ============================================================
-- 19. NOTIFIKASI STAGING
-- ============================================================

CREATE TABLE notifikasi (
    id_notifikasi INT,

    id_user INT,

    judul VARCHAR(255),

    pesan VARCHAR(1000),

    tipe_notifikasi VARCHAR(50)
        CHECK (
            tipe_notifikasi IN (
                'Pemeriksaan',
                'Imunisasi',
                'Rujukan',
                'Edukasi',
                'Pengingat'
            )
        ),

    status_baca BIT DEFAULT 0,

    tanggal_kirim DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);

-- ============================================================
-- 20. AUDIT LOG STAGING
-- ============================================================

CREATE TABLE audit_log (
    id_log INT,

    id_user INT,

    aktivitas VARCHAR(1000),

    ip_address VARCHAR(50),

    waktu_aktivitas DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);

-- +goose Down

DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS notifikasi;
DROP TABLE IF EXISTS rujukan;
DROP TABLE IF EXISTS tindak_lanjut;
DROP TABLE IF EXISTS hasil_pemeriksaan;
DROP TABLE IF EXISTS artikel;
DROP TABLE IF EXISTS jadwal_imunisasi;
DROP TABLE IF EXISTS anak;
DROP TABLE IF EXISTS ibu_hamil;
DROP TABLE IF EXISTS kategori_pendapatan;
DROP TABLE IF EXISTS pekerjaan;
DROP TABLE IF EXISTS pendidikan;
DROP TABLE IF EXISTS pasien;
DROP TABLE IF EXISTS fasilitas_kesehatan;
DROP TABLE IF EXISTS kader_posyandu;
DROP TABLE IF EXISTS posyandu;
DROP TABLE IF EXISTS bidan;
DROP TABLE IF EXISTS dinas_kesehatan;
DROP TABLE IF EXISTS user_account;
DROP TABLE IF EXISTS lokasi;
