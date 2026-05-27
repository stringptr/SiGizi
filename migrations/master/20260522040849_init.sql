-- +goose Up

-- ============================================================
-- DATABASE MASTER
-- ============================================================
-- CREATE DATABASE IF NOT EXISTS imunisasi;
-- USE imunisasi;


-- ============================================================
-- DROP ALL TABLES
-- ============================================================
-- DROP TABLE IF EXISTS audit_log CASCADE;
-- DROP TABLE IF EXISTS notifikasi CASCADE;
-- DROP TABLE IF EXISTS rujukan CASCADE;
-- DROP TABLE IF EXISTS tindak_lanjut CASCADE;
-- DROP TABLE IF EXISTS hasil_pemeriksaan CASCADE;
-- DROP TABLE IF EXISTS artikel CASCADE;
-- DROP TABLE IF EXISTS jadwal_imunisasi CASCADE;
-- DROP TABLE IF EXISTS anak CASCADE;
-- DROP TABLE IF EXISTS ibu_hamil CASCADE;
-- DROP TABLE IF EXISTS kategori_pendapatan CASCADE;
-- DROP TABLE IF EXISTS pekerjaan CASCADE;
-- DROP TABLE IF EXISTS pendidikan CASCADE;
-- DROP TABLE IF EXISTS pasien CASCADE;
-- DROP TABLE IF EXISTS fasilitas_kesehatan CASCADE;
-- DROP TABLE IF EXISTS kader_posyandu CASCADE;
-- DROP TABLE IF EXISTS posyandu CASCADE;
-- DROP TABLE IF EXISTS bidan CASCADE;
-- DROP TABLE IF EXISTS dinas_kesehatan CASCADE;
-- DROP TABLE IF EXISTS user_account CASCADE;
-- DROP TABLE IF EXISTS lokasi CASCADE;

