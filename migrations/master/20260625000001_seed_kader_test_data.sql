-- +goose Up
-- ============================================================
-- SAMPLE DATA untuk akun test Kader (kader@test.com / password123)
-- Posyandu: "Posyandu Login Sehat" (id 501)
-- Kader: id_user 20000003
-- Bidan: id_user 20000002
-- Pasien: 20000004 (Pasien Test), 20000005 (Ibu Hamil Test)
-- ============================================================

-- 1. ANAK (untuk pasien 20000004)
INSERT INTO anak (id_pasien, nama_anak, id_wali, berat_lahir, panjang_lahir, hubungan_dengan_wali, created_at, updated_at)
VALUES (20000004, 'Bayi Sehat', 20000004, 3.5, 50.0, 'Kandung', NOW(), NOW())
ON CONFLICT (id_pasien) DO NOTHING;

-- 2. JADWAL IMUNISASI (3 records untuk masing-masing pasien)
INSERT INTO jadwal_imunisasi (id_pasien, nama_vaksin, tanggal_jadwal, tanggal_realisasi, status_imunisasi, created_at, updated_at)
VALUES
-- Pasien 20000004 (Pasien Test / Bayi Sehat)
(20000004, 'BCG (Bacillus Calmette-Guérin)',  CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '30 days', 'Sudah', NOW(), NOW()),
(20000004, 'Hepatitis B (HB)',               CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE - INTERVAL '14 days', 'Sudah', NOW(), NOW()),
(20000004, 'Polio (IPV)',                    CURRENT_DATE + INTERVAL '7 days',  NULL,                               'Belum', NOW(), NOW()),
-- Pasien 20000005 (Ibu Hamil Test)
(20000005, 'DPT-HB-Hib',                     CURRENT_DATE - INTERVAL '21 days', CURRENT_DATE - INTERVAL '21 days', 'Sudah', NOW(), NOW()),
(20000005, 'Campak-Rubela (MR)',             CURRENT_DATE - INTERVAL '7 days',  CURRENT_DATE - INTERVAL '7 days',  'Sudah', NOW(), NOW()),
(20000005, 'Pneumokokus (PCV)',              CURRENT_DATE + INTERVAL '14 days', NULL,                               'Belum', NOW(), NOW());

-- 3. HASIL PEMERIKSAAN (dengan id_jadwal_imunisasi dari insert di atas)
-- Ambil ID jadwal yang baru dibuat
-- +goose StatementBegin
DO $$
DECLARE
    jadwal_ids INT[];
    jadwal_id INT;
    pasien_ids INT[] := ARRAY[20000004, 20000005];
    pasien_id INT;
    bb DECIMAL[];
    tb DECIMAL[];
    lk DECIMAL[];
    td TEXT[];
    stunting TEXT[];
    gizi TEXT[];
    catatan TEXT[];
    idx INT;
BEGIN
    -- Kumpulkan ID jadwal yang baru diinsert untuk pasien 20000004
    SELECT ARRAY_AGG(id_imunisasi ORDER BY id_imunisasi) INTO jadwal_ids
    FROM jadwal_imunisasi
    WHERE id_pasien IN (20000004, 20000005)
    AND created_at >= NOW() - INTERVAL '1 minute';

    IF array_length(jadwal_ids, 1) >= 4 THEN
        -- Pemeriksaan 1: Pasien 20000004, imunisasi BCG (sudah realisasi)
        INSERT INTO hasil_pemeriksaan (id_petugas_input, id_jadwal_imunisasi, berat_badan, tinggi_badan, lingkar_kepala, tekanan_darah, status_stunting, status_gizi, catatan, created_at, updated_at)
        VALUES (20000003, jadwal_ids[1], 3.5, 50.0, 34.0, '110/70', 'Normal', 'Gizi Baik', 'Imunisasi BCG pertama, bayi sehat.', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days');

        -- Pemeriksaan 2: Pasien 20000004, imunisasi Hepatitis B (sudah realisasi)
        INSERT INTO hasil_pemeriksaan (id_petugas_input, id_jadwal_imunisasi, berat_badan, tinggi_badan, lingkar_kepala, tekanan_darah, status_stunting, status_gizi, catatan, created_at, updated_at)
        VALUES (20000003, jadwal_ids[2], 4.2, 53.0, 35.0, '115/75', 'Normal', 'Gizi Baik', 'BB naik 0.7 kg, perkembangan normal.', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days');

        -- Pemeriksaan 3: Pasien 20000005, imunisasi DPT-HB-Hib (sudah realisasi)
        INSERT INTO hasil_pemeriksaan (id_petugas_input, id_jadwal_imunisasi, berat_badan, tinggi_badan, lingkar_kepala, tekanan_darah, status_stunting, status_gizi, catatan, created_at, updated_at)
        VALUES (20000003, jadwal_ids[4], 3.0, 48.0, 33.0, '100/65', 'Normal', 'Gizi Kurang', 'BB sedikit kurang, saran konsultasi gizi.', NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days');

        -- Pemeriksaan 4: Pasien 20000005, imunisasi Campak-Rubela (sudah realisasi)
        INSERT INTO hasil_pemeriksaan (id_petugas_input, id_jadwal_imunisasi, berat_badan, tinggi_badan, lingkar_kepala, tekanan_darah, status_stunting, status_gizi, catatan, created_at, updated_at)
        VALUES (20000003, jadwal_ids[5], 3.2, 49.0, 34.0, '105/70', 'Normal', 'Gizi Baik', 'Imunisasi MR, kondisi anak sehat.', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days');
    END IF;
END $$;
-- +goose StatementEnd

-- ============================================================
-- +goose Down
-- ============================================================
DELETE FROM hasil_pemeriksaan
WHERE id_petugas_input = 20000003
  AND created_at >= NOW() - INTERVAL '1 hour';

DELETE FROM jadwal_imunisasi
WHERE id_pasien IN (20000004, 20000005)
  AND created_at >= NOW() - INTERVAL '1 hour';

DELETE FROM anak
WHERE id_pasien = 20000004;
