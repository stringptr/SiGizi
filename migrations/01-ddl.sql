-- ============================================================
--  SISTEM MONITORING GIZI IBU DAN ANAK
--  PostgreSQL DDL
-- ============================================================

-- ============================================================
-- MASTER TABLE
-- ============================================================

-- ============================================================
-- 1. MASTER LOKASI
-- ============================================================

CREATE TABLE lokasi (
  id_lokasi SERIAL PRIMARY KEY,

  nama_lokasi TEXT NOT NULL
  CHECK (length(nama_lokasi) <= 255),

  tipe_lokasi TEXT NOT NULL
  CHECK (
    tipe_lokasi IN (
      'PROVINSI',
      'KABUPATEN',
      'KECAMATAN',
      'KELURAHAN'
    )
  ),

  bagian_dari INT,

  CONSTRAINT fk_lokasi_parent
  FOREIGN KEY (bagian_dari)
  REFERENCES lokasi(id_lokasi)
);

-- ============================================================
-- 2. MASTER USER ACCOUNT
-- ============================================================

CREATE TABLE user_account (
  id_user SERIAL PRIMARY KEY,

  email TEXT NOT NULL UNIQUE
  CHECK (length(email) <= 255),

  password TEXT NOT NULL
  CHECK (length(password) <= 255),

  no_hp TEXT
  CHECK (length(no_hp) <= 20),

  status_verifikasi BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. MASTER DATA DIRI
-- ============================================================

CREATE TABLE data_diri (
  id_data_diri SERIAL PRIMARY KEY,

  id_user INT UNIQUE NOT NULL,

  nama TEXT NOT NULL
  CHECK (length(nama) <= 255),

  nik TEXT NOT NULL UNIQUE
  CHECK (length(nik) = 16),

  jenis_kelamin TEXT
  CHECK (
    jenis_kelamin IN (
      'LAKI_LAKI',
      'PEREMPUAN'
    )
  ),

  tanggal_lahir DATE,

  id_lokasi INT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_data_diri_user
  FOREIGN KEY (id_user)
  REFERENCES user_account(id_user)
  ON DELETE CASCADE,

  CONSTRAINT fk_data_diri_lokasi
  FOREIGN KEY (id_lokasi)
  REFERENCES lokasi(id_lokasi)
);

-- ============================================================
-- 4. MASTER DINAS KESEHATAN
-- ============================================================

CREATE TABLE dinas_kesehatan (
  id_user INT PRIMARY KEY,

  nama_instansi TEXT
  CHECK (length(nama_instansi) <= 255),

  jabatan TEXT
  CHECK (length(jabatan) <= 100),

  CONSTRAINT fk_dinas_user
  FOREIGN KEY (id_user)
  REFERENCES user_account(id_user)
  ON DELETE CASCADE
);

-- ============================================================
-- 5. MASTER BIDAN
-- ============================================================

CREATE TABLE bidan (
  id_user INT PRIMARY KEY,

  no_str TEXT NOT NULL UNIQUE
  CHECK (length(no_str) <= 100),

  id_lokasi_kerja INT,

  CONSTRAINT fk_bidan_user
  FOREIGN KEY (id_user)
  REFERENCES user_account(id_user)
  ON DELETE CASCADE,

  CONSTRAINT fk_bidan_lokasi
  FOREIGN KEY (id_lokasi_kerja)
  REFERENCES lokasi(id_lokasi)
);

-- ============================================================
-- 6. MASTER POSYANDU
-- ============================================================

CREATE TABLE posyandu (
  id_posyandu SERIAL PRIMARY KEY,

  nama_posyandu TEXT NOT NULL
  CHECK (length(nama_posyandu) <= 255),

  id_lokasi INT NOT NULL,

  id_bidan_penanggung_jawab INT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_posyandu_lokasi
  FOREIGN KEY (id_lokasi)
  REFERENCES lokasi(id_lokasi),

  CONSTRAINT fk_posyandu_bidan
  FOREIGN KEY (id_bidan_penanggung_jawab)
  REFERENCES bidan(id_user)
);

-- ============================================================
-- 7. MASTER KADER POSYANDU
-- ============================================================

CREATE TABLE kader_posyandu (
  id_user INT PRIMARY KEY,

  no_sk TEXT NOT NULL UNIQUE
  CHECK (length(no_sk) <= 100),

  id_posyandu INT NOT NULL,

  CONSTRAINT fk_kader_user
  FOREIGN KEY (id_user)
  REFERENCES user_account(id_user)
  ON DELETE CASCADE,

  CONSTRAINT fk_kader_posyandu
  FOREIGN KEY (id_posyandu)
  REFERENCES posyandu(id_posyandu)
);

-- ============================================================
-- 8. MASTER IBU
-- ============================================================

CREATE TABLE ibu (
  id_user INT PRIMARY KEY,

  CONSTRAINT fk_ibu_user
  FOREIGN KEY (id_user)
  REFERENCES user_account(id_user)
  ON DELETE CASCADE
);

-- ============================================================
-- 9. MASTER FASILITAS KESEHATAN
-- ============================================================

CREATE TABLE fasilitas_kesehatan (
  id_faskes SERIAL PRIMARY KEY,

  nama_faskes TEXT NOT NULL
  CHECK (length(nama_faskes) <= 255),

  tipe_faskes TEXT NOT NULL
  CHECK (
    tipe_faskes IN (
      'PUSKESMAS',
      'RUMAH_SAKIT',
      'KLINIK',
      'POSKESDES'
    )
  ),

  id_lokasi INT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_faskes_lokasi
  FOREIGN KEY (id_lokasi)
  REFERENCES lokasi(id_lokasi)
);

-- ============================================================
-- 10. MASTER PASIEN
-- ============================================================

CREATE TABLE pasien (
  id_pasien SERIAL PRIMARY KEY,

  tipe_pasien TEXT NOT NULL
  CHECK (
    tipe_pasien IN (
      'IBU_HAMIL',
      'ANAK'
    )
  ),

  id_posyandu INT NOT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_pasien_posyandu
  FOREIGN KEY (id_posyandu)
  REFERENCES posyandu(id_posyandu)
);

-- ============================================================
-- REFERENSI TABLE
-- ============================================================

-- ============================================================
-- 1. REFERENSI IBU HAMIL
-- ============================================================

CREATE TABLE ibu_hamil (
  id_pasien INT PRIMARY KEY,

  id_ibu INT NOT NULL,

  hpht DATE,

  bulan_mulai_hamil DATE,

  usia_kehamilan INT
  CHECK (usia_kehamilan >= 0),

  status_kehamilan TEXT
  CHECK (
    status_kehamilan IN (
      'TRIMESTER_1',
      'TRIMESTER_2',
      'TRIMESTER_3'
    )
  ),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_ibuhamil_pasien
  FOREIGN KEY (id_pasien)
  REFERENCES pasien(id_pasien)
  ON DELETE CASCADE,

  CONSTRAINT fk_ibuhamil_ibu
  FOREIGN KEY (id_ibu)
  REFERENCES ibu(id_user)
  ON DELETE CASCADE
);

-- ============================================================
-- 2. REFERENSI ANAK
-- ============================================================

CREATE TABLE anak (
  id_pasien INT PRIMARY KEY,

  id_wali INT NOT NULL,

  nama_anak TEXT NOT NULL
  CHECK (length(nama_anak) <= 255),

  nik TEXT NOT NULL UNIQUE
  CHECK (length(nik) = 16),

  tanggal_lahir DATE NOT NULL,

  jenis_kelamin TEXT NOT NULL
  CHECK (
    jenis_kelamin IN (
      'LAKI_LAKI',
      'PEREMPUAN'
    )
  ),

  berat_lahir NUMERIC(5,2),

  panjang_lahir NUMERIC(5,2),

  hubungan_dengan_wali TEXT
  CHECK (
    hubungan_dengan_wali IN (
      'KANDUNG',
      'TIRI',
      'ADOPSI',
      'LAINNYA'
    )
  ),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_anak_pasien
  FOREIGN KEY (id_pasien)
  REFERENCES pasien(id_pasien)
  ON DELETE CASCADE,

  CONSTRAINT fk_anak_wali
  FOREIGN KEY (id_wali)
  REFERENCES ibu(id_user)
  ON DELETE CASCADE
);

-- ============================================================
-- 3. REFERENSI JADWAL IMUNISASI
-- ============================================================

CREATE TABLE jadwal_imunisasi (
  id_imunisasi SERIAL PRIMARY KEY,

  id_pasien INT NOT NULL,

  nama_vaksin TEXT NOT NULL
  CHECK (length(nama_vaksin) <= 255),

  tanggal_jadwal DATE,

  tanggal_realisasi DATE,

  status_imunisasi TEXT
  CHECK (
    status_imunisasi IN (
      'SUDAH',
      'BELUM'
    )
  ),

  CONSTRAINT fk_imunisasi_anak
  FOREIGN KEY (id_pasien)
  REFERENCES anak(id_pasien)
  ON DELETE CASCADE
);

-- ============================================================
-- 4. REFERENSI ARTIKEL
-- ============================================================

CREATE TABLE artikel (
  id_artikel SERIAL PRIMARY KEY,

  judul TEXT NOT NULL
  CHECK (length(judul) <= 255),

  isi_artikel TEXT NOT NULL
  CHECK (length(isi_artikel) <= 5000),

  kategori TEXT
  CHECK (length(kategori) <= 100),

  status_artikel TEXT
  CHECK (
    status_artikel IN (
      'DRAFT',
      'PENDING',
      'APPROVED',
      'REJECTED'
    )
  ),

  id_penulis INT NOT NULL,

  id_verifikator INT,

  tanggal_publish DATE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_artikel_penulis
  FOREIGN KEY (id_penulis)
  REFERENCES user_account(id_user),

  CONSTRAINT fk_artikel_verifikator
  FOREIGN KEY (id_verifikator)
  REFERENCES user_account(id_user)
);

-- ============================================================
-- TRANSAKSI TABLE
-- ============================================================

-- ============================================================
-- 1. TRANSAKSI HASIL PEMERIKSAAN
-- ============================================================

CREATE TABLE hasil_pemeriksaan (
  id_hasil_pemeriksaan SERIAL PRIMARY KEY,

  id_pasien INT NOT NULL,

  id_petugas_input INT NOT NULL,

  tanggal_pemeriksaan DATE NOT NULL,

  berat_badan NUMERIC(5,2),

  tinggi_badan NUMERIC(5,2),

  lingkar_kepala NUMERIC(5,2),

  tekanan_darah TEXT
  CHECK (length(tekanan_darah) <= 20),

  status_gizi TEXT
  CHECK (
    status_gizi IN (
      'NORMAL',
      'GIZI_KURANG',
      'GIZI_BURUK',
      'WASTING',
      'OBESITAS'
    )
  ),

  status_stunting TEXT
  CHECK (
    status_stunting IN (
      'NORMAL',
      'STUNTING',
      'SEVERE_STUNTING'
    )
  ),

  catatan TEXT
  CHECK (length(catatan) <= 1000),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_hasil_pasien
  FOREIGN KEY (id_pasien)
  REFERENCES pasien(id_pasien),

  CONSTRAINT fk_hasil_petugas
  FOREIGN KEY (id_petugas_input)
  REFERENCES user_account(id_user)
);

-- ============================================================
-- 2. TRANSAKSI TINDAK LANJUT
-- ============================================================

CREATE TABLE tindak_lanjut (
  id_tindak_lanjut SERIAL PRIMARY KEY,

  id_hasil_pemeriksaan INT UNIQUE NOT NULL,

  id_bidan INT NOT NULL,

  catatan_medis TEXT
  CHECK (length(catatan_medis) <= 1000),

  rekomendasi TEXT
  CHECK (length(rekomendasi) <= 1000),

  jadwal_kontrol DATE,

  status_pasien TEXT
  CHECK (length(status_pasien) <= 100),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_tindak_hasil
  FOREIGN KEY (id_hasil_pemeriksaan)
  REFERENCES hasil_pemeriksaan(id_hasil_pemeriksaan)
  ON DELETE CASCADE,

  CONSTRAINT fk_tindak_bidan
  FOREIGN KEY (id_bidan)
  REFERENCES bidan(id_user)
  ON DELETE CASCADE
);

-- ============================================================
-- 3. TRANSAKSI RUJUKAN
-- ============================================================

CREATE TABLE rujukan (
  id_rujukan SERIAL PRIMARY KEY,

  id_tindak_lanjut INT UNIQUE NOT NULL,

  id_faskes INT NOT NULL,

  alasan_rujukan TEXT
  CHECK (length(alasan_rujukan) <= 1000),

  tanggal_rujukan DATE,

  status_rujukan TEXT
  CHECK (
    status_rujukan IN (
      'MENUNGGU_KONFIRMASI',
      'MENUNGGU_HASIL_LAB',
      'DIPROSES',
      'DITERIMA',
      'SELESAI',
      'DITOLAK'
    )
  ),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

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

CREATE TABLE notifikasi (
  id_notifikasi SERIAL PRIMARY KEY,

  id_user INT NOT NULL,

  judul TEXT NOT NULL
  CHECK (length(judul) <= 255),

  pesan TEXT
  CHECK (length(pesan) <= 1000),

  tipe_notifikasi TEXT
  CHECK (
    tipe_notifikasi IN (
      'MONITORING',
      'TINDAK_LANJUT',
      'RUJUKAN',
      'EDUKASI'
    )
  ),

  status_baca BOOLEAN DEFAULT FALSE,

  tanggal_kirim TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_notifikasi_user
  FOREIGN KEY (id_user)
  REFERENCES user_account(id_user)
  ON DELETE CASCADE
);

-- ============================================================
-- 5. TRANSAKSI AUDIT LOG
-- ============================================================

CREATE TABLE audit_log (
  id_log SERIAL PRIMARY KEY,

  id_user INT,

  aktivitas TEXT NOT NULL
  CHECK (length(aktivitas) <= 1000),

  ip_address TEXT
  CHECK (length(ip_address) <= 100),

  waktu_aktivitas TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_audit_user
  FOREIGN KEY (id_user)
  references user_account(id_user)
);