-- ============================================================
-- MASTER TABLE
-- TOTAL : 8 TABLE
-- ============================================================
-- ============================================================
-- 1. MASTER LOKASI
-- ============================================================
CREATE TYPE tipe_lokasi AS ENUM ('Provinsi', 'Kabupaten', 'Kota', 'Kecamatan', 'Kelurahan');
CREATE TABLE lokasi (
   id_lokasi SERIAL PRIMARY KEY,
   nama_lokasi VARCHAR(255) NOT NULL,
   tipe_lokasi tipe_lokasi NOT NULL,
   bagian_dari INT,
   CONSTRAINT fk_lokasi_parent
       FOREIGN KEY (bagian_dari)
       REFERENCES lokasi(id_lokasi)
);
-- ============================================================
-- 2. MASTER USER ACCOUNT
-- ============================================================
CREATE TYPE jenis_kelamin AS ENUM ('Laki-Laki', 'Perempuan');
CREATE TYPE status_verifikasi AS ENUM ('Pending', 'Aktif', 'Ditolak');
CREATE TABLE user_account (
   id_user SERIAL PRIMARY KEY,
   email VARCHAR(255) NOT NULL UNIQUE,
   password VARCHAR(255) NOT NULL,
   no_hp VARCHAR(20) NOT NULL,
   status_verifikasi status_verifikasi NOT NULL DEFAULT 'Pending',
   nama VARCHAR(255) NOT NULL,
   nik CHAR(16) UNIQUE NOT NULL
       CHECK (nik ~ '^[0-9]{16}$'),
    jenis_kelamin jenis_kelamin NOT NULL,
   tanggal_lahir DATE NOT NULL,
   id_lokasi INT NOT NULL,
   id_pendidikan INT,
   id_pekerjaan INT,
   id_pendapatan INT,
   jumlah_tanggungan INT
       CHECK (jumlah_tanggungan >= 0),
   created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT fk_user_lokasi
       FOREIGN KEY (id_lokasi)
       REFERENCES lokasi(id_lokasi)
);
-- ============================================================
-- 3. MASTER DINAS KESEHATAN
-- ============================================================
CREATE TABLE dinas_kesehatan (
   id_user INT PRIMARY KEY,
   created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT fk_dinkes_user
       FOREIGN KEY (id_user)
       REFERENCES user_account(id_user)
       ON DELETE CASCADE
);
-- ============================================================
-- 4. MASTER BIDAN
-- ============================================================
CREATE TABLE bidan (
   id_user INT PRIMARY KEY,
   no_str VARCHAR(100) NOT NULL UNIQUE,
   wilayah_kerja INT NOT NULL,
   created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT fk_bidan_user
       FOREIGN KEY (id_user)
       REFERENCES user_account(id_user)
       ON DELETE CASCADE,
   CONSTRAINT fk_bidan_lokasi
       FOREIGN KEY (wilayah_kerja)
       REFERENCES lokasi(id_lokasi)
);
-- ============================================================
-- 5. MASTER POSYANDU
-- ============================================================
CREATE TABLE posyandu (
   id_posyandu SERIAL PRIMARY KEY,
   nama_posyandu VARCHAR(255) NOT NULL,
   id_lokasi INT NOT NULL,
   id_bidan INT NOT NULL,
   created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT fk_posyandu_lokasi
       FOREIGN KEY (id_lokasi)
       REFERENCES lokasi(id_lokasi),
   CONSTRAINT fk_posyandu_bidan
       FOREIGN KEY (id_bidan)
       REFERENCES bidan(id_user)
);
-- ============================================================
-- 6. MASTER KADER POSYANDU
-- ============================================================
CREATE TABLE kader_posyandu (
   id_user INT PRIMARY KEY,
   no_sk VARCHAR(100) NOT NULL UNIQUE,
   id_posyandu INT NOT NULL,
   created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT fk_kader_user
       FOREIGN KEY (id_user)
       REFERENCES user_account(id_user)
       ON DELETE CASCADE,
   CONSTRAINT fk_kader_posyandu
       FOREIGN KEY (id_posyandu)
       REFERENCES posyandu(id_posyandu)
);
-- ============================================================
-- 7. MASTER PASIEN
-- ============================================================
CREATE TABLE pasien (
   id_pasien INT PRIMARY KEY,
   id_posyandu INT NOT NULL,
   created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT fk_pasien_user
       FOREIGN KEY (id_pasien)
       REFERENCES user_account(id_user)
       ON DELETE CASCADE,
   CONSTRAINT fk_pasien_posyandu
       FOREIGN KEY (id_posyandu)
       REFERENCES posyandu(id_posyandu)
);
-- ============================================================
-- 8. MASTER FASILITAS KESEHATAN
-- ============================================================
CREATE TYPE tipe_faskes AS ENUM ('Faskes Tingkat Pertama', 'Faskes Rujukan Tingkat Lanjutan', 'Faskes Penunjang');
CREATE TABLE fasilitas_kesehatan (
   id_faskes SERIAL PRIMARY KEY,
   nama_faskes VARCHAR(255) NOT NULL,
    tipe_faskes tipe_faskes NOT NULL,
   id_lokasi INT NOT NULL,
   created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT fk_faskes_lokasi
       FOREIGN KEY (id_lokasi)
       REFERENCES lokasi(id_lokasi)
);
-- ============================================================
-- REFERENSI TABLE
-- TOTAL : 7 TABLE
-- ============================================================
-- ============================================================
-- 1. REFERENSI PENDIDIKAN
-- ============================================================
CREATE TABLE pendidikan (
   id_pendidikan SERIAL PRIMARY KEY,
   nama_pendidikan VARCHAR(50) NOT NULL UNIQUE,
   jenjang VARCHAR(50) NOT NULL,
   lama_tahun INT NOT NULL
       CHECK (lama_tahun >= 0)
);
-- ============================================================
-- 2. REFERENSI PEKERJAAN
-- ============================================================
CREATE TYPE sektor AS ENUM ('Formal', 'Informal', 'Pemerintah', 'Kesehatan', 'Pendidikan', 'Pertanian', 'Domestik', 'Transportasi');
CREATE TABLE pekerjaan (
   id_pekerjaan SERIAL PRIMARY KEY,
   nama_pekerjaan VARCHAR(100) NOT NULL UNIQUE,
    sektor sektor NOT NULL
);
-- ============================================================
-- 3. REFERENSI KATEGORI PENDAPATAN
-- ============================================================
CREATE TABLE kategori_pendapatan (
   id_pendapatan SERIAL PRIMARY KEY,
   kategori_pendapatan VARCHAR(100) NOT NULL UNIQUE,
   pendapatan_min NUMERIC(12,2) NOT NULL UNIQUE
       CHECK (pendapatan_min >= 0),
   pendapatan_max NUMERIC(12,2) NOT NULL UNIQUE
       CHECK (pendapatan_max >= pendapatan_min)
);
-- ============================================================
-- FOREIGN KEY USER ACCOUNT
-- ============================================================
ALTER TABLE user_account
ADD CONSTRAINT fk_user_pendidikan
FOREIGN KEY (id_pendidikan)
REFERENCES pendidikan(id_pendidikan);
ALTER TABLE user_account
ADD CONSTRAINT fk_user_pekerjaan
FOREIGN KEY (id_pekerjaan)
REFERENCES pekerjaan(id_pekerjaan);
ALTER TABLE user_account
ADD CONSTRAINT fk_user_pendapatan
FOREIGN KEY (id_pendapatan)
REFERENCES kategori_pendapatan(id_pendapatan);
-- ============================================================
-- 4. REFERENSI IBU HAMIL
-- ============================================================
CREATE TYPE status_kehamilan AS ENUM ('Trimester 1', 'Trimester 2', 'Trimester 3', 'Melahirkan', 'Nifas', 'Keguguran');
CREATE TABLE ibu_hamil (
   id_ibu_hamil SERIAL PRIMARY KEY,
   id_pasien INT NOT NULL,
   hamil_ke INT NOT NULL
       CHECK (hamil_ke > 0),
   bulan_mulai_hamil DATE NOT NULL,
   hpht DATE NOT NULL,
    status_kehamilan status_kehamilan NOT NULL,
   created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT uq_ibu_hamil
       UNIQUE (id_pasien, hamil_ke),
   CONSTRAINT fk_ibu_hamil_pasien
       FOREIGN KEY (id_pasien)
       REFERENCES pasien(id_pasien)
       ON DELETE CASCADE
);
-- ============================================================
-- 5. REFERENSI ANAK
-- ============================================================
CREATE TYPE hubungan_dengan_wali AS ENUM ('Kandung', 'Tiri', 'Angkat');
CREATE TABLE anak (
   id_pasien INT PRIMARY KEY,
   id_ibu_hamil INT,
   id_wali INT NOT NULL,
   nama_anak VARCHAR(255) NOT NULL,
   berat_lahir NUMERIC(5,2) NOT NULL,
   panjang_lahir NUMERIC(5,2) NOT NULL,
    hubungan_dengan_wali hubungan_dengan_wali NOT NULL,
   created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT fk_anak_pasien
       FOREIGN KEY (id_pasien)
       REFERENCES pasien(id_pasien)
       ON DELETE CASCADE,
   CONSTRAINT fk_anak_ibu_hamil
       FOREIGN KEY (id_ibu_hamil)
       REFERENCES ibu_hamil(id_ibu_hamil)
       ON DELETE RESTRICT,
   CONSTRAINT fk_anak_wali
       FOREIGN KEY (id_wali)
       REFERENCES user_account(id_user)
       ON DELETE RESTRICT
);
-- ============================================================
-- 6. REFERENSI JADWAL IMUNISASI
-- ============================================================
CREATE TYPE status_imunisasi AS ENUM ('Sudah', 'Belum');
CREATE TABLE jadwal_imunisasi (
   id_imunisasi SERIAL PRIMARY KEY,
   id_pasien INT NOT NULL,
   nama_vaksin VARCHAR(255) NOT NULL,
   tanggal_jadwal DATE NOT NULL,
   tanggal_realisasi DATE,
    status_imunisasi status_imunisasi NOT NULL,
   created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT fk_jadwal_imunisasi_pasien
       FOREIGN KEY (id_pasien)
       REFERENCES pasien(id_pasien)
       ON DELETE CASCADE
);
-- ============================================================
-- 7. REFERENSI ARTIKEL
-- ============================================================
CREATE TYPE status_artikel AS ENUM ('Draft', 'Menunggu Verifikasi', 'Dipublikasikan', 'Ditolak', 'Diarsipkan');
CREATE TABLE artikel (
   id_artikel SERIAL PRIMARY KEY,
   judul VARCHAR(255) NOT NULL,
   isi_artikel TEXT NOT NULL,
   kategori VARCHAR(100),
    status_artikel status_artikel NOT NULL DEFAULT 'Draft',
   id_penulis INT NOT NULL,
   id_verifikator INT,
   tanggal_publish DATE,
   created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT fk_artikel_penulis
       FOREIGN KEY (id_penulis)
       REFERENCES user_account(id_user),
   CONSTRAINT fk_artikel_verifikator
       FOREIGN KEY (id_verifikator)
       REFERENCES user_account(id_user)
);
-- ============================================================
-- TRANSAKSI TABLE
-- TOTAL : 5 TABLE
-- ============================================================
-- ============================================================
-- 1. TRANSAKSI HASIL PEMERIKSAAN
-- ============================================================
CREATE TYPE status_stunting AS ENUM ('Normal', 'Berisiko Stunting', 'Stunting', 'Stunting Berat');
CREATE TYPE status_gizi AS ENUM ('Gizi Baik', 'Gizi Kurang', 'Gizi Buruk', 'Risiko Gizi Lebih', 'Gizi Lebih', 'Obesitas');
CREATE TABLE hasil_pemeriksaan (
   id_hasil_pemeriksaan SERIAL PRIMARY KEY,
   id_petugas_input INT NOT NULL,
   id_jadwal_imunisasi INT NOT NULL,
   berat_badan NUMERIC(5,2) NOT NULL,
   tinggi_badan NUMERIC(5,2) NOT NULL,
   lingkar_kepala NUMERIC(5,2) NOT NULL,
   tekanan_darah VARCHAR(20) NOT NULL,
    status_stunting status_stunting NOT NULL,
    status_gizi status_gizi NOT NULL,
   catatan VARCHAR(1000),
   created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT fk_hasil_petugas
       FOREIGN KEY (id_petugas_input)
       REFERENCES user_account(id_user),
   CONSTRAINT fk_hasil_jadwal
       FOREIGN KEY (id_jadwal_imunisasi)
       REFERENCES jadwal_imunisasi(id_imunisasi)
);
-- ============================================================
-- 2. TRANSAKSI TINDAK LANJUT
-- ============================================================
CREATE TYPE status_pasien AS ENUM ('Dalam Pemantauan', 'Membaik', 'Perlu Rujukan', 'Selesai Pemantauan');
CREATE TABLE tindak_lanjut (
   id_tindak_lanjut SERIAL PRIMARY KEY,
   id_hasil_pemeriksaan INT UNIQUE NOT NULL,
   id_bidan INT NOT NULL,
   catatan_medis VARCHAR(1000),
   rekomendasi VARCHAR(1000),
   jadwal_kontrol DATE NOT NULL,
    status_pasien status_pasien NOT NULL,
   created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT fk_tindak_hasil
       FOREIGN KEY (id_hasil_pemeriksaan)
       REFERENCES hasil_pemeriksaan(id_hasil_pemeriksaan)
       ON DELETE CASCADE,
   CONSTRAINT fk_tindak_bidan
       FOREIGN KEY (id_bidan)
       REFERENCES bidan(id_user)
       ON DELETE RESTRICT
);
-- ============================================================
-- 3. TRANSAKSI RUJUKAN
-- ============================================================
CREATE TYPE status_rujukan AS ENUM ('Diajukan', 'Diproses', 'Diterima', 'Ditolak', 'Selesai');
CREATE TABLE rujukan (
   id_rujukan SERIAL PRIMARY KEY,
   id_tindak_lanjut INT UNIQUE NOT NULL,
   alasan_rujukan VARCHAR(1000) NOT NULL,
   tanggal_rujukan DATE NOT NULL,
    status_rujukan status_rujukan NOT NULL,
   id_faskes INT NOT NULL,
   created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT fk_rujukan_tindak
       FOREIGN KEY (id_tindak_lanjut)
       REFERENCES tindak_lanjut(id_tindak_lanjut)
       ON DELETE CASCADE,
   CONSTRAINT fk_rujukan_faskes
       FOREIGN KEY (id_faskes)
       REFERENCES fasilitas_kesehatan(id_faskes)
);
-- ============================================================
-- 4. TRANSAKSI NOTIFIKASI
-- ============================================================
CREATE TYPE tipe_notifikasi AS ENUM ('Pemeriksaan', 'Imunisasi', 'Rujukan', 'Edukasi', 'Pengingat');
CREATE TABLE notifikasi (
   id_notifikasi SERIAL PRIMARY KEY,
   id_user INT NOT NULL,
   judul VARCHAR(255) NOT NULL,
   pesan VARCHAR(1000),
    tipe_notifikasi tipe_notifikasi NOT NULL,
   status_baca BOOLEAN NOT NULL DEFAULT FALSE,
   tanggal_kirim TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT fk_notifikasi_user
       FOREIGN KEY (id_user)
       REFERENCES user_account(id_user)
       ON DELETE CASCADE
);
-- ============================================================
-- 5. TRANSAKSI AUDIT LOG
-- ============================================================
CREATE TYPE tipe_aktor AS ENUM ('USER', 'ANONYMOUS', 'SYSTEM');
CREATE TYPE tipe_aktivitas AS ENUM ('LOGIN', 'REGISTRASI', 'IP_LOCK', 'DATA_INSERT', 'DATA_DELETE', 'DATA_UPDATE', 'VERIFIKASI_REGISTRASI', 'PENOLAKAN_REGISTRASI', 'FORBIDDEN_ACCESS', 'UNAUTHORIZED', 'BAD_REQUEST', 'NOT_FOUND', 'TIMEOUT', 'DATABASE_UNREACHABLE');
CREATE TABLE audit_log (
   id_log SERIAL PRIMARY KEY,
   tipe_aktor tipe_aktor,
   id_user INT,
   session_user UUID,
   tipe_aktivitas tipe_aktivitas,
   berhasil BOOLEAN,
   endpoint TEXT,
   table_name TEXT,
   record_id TEXT,
   old_value JSONB,
   new_value JSONB
   detail TEXT,
   ip_address INET,
   user_agent TEXT,
   waktu_aktivitas TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
   CONSTRAINT fk_audit_id_user
       FOREIGN KEY (id_user)
       REFERENCES user_account(id_user)
   CONSTRAINT fk_audit_session_user
       FOREIGN KEY (id_user)
       REFERENCES user_account(id_user)
);

