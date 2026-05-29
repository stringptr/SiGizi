-- +goose Up

-- ============================================================
-- DATABASE STAGING
-- SQL SERVER VERSION
-- TANPA PRIMARY KEY DAN FOREIGN KEY
-- ============================================================



-- ============================================================
-- DROP TABLE
-- ============================================================
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS user_session;
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
DROP TABLE IF EXISTS fasilitas_kesehatan;
DROP TABLE IF EXISTS pasien;
DROP TABLE IF EXISTS kader_posyandu;
DROP TABLE IF EXISTS posyandu;
DROP TABLE IF EXISTS bidan;
DROP TABLE IF EXISTS dinas_kesehatan;
DROP TABLE IF EXISTS user_account;
DROP TABLE IF EXISTS lokasi;

-- ============================================================
-- STAGING TABLE : LOKASI
-- ============================================================
CREATE TABLE lokasi (
    id_lokasi INT,
    nama_lokasi VARCHAR(255),
    tipe_lokasi VARCHAR(50),
    bagian_dari INT
);

-- ============================================================
-- STAGING TABLE : USER ACCOUNT
-- ============================================================
CREATE TABLE user_account (
    id_user INT,
    email VARCHAR(255),
    password VARCHAR(255),
    no_hp VARCHAR(20),
    status_verifikasi VARCHAR(50),
    nama VARCHAR(255),
    nik CHAR(16),
    jenis_kelamin VARCHAR(20),
    tanggal_lahir DATE,
    id_lokasi INT,
    id_pendidikan INT,
    id_pekerjaan INT,
    id_pendapatan INT,
    jumlah_tanggungan INT,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- ============================================================
-- STAGING TABLE : DINAS KESEHATAN
-- ============================================================
CREATE TABLE dinas_kesehatan (
    id_user INT,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- ============================================================
-- STAGING TABLE : BIDAN
-- ============================================================
CREATE TABLE bidan (
    id_user INT,
    no_str VARCHAR(100),
    wilayah_kerja INT,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- ============================================================
-- STAGING TABLE : POSYANDU
-- ============================================================
CREATE TABLE posyandu (
    id_posyandu INT,
    nama_posyandu VARCHAR(255),
    id_lokasi INT,
    id_bidan INT,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- ============================================================
-- STAGING TABLE : KADER POSYANDU
-- ============================================================
CREATE TABLE kader_posyandu (
    id_user INT,
    no_sk VARCHAR(100),
    id_posyandu INT,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- ============================================================
-- STAGING TABLE : PASIEN
-- ============================================================
CREATE TABLE pasien (
    id_pasien INT,
    id_posyandu INT,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- ============================================================
-- STAGING TABLE : FASILITAS KESEHATAN
-- ============================================================
CREATE TABLE fasilitas_kesehatan (
    id_faskes INT,
    nama_faskes VARCHAR(255),
    tipe_faskes VARCHAR(100),
    id_lokasi INT,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- ============================================================
-- STAGING TABLE : PENDIDIKAN
-- ============================================================
CREATE TABLE pendidikan (
    id_pendidikan INT,
    nama_pendidikan VARCHAR(50),
    jenjang VARCHAR(50),
    lama_tahun INT
);

-- ============================================================
-- STAGING TABLE : PEKERJAAN
-- ============================================================
CREATE TABLE pekerjaan (
    id_pekerjaan INT,
    nama_pekerjaan VARCHAR(100),
    sektor VARCHAR(100)
);

-- ============================================================
-- STAGING TABLE : KATEGORI PENDAPATAN
-- ============================================================
CREATE TABLE kategori_pendapatan (
    id_pendapatan INT,
    kategori_pendapatan VARCHAR(100),
    pendapatan_min DECIMAL(12,2),
    pendapatan_max DECIMAL(12,2)
);

-- ============================================================
-- STAGING TABLE : IBU HAMIL
-- ============================================================
CREATE TABLE ibu_hamil (
    id_ibu_hamil INT,
    id_pasien INT,
    hamil_ke INT,
    bulan_mulai_hamil DATE,
    hpht DATE,
    status_kehamilan VARCHAR(50),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- ============================================================
-- STAGING TABLE : ANAK
-- ============================================================
CREATE TABLE anak (
    id_pasien INT,
    id_ibu_hamil INT,
    id_wali INT,
    nama_anak VARCHAR(255),
    berat_lahir DECIMAL(5,2),
    panjang_lahir DECIMAL(5,2),
    hubungan_dengan_wali VARCHAR(50),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- ============================================================
-- STAGING TABLE : JADWAL IMUNISASI
-- ============================================================
CREATE TABLE jadwal_imunisasi (
    id_imunisasi INT,
    id_pasien INT,
    nama_vaksin VARCHAR(255),
    tanggal_jadwal DATE,
    tanggal_realisasi DATE,
    status_imunisasi VARCHAR(20),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- ============================================================
-- STAGING TABLE : ARTIKEL
-- ============================================================
CREATE TABLE artikel (
    id_artikel INT,
    judul VARCHAR(255),
    isi_artikel VARCHAR(MAX),
    kategori VARCHAR(100),
    status_artikel VARCHAR(50),
    id_penulis INT,
    id_verifikator INT,
    tanggal_publish DATE,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- ============================================================
-- STAGING TABLE : HASIL PEMERIKSAAN
-- ============================================================
CREATE TABLE hasil_pemeriksaan (
    id_hasil_pemeriksaan INT,
    id_petugas_input INT,
    id_jadwal_imunisasi INT,
    berat_badan DECIMAL(5,2),
    tinggi_badan DECIMAL(5,2),
    lingkar_kepala DECIMAL(5,2),
    tekanan_darah VARCHAR(20),
    status_stunting VARCHAR(50),
    status_gizi VARCHAR(50),
    catatan VARCHAR(1000),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- ============================================================
-- STAGING TABLE : TINDAK LANJUT
-- ============================================================
CREATE TABLE tindak_lanjut (
    id_tindak_lanjut INT,
    id_hasil_pemeriksaan INT,
    id_bidan INT,
    catatan_medis VARCHAR(1000),
    rekomendasi VARCHAR(1000),
    jadwal_kontrol DATE,
    status_pasien VARCHAR(50),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- ============================================================
-- STAGING TABLE : RUJUKAN
-- ============================================================
CREATE TABLE rujukan (
    id_rujukan INT,
    id_tindak_lanjut INT,
    alasan_rujukan VARCHAR(1000),
    tanggal_rujukan DATE,
    status_rujukan VARCHAR(50),
    id_faskes INT,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- ============================================================
-- STAGING TABLE : NOTIFIKASI
-- ============================================================
CREATE TABLE notifikasi (
    id_notifikasi VARCHAR(50),
    id_user VARCHAR(50),
    judul VARCHAR(255),
    pesan VARCHAR(MAX),
    tipe_notifikasi VARCHAR(50),
    status_baca VARCHAR(10) DEFAULT 'False',
    tanggal_kirim VARCHAR(50)
);

-- ============================================================
-- STAGING TABLE : USER SESSION
-- ============================================================
CREATE TABLE user_session (
    id_session UNIQUEIDENTIFIER DEFAULT NEWID(),
    id_user INT,
    status_session VARCHAR(50),
    ip_address VARCHAR(50),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- ============================================================
-- STAGING TABLE : AUDIT LOG
-- ============================================================
CREATE TABLE audit_log (
    id_log VARCHAR(50),
    tipe_aktor VARCHAR(50),
    id_user VARCHAR(50),
    id_user_session VARCHAR(100),
    tipe_aktivitas VARCHAR(100),
    berhasil VARCHAR(10),
    endpoint VARCHAR(255),
    table_name VARCHAR(255),
    record_id VARCHAR(100),
    old_value VARCHAR(MAX),
    new_value VARCHAR(MAX),
    detail VARCHAR(MAX),
    ip_address VARCHAR(100),
    user_agent VARCHAR(MAX),
    waktu_aktivitas VARCHAR(50)
);


-- +goose Down

DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS user_session;
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
DROP TABLE IF EXISTS fasilitas_kesehatan;
DROP TABLE IF EXISTS pasien;
DROP TABLE IF EXISTS kader_posyandu;
DROP TABLE IF EXISTS posyandu;
DROP TABLE IF EXISTS bidan;
DROP TABLE IF EXISTS dinas_kesehatan;
DROP TABLE IF EXISTS user_account;
DROP TABLE IF EXISTS lokasi;
