-- +goose Up

-- ============================================================
-- BULK INSERT : LOKASI
-- ============================================================
BULK INSERT lokasi
FROM '/data/lokasi.csv'
WITH (
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '0x0a',
    TABLOCK
);

-- ============================================================
-- BULK INSERT : USER ACCOUNT
-- ============================================================
BULK INSERT user_account
FROM '/data/user_account.csv'
WITH (
    FORMAT = 'CSV',
    FIRSTROW = 2,
    FIELDQUOTE = '"',
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '0x0a',
    TABLOCK
);

-- ============================================================
-- BULK INSERT : DINAS KESEHATAN
-- ============================================================
BULK INSERT dinas_kesehatan
FROM '/data/dinas_kesehatan.csv'
WITH (
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '0x0a',
    TABLOCK
);

-- ============================================================
-- BULK INSERT : BIDAN
-- ============================================================
BULK INSERT bidan
FROM '/data/bidan.csv'
WITH (
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '0x0a',
    TABLOCK
);

-- ============================================================
-- BULK INSERT : POSYANDU
-- ============================================================
BULK INSERT posyandu
FROM '/data/posyandu.csv'
WITH (
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '0x0a',
    TABLOCK
);

-- ============================================================
-- BULK INSERT : KADER POSYANDU
-- ============================================================
BULK INSERT kader_posyandu
FROM '/data/kader_posyandu.csv'
WITH (
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '0x0a',
    TABLOCK
);

-- ============================================================
-- BULK INSERT : PASIEN
-- ============================================================
BULK INSERT pasien
FROM '/data/pasien.csv'
WITH (
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '0x0a',
    TABLOCK
);

-- ============================================================
-- BULK INSERT : FASILITAS KESEHATAN
-- ============================================================
BULK INSERT fasilitas_kesehatan
FROM '/data/fasilitas_kesehatan.csv'
WITH (
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '0x0a',
    TABLOCK
);

-- ============================================================
-- BULK INSERT : PENDIDIKAN
-- ============================================================
BULK INSERT pendidikan
FROM '/data/pendidikan.csv'
WITH (
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '0x0a',
    TABLOCK
);

-- ============================================================
-- BULK INSERT : PEKERJAAN
-- ============================================================
BULK INSERT pekerjaan
FROM '/data/pekerjaan.csv'
WITH (
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '0x0a',
    TABLOCK
);

-- ============================================================
-- BULK INSERT : KATEGORI PENDAPATAN
-- ============================================================
BULK INSERT kategori_pendapatan
FROM '/data/kategori_pendapatan.csv'
WITH (
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '0x0a',
    TABLOCK
);

-- ============================================================
-- BULK INSERT : IBU HAMIL
-- ============================================================
BULK INSERT ibu_hamil
FROM '/data/ibu_hamil.csv'
WITH (
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '0x0a',
    TABLOCK
);

-- ============================================================
-- BULK INSERT : ANAK
-- ============================================================
BULK INSERT anak
FROM '/data/anak.csv'
WITH (
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '0x0a',
    TABLOCK
);

-- ============================================================
-- BULK INSERT : JADWAL IMUNISASI
-- ============================================================
BULK INSERT jadwal_imunisasi
FROM '/data/jadwal_imunisasi.csv'
WITH (
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '0x0a',
    TABLOCK
);

-- ============================================================
-- BULK INSERT : ARTIKEL
-- ============================================================
BULK INSERT artikel
FROM '/data/artikel.csv'
WITH (
    FORMAT = 'CSV',
    FIRSTROW = 2,
    FIELDQUOTE = '"',
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '0x0a',
    TABLOCK
);
-- ============================================================
-- BULK INSERT : HASIL PEMERIKSAAN
-- ============================================================
BULK INSERT hasil_pemeriksaan
FROM '/data/hasil_pemeriksaan.csv'
WITH (
    FORMAT = 'CSV',
    FIRSTROW = 2,
    FIELDQUOTE = '"',
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '0x0a',
    TABLOCK
);

-- ============================================================
-- BULK INSERT : TINDAK LANJUT
-- ============================================================
BULK INSERT tindak_lanjut
FROM '/data/tindak_lanjut.csv'
WITH (
    FORMAT = 'CSV',
    FIRSTROW = 2,
    FIELDQUOTE = '"',
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '0x0a',
    TABLOCK
);

-- ============================================================
-- BULK INSERT : RUJUKAN
-- ============================================================
BULK INSERT rujukan
FROM '/data/rujukan.csv'
WITH (
    FORMAT = 'CSV',
    FIRSTROW = 2,
    FIELDQUOTE = '"',
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '0x0a',
    TABLOCK
);
-- ============================================================
-- BULK INSERT : NOTIFIKASI
-- ============================================================
BULK INSERT notifikasi
FROM '/data/notifikasi.csv'
WITH (
    FORMAT = 'CSV',
    FIRSTROW = 2,
    FIELDQUOTE = '"',
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '0x0a',
    TABLOCK
);
-- ============================================================
-- BULK INSERT : USER SESSION
-- ============================================================
BULK INSERT user_session
FROM '/data/user_session.csv'
WITH (
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '0x0a',
    TABLOCK
);

-- ============================================================
-- BULK INSERT : AUDIT LOG
-- ============================================================
BULK INSERT audit_log
FROM '/data/audit_log.csv'
WITH (
    FORMAT = 'CSV',
    FIRSTROW = 2,
    FIELDQUOTE = '"',
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '0x0a',
    TABLOCK
);