-- ============================================================
-- FUNCTION AUTO UPDATE updated_at
-- ============================================================
-- +goose StatementBegin
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- +goose StatementEnd
-- ============================================================
-- TRIGGER USER ACCOUNT
-- ============================================================
CREATE TRIGGER trg_user_account_updated_at
BEFORE UPDATE ON user_account
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
-- ============================================================
-- TRIGGER DINAS KESEHATAN
-- ============================================================
CREATE TRIGGER trg_dinas_kesehatan_updated_at
BEFORE UPDATE ON dinas_kesehatan
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
-- ============================================================
-- TRIGGER BIDAN
-- ============================================================
CREATE TRIGGER trg_bidan_updated_at
BEFORE UPDATE ON bidan
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
-- ============================================================
-- TRIGGER POSYANDU
-- ============================================================
CREATE TRIGGER trg_posyandu_updated_at
BEFORE UPDATE ON posyandu
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
-- ============================================================
-- TRIGGER KADER POSYANDU
-- ============================================================
CREATE TRIGGER trg_kader_posyandu_updated_at
BEFORE UPDATE ON kader_posyandu
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
-- ============================================================
-- TRIGGER PASIEN
-- ============================================================
CREATE TRIGGER trg_pasien_updated_at
BEFORE UPDATE ON pasien
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
-- ============================================================
-- TRIGGER FASILITAS KESEHATAN
-- ============================================================
CREATE TRIGGER trg_fasilitas_kesehatan_updated_at
BEFORE UPDATE ON fasilitas_kesehatan
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
-- ============================================================
-- TRIGGER IBU HAMIL
-- ============================================================
CREATE TRIGGER trg_ibu_hamil_updated_at
BEFORE UPDATE ON ibu_hamil
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
-- ============================================================
-- TRIGGER ANAK
-- ============================================================
CREATE TRIGGER trg_anak_updated_at
BEFORE UPDATE ON anak
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
-- ============================================================
-- TRIGGER JADWAL IMUNISASI
-- ============================================================
CREATE TRIGGER trg_jadwal_imunisasi_updated_at
BEFORE UPDATE ON jadwal_imunisasi
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
-- ============================================================
-- TRIGGER ARTIKEL
-- ============================================================
CREATE TRIGGER trg_artikel_updated_at
BEFORE UPDATE ON artikel
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
-- ============================================================
-- TRIGGER HASIL PEMERIKSAAN
-- ============================================================
CREATE TRIGGER trg_hasil_pemeriksaan_updated_at
BEFORE UPDATE ON hasil_pemeriksaan
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
-- ============================================================
-- TRIGGER TINDAK LANJUT
-- ============================================================
CREATE TRIGGER trg_tindak_lanjut_updated_at
BEFORE UPDATE ON tindak_lanjut
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
-- ============================================================
-- TRIGGER RUJUKAN
-- ============================================================
CREATE TRIGGER trg_rujukan_updated_at
BEFORE UPDATE ON rujukan
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- +goose Down

