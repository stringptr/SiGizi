-- +goose Up

-- ============================================================
-- BULK INSERT DATABASE IMUNISASI
-- SQL SERVER COMPATIBLE VERSION
-- Separator CSV = ,
-- Folder CSV = /data/
-- ============================================================

-- ============================================================
-- 1. LOKASI
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
-- 2. USER ACCOUNT BELUM BISA 
-- ============================================================

BULK INSERT user_account
FROM '/data/user_account.csv'
WITH (
    FIRSTROW = 2,
    FIELDTERMINATOR = ';',
    ROWTERMINATOR = '0x0a',
    KEEPNULLS,
    TABLOCK
);

-- ============================================================
-- 3. DINAS KESEHATAN
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
-- 4. BIDAN
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
-- 5. POSYANDU
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
-- 6. KADER POSYANDU
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
-- 7. PASIEN
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
-- 8. FASILITAS KESEHATAN
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
-- 9. PENDIDIKAN
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
-- 10. PEKERJAAN
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
-- 11. KATEGORI PENDAPATAN
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
-- 12. IBU HAMIL
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
-- 13. ANAK
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
-- 14. JADWAL IMUNISASI
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
-- 15. ARTIKEL
-- ============================================================

BULK INSERT artikel
FROM '/data/artikel.csv'
WITH (
    FIRSTROW = 2,
    FIELDTERMINATOR = ';',
    ROWTERMINATOR = '0x0a',
    TABLOCK
);

-- ============================================================
-- 16. HASIL PEMERIKSAAN INI BLM BISA
-- ============================================================

BULK INSERT hasil_pemeriksaan
FROM '/data/hasil_pemeriksaan.csv'
WITH (
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '0x0a',
    TABLOCK
);

-- ============================================================
-- 17. TINDAK LANJUT
-- ============================================================

BULK INSERT tindak_lanjut
FROM '/data/tindak_lanjut.csv'
WITH (
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '0x0a',
    TABLOCK
);

-- ============================================================
-- 18. RUJUKAN
-- ============================================================

BULK INSERT rujukan
FROM '/data/rujukan.csv'
WITH (
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '0x0a',
    TABLOCK
);

-- ============================================================
-- 19. NOTIFIKASI
-- ============================================================

BULK INSERT notifikasi
FROM '/data/notifikasi.csv'
WITH (
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '0x0a',
    TABLOCK
);

-- +goose Down

SELECT 'down SQL query';