-- ============================================================
-- LOKASI
-- ============================================================
SELECT TOP 10 * FROM lokasi;
SELECT COUNT(*) AS total_lokasi FROM lokasi;

-- ============================================================
-- USER ACCOUNT
-- ============================================================
SELECT TOP 10 * FROM user_account;
SELECT COUNT(*) AS total_user_account FROM user_account;

-- ============================================================
-- DINAS KESEHATAN
-- ============================================================
SELECT TOP 10 * FROM dinas_kesehatan;
SELECT COUNT(*) AS total_dinas_kesehatan FROM dinas_kesehatan;

-- ============================================================
-- BIDAN
-- ============================================================
SELECT TOP 10 * FROM bidan;
SELECT COUNT(*) AS total_bidan FROM bidan;

-- ============================================================
-- POSYANDU
-- ============================================================
SELECT TOP 10 * FROM posyandu;
SELECT COUNT(*) AS total_posyandu FROM posyandu;

-- ============================================================
-- KADER_POSYANDU
-- ============================================================
SELECT TOP 10 * FROM kader_posyandu;
SELECT COUNT(*) AS total_kader_posyandu FROM kader_posyandu;

-- ============================================================
-- PASIEN
-- ============================================================
SELECT TOP 10 * FROM pasien;
SELECT COUNT(*) AS total_pasien FROM pasien;

-- ============================================================
-- FASILITAS_KESEHATAN
-- ============================================================
SELECT TOP 10 * FROM fasilitas_kesehatan;
SELECT COUNT(*) AS total_fasilitas_kesehatan FROM fasilitas_kesehatan;

-- ============================================================
-- PENDIDIKAN
-- ============================================================
SELECT TOP 10 * FROM pendidikan;
SELECT COUNT(*) AS total_pendidikan FROM pendidikan;

-- ============================================================
-- PEKERJAAN
-- ============================================================
SELECT TOP 10 * FROM pekerjaan;
SELECT COUNT(*) AS total_pekerjaan FROM pekerjaan;

-- ============================================================
-- KATEGORI_PENDAPATAN
-- ============================================================
SELECT TOP 10 * FROM kategori_pendapatan;
SELECT COUNT(*) AS total_kategori_pendapatan FROM kategori_pendapatan;

-- ============================================================
-- IBU_HAMIL
-- ============================================================
SELECT TOP 10 * FROM ibu_hamil;
SELECT COUNT(*) AS total_ibu_hamil FROM ibu_hamil;

-- ============================================================
-- ANAK
-- ============================================================
SELECT TOP 10 * FROM anak;
SELECT COUNT(*) AS total_anak FROM anak;

-- ============================================================
-- JADWAL_IMUNISASI
-- ============================================================
SELECT TOP 10 * FROM jadwal_imunisasi;
SELECT COUNT(*) AS total_jadwal_imunisasi FROM jadwal_imunisasi;

-- ============================================================
-- ARTIKEL
-- ============================================================
SELECT TOP 10 * FROM artikel;
SELECT COUNT(*) AS total_artikel FROM artikel;

-- ============================================================
-- HASIL_PEMERIKSAAN
-- ============================================================
SELECT TOP 10 * FROM hasil_pemeriksaan;
SELECT COUNT(*) AS total_hasil_pemeriksaan FROM hasil_pemeriksaan;

-- ============================================================
-- TINDAK_LANJUT
-- ============================================================
SELECT TOP 10 * FROM tindak_lanjut;
SELECT COUNT(*) AS total_tindak_lanjut FROM tindak_lanjut;

-- ============================================================
-- RUJUKAN
-- ============================================================
SELECT TOP 10 * FROM rujukan;
SELECT COUNT(*) AS total_rujukan FROM rujukan;

-- ============================================================
-- NOTIFIKASI
-- ============================================================
SELECT TOP 10 * FROM notifikasi;
SELECT COUNT(*) AS total_notifikasi FROM notifikasi;

-- ============================================================
-- USER_SESSION
-- ============================================================
SELECT TOP 10 * FROM user_session;
SELECT COUNT(*) AS total_user_session FROM user_session;

-- ============================================================
-- AUDIT_LOG
-- ============================================================
SELECT TOP 10 * FROM audit_log;
SELECT COUNT(*) AS total_audit_log FROM audit_log;

-- +goose Down

TRUNCATE TABLE audit_log;
TRUNCATE TABLE user_session;
TRUNCATE TABLE notifikasi;
TRUNCATE TABLE rujukan;
TRUNCATE TABLE tindak_lanjut;
TRUNCATE TABLE hasil_pemeriksaan;
TRUNCATE TABLE artikel;
TRUNCATE TABLE jadwal_imunisasi;
TRUNCATE TABLE anak;
TRUNCATE TABLE ibu_hamil;
TRUNCATE TABLE kategori_pendapatan;
TRUNCATE TABLE pekerjaan;
TRUNCATE TABLE pendidikan;
TRUNCATE TABLE fasilitas_kesehatan;
TRUNCATE TABLE pasien;
TRUNCATE TABLE kader_posyandu;
TRUNCATE TABLE posyandu;
TRUNCATE TABLE bidan;
TRUNCATE TABLE dinas_kesehatan;
TRUNCATE TABLE user_account;
TRUNCATE TABLE lokasi;