DROP TRIGGER IF EXISTS trg_rujukan_updated_at ON rujukan;
DROP TRIGGER IF EXISTS trg_tindak_lanjut_updated_at ON tindak_lanjut;
DROP TRIGGER IF EXISTS trg_hasil_pemeriksaan_updated_at ON hasil_pemeriksaan;
DROP TRIGGER IF EXISTS trg_artikel_updated_at ON artikel;
DROP TRIGGER IF EXISTS trg_jadwal_imunisasi_updated_at ON jadwal_imunisasi;
DROP TRIGGER IF EXISTS trg_anak_updated_at ON anak;
DROP TRIGGER IF EXISTS trg_ibu_hamil_updated_at ON ibu_hamil;
DROP TRIGGER IF EXISTS trg_fasilitas_kesehatan_updated_at ON fasilitas_kesehatan;
DROP TRIGGER IF EXISTS trg_pasien_updated_at ON pasien;
DROP TRIGGER IF EXISTS trg_kader_posyandu_updated_at ON kader_posyandu;
DROP TRIGGER IF EXISTS trg_posyandu_updated_at ON posyandu;
DROP TRIGGER IF EXISTS trg_bidan_updated_at ON bidan;
DROP TRIGGER IF EXISTS trg_dinas_kesehatan_updated_at ON dinas_kesehatan;
DROP TRIGGER IF EXISTS trg_user_account_updated_at ON user_account;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS notifikasi CASCADE;
DROP TABLE IF EXISTS rujukan CASCADE;
DROP TABLE IF EXISTS tindak_lanjut CASCADE;
DROP TABLE IF EXISTS hasil_pemeriksaan CASCADE;
DROP TABLE IF EXISTS artikel CASCADE;
DROP TABLE IF EXISTS jadwal_imunisasi CASCADE;
DROP TABLE IF EXISTS anak CASCADE;
DROP TABLE IF EXISTS ibu_hamil CASCADE;
DROP TABLE IF EXISTS kategori_pendapatan CASCADE;
DROP TABLE IF EXISTS pekerjaan CASCADE;
DROP TABLE IF EXISTS pendidikan CASCADE;
DROP TABLE IF EXISTS pasien CASCADE;
DROP TABLE IF EXISTS fasilitas_kesehatan CASCADE;
DROP TABLE IF EXISTS kader_posyandu CASCADE;
DROP TABLE IF EXISTS posyandu CASCADE;
DROP TABLE IF EXISTS bidan CASCADE;
DROP TABLE IF EXISTS dinas_kesehatan CASCADE;
DROP TABLE IF EXISTS user_account CASCADE;
DROP TABLE IF EXISTS lokasi CASCADE;
DROP TYPE IF EXISTS tipe_aktivitas;
DROP TYPE IF EXISTS tipe_identifier_aktor;
DROP TYPE IF EXISTS tipe_aktor;
DROP TYPE IF EXISTS tipe_notifikasi;
DROP TYPE IF EXISTS status_rujukan;
DROP TYPE IF EXISTS status_pasien;
DROP TYPE IF EXISTS status_gizi;
DROP TYPE IF EXISTS status_stunting;
DROP TYPE IF EXISTS status_artikel;
DROP TYPE IF EXISTS status_imunisasi;
DROP TYPE IF EXISTS hubungan_dengan_wali;
DROP TYPE IF EXISTS status_kehamilan;
DROP TYPE IF EXISTS sektor;
DROP TYPE IF EXISTS tipe_faskes;
DROP TYPE IF EXISTS jenis_kelamin;
DROP TYPE IF EXISTS tipe_lokasi;
