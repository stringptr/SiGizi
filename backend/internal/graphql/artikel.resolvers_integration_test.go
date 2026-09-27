//go:build integration

package graphql

import (
	"context"
	"encoding/json"
	"net/http"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/stringptr/SiGizi/backend/internal/feature/artikel"
	"github.com/stringptr/SiGizi/backend/internal/feature/auditlog"
	"github.com/stringptr/SiGizi/backend/internal/feature/notification"
	"github.com/stringptr/SiGizi/backend/internal/jwtutils"
	"github.com/stringptr/SiGizi/backend/internal/testutils"
)

// =============================================================================
// Integration test: memverifikasi bahwa semua mutation GraphQL menjalankan
// perilaku PERSIS SAMA dengan endpoint REST lama, karena keduanya memanggil
// service (feature/artikel/service.go) yang sama:
//   - createArtikel  vs POST   /v1/artikel      (adminGroup)
//   - updateArtikel  vs PATCH  /v1/artikel/{id} (adminGroup)
//   - reviewArtikel  vs PATCH  /v1/artikel/{id}/review (dinkesGroup)
//   - deleteArtikel  vs DELETE /v1/artikel/{id} (dinkesGroup)
// =============================================================================

type graphqlTestFixture struct {
	handler http.Handler
	jwtUtil *jwtutils.JWT
	pool    *pgxpool.Pool
}

type graphqlSeedIDs struct {
	PublishedArtikelID int32
	PendingArtikelID   int32
}

func setupGraphQLIntegrationTest(t *testing.T) *graphqlTestFixture {
	t.Helper()

	pool := testutils.NewTestDB(t)
	jwtUtil := jwtutils.New("test-secret-graphql")

	svcRepo := artikel.NewRepo(pool)
	auditRepo := auditlog.NewRepo(pool)
	notifRepo := notification.NewRepo(pool)
	notifPub := &testutils.NoopNotifPublisher{}
	artikelService := artikel.NewService(svcRepo, auditRepo, notifRepo, notifPub)

	handler := NewHandler(pool, &jwtUtil, artikelService, svcRepo)

	return &graphqlTestFixture{
		handler: handler,
		jwtUtil: &jwtUtil,
		pool:    pool,
	}
}

func (f *graphqlTestFixture) cleanup(t *testing.T) {
	t.Helper()
	testutils.TruncateArtikelTables(t, f.pool)
	testutils.TruncateNotifikasiTables(t, f.pool)
	testutils.TruncateAuthTables(t, f.pool)
}

func (f *graphqlTestFixture) seed(t *testing.T) *testutils.AuthSeedIDs {
	t.Helper()
	return testutils.SeedAuthData(t, f.pool)
}

func (f *graphqlTestFixture) seedArtikel(t *testing.T, authIDs *testutils.AuthSeedIDs) *graphqlSeedIDs {
	t.Helper()
	ctx := context.Background()
	now := time.Now().Truncate(time.Microsecond)

	var publishedID int32
	err := f.pool.QueryRow(ctx, `
		INSERT INTO artikel (judul, isi_artikel, kategori, status_artikel, id_penulis, id_verifikator, tanggal_publish, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
		RETURNING id_artikel`,
		"Artikel Published", "Isi artikel yang sudah dipublikasikan.", "Edukasi",
		"Dipublikasikan", authIDs.VerifiedUserID, &authIDs.AdminUserID, now, now,
	).Scan(&publishedID)
	if err != nil {
		t.Fatalf("failed to seed published artikel: %v", err)
	}

	var pendingID int32
	err = f.pool.QueryRow(ctx, `
		INSERT INTO artikel (judul, isi_artikel, kategori, status_artikel, id_penulis, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $6)
		RETURNING id_artikel`,
		"Artikel Pending", "Isi artikel yang menunggu verifikasi.", "Gizi",
		"Menunggu Verifikasi", authIDs.VerifiedUserID, now,
	).Scan(&pendingID)
	if err != nil {
		t.Fatalf("failed to seed pending artikel: %v", err)
	}

	return &graphqlSeedIDs{
		PublishedArtikelID: publishedID,
		PendingArtikelID:   pendingID,
	}
}

// doGraphQL mengirim mutation/query GraphQL dan mengembalikan response JSON.
func (f *graphqlTestFixture) doGraphQL(t *testing.T, query string, variables map[string]any, cookies ...*http.Cookie) map[string]any {
	t.Helper()

	resp := testutils.DoRequest(f.handler, http.MethodPost, "/graphql", map[string]any{
		"query":     query,
		"variables": variables,
	}, cookies...)
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", resp.StatusCode, testutils.ReadBody(resp))
	}

	var out map[string]any
	if err := json.Unmarshal(testutils.ReadBody(resp), &out); err != nil {
		t.Fatalf("failed to unmarshal graphql response: %v", err)
	}
	return out
}

// =============================================================================
// 1. createArtikel — role validation + auto-publish Dinkes
// =============================================================================

func TestGraphQLCreateArtikel(t *testing.T) {
	f := setupGraphQLIntegrationTest(t)
	defer f.cleanup(t)
	authIDs := f.seed(t)

	const query = `
		mutation CreateArtikel($input: CreateArtikelInput!) {
			createArtikel(input: $input) {
				idArtikel
				statusArtikel
			}
		}`

	t.Run("401 unauthorized tanpa login", func(t *testing.T) {
		out := f.doGraphQL(t, query, map[string]any{
			"input": map[string]any{"judul": "Test", "isiArtikel": "Isi"},
		})
		errs := out["errors"].([]any)
		ext := errs[0].(map[string]any)["extensions"].(map[string]any)
		if ext["code"] != "unauthorized" {
			t.Fatalf("expected code unauthorized, got %v", ext["code"])
		}
	})

	t.Run("403 forbidden role non-ADMIN (USER biasa)", func(t *testing.T) {
		cookie := testutils.AccessCookie(f.jwtUtil, authIDs.RegularUserID, []string{"USER"})
		out := f.doGraphQL(t, query, map[string]any{
			"input": map[string]any{"judul": "Test", "isiArtikel": "Isi"},
		}, cookie)
		errs := out["errors"].([]any)
		ext := errs[0].(map[string]any)["extensions"].(map[string]any)
		if ext["code"] != "forbidden" {
			t.Fatalf("expected code forbidden, got %v", ext["code"])
		}
	})

	t.Run("Bidan berhasil create -> Menunggu Verifikasi", func(t *testing.T) {
		cookie := testutils.AccessCookie(f.jwtUtil, authIDs.VerifiedUserID, []string{"BIDAN"})
		out := f.doGraphQL(t, query, map[string]any{
			"input": map[string]any{"judul": "Artikel Bidan", "isiArtikel": "Isi artikel bidan.", "kategori": "Edukasi"},
		}, cookie)

		data := out["data"].(map[string]any)["createArtikel"].(map[string]any)
		if data["statusArtikel"] != "Menunggu Verifikasi" {
			t.Fatalf("expected status 'Menunggu Verifikasi', got %v", data["statusArtikel"])
		}

		// Verifikasi persistence di DB (persis REST).
		var status string
		err := f.pool.QueryRow(context.Background(),
			`SELECT status_artikel FROM artikel WHERE id_artikel = $1`, int(data["idArtikel"].(float64))).Scan(&status)
		if err != nil {
			t.Fatalf("artikel not persisted: %v", err)
		}
		if status != "Menunggu Verifikasi" {
			t.Fatalf("expected DB status 'Menunggu Verifikasi', got %s", status)
		}
	})

	t.Run("Dinkes create -> auto-publish Dipublikasikan", func(t *testing.T) {
		cookie := testutils.AccessCookie(f.jwtUtil, authIDs.AdminUserID, []string{"DINKES"})
		out := f.doGraphQL(t, query, map[string]any{
			"input": map[string]any{"judul": "Artikel Dinkes", "isiArtikel": "Isi artikel dinkes."},
		}, cookie)

		data := out["data"].(map[string]any)["createArtikel"].(map[string]any)
		if data["statusArtikel"] != "Dipublikasikan" {
			t.Fatalf("expected auto-publish 'Dipublikasikan', got %v", data["statusArtikel"])
		}
	})
}

// =============================================================================
// 2. updateArtikel — role validation + ownership + state machine
// =============================================================================

func TestGraphQLUpdateArtikel(t *testing.T) {
	f := setupGraphQLIntegrationTest(t)
	defer f.cleanup(t)
	authIDs := f.seed(t)
	ids := f.seedArtikel(t, authIDs)

	const query = `
		mutation UpdateArtikel($id: Int!, $input: UpdateArtikelInput!) {
			updateArtikel(id: $id, input: $input) {
				idArtikel
				judul
				statusArtikel
				penulis { idUser nama }
			}
		}`

	t.Run("401 unauthorized tanpa login", func(t *testing.T) {
		out := f.doGraphQL(t, query, map[string]any{
			"id":    int(ids.PendingArtikelID),
			"input": map[string]any{"judul": "Hack"},
		})
		errs := out["errors"].([]any)
		ext := errs[0].(map[string]any)["extensions"].(map[string]any)
		if ext["code"] != "unauthorized" {
			t.Fatalf("expected code unauthorized, got %v", ext["code"])
		}
	})

	t.Run("403 forbidden: non-pemilik tidak boleh edit", func(t *testing.T) {
		// Regular user dengan role ADMIN tapi bukan pemilik artikel
		// (IDPenulis artikel = VerifiedUserID).
		otherAdmin := authIDs.AdminUserID + 999
		cookie := testutils.AccessCookie(f.jwtUtil, otherAdmin, []string{"ADMIN"})
		out := f.doGraphQL(t, query, map[string]any{
			"id":    int(ids.PendingArtikelID),
			"input": map[string]any{"judul": "Judul Baru"},
		}, cookie)
		errs := out["errors"].([]any)
		ext := errs[0].(map[string]any)["extensions"].(map[string]any)
		if ext["code"] != "forbidden" {
			t.Fatalf("expected code forbidden, got %v", ext["code"])
		}
	})

	t.Run("403 forbidden: artikel sudah Dipublikasikan tidak boleh diedit", func(t *testing.T) {
		cookie := testutils.AccessCookie(f.jwtUtil, authIDs.VerifiedUserID, []string{"BIDAN"})
		out := f.doGraphQL(t, query, map[string]any{
			"id":    int(ids.PublishedArtikelID),
			"input": map[string]any{"judul": "Edit Published"},
		}, cookie)
		errs := out["errors"].([]any)
		ext := errs[0].(map[string]any)["extensions"].(map[string]any)
		if ext["code"] != "forbidden" {
			t.Fatalf("expected code forbidden, got %v", ext["code"])
		}
	})

	t.Run("pemilik berhasil edit artikel Menunggu Verifikasi", func(t *testing.T) {
		cookie := testutils.AccessCookie(f.jwtUtil, authIDs.VerifiedUserID, []string{"BIDAN"})
		out := f.doGraphQL(t, query, map[string]any{
			"id":    int(ids.PendingArtikelID),
			"input": map[string]any{"judul": "Judul Diperbarui GraphQL"},
		}, cookie)

		data := out["data"].(map[string]any)["updateArtikel"].(map[string]any)
		if data["judul"] != "Judul Diperbarui GraphQL" {
			t.Fatalf("expected judul updated, got %v", data["judul"])
		}

		// Verifikasi persistence di DB (persis REST).
		var judul string
		err := f.pool.QueryRow(context.Background(),
			`SELECT judul FROM artikel WHERE id_artikel = $1`, ids.PendingArtikelID).Scan(&judul)
		if err != nil {
			t.Fatalf("failed to query artikel: %v", err)
		}
		if judul != "Judul Diperbarui GraphQL" {
			t.Fatalf("expected DB judul 'Judul Diperbarui GraphQL', got %s", judul)
		}
	})
}

// =============================================================================
// 3. reviewArtikel — role DINKES + state machine (setujui/tolak)
// =============================================================================

func TestGraphQLReviewArtikel(t *testing.T) {
	f := setupGraphQLIntegrationTest(t)
	defer f.cleanup(t)
	authIDs := f.seed(t)
	ids := f.seedArtikel(t, authIDs)

	const query = `
		mutation ReviewArtikel($id: Int!, $input: ReviewArtikelInput!) {
			reviewArtikel(id: $id, input: $input) {
				idArtikel
				statusArtikel
				tanggalPublish
			}
		}`

	t.Run("401 unauthorized tanpa login", func(t *testing.T) {
		out := f.doGraphQL(t, query, map[string]any{
			"id":    int(ids.PendingArtikelID),
			"input": map[string]any{"aksi": "setujui"},
		})
		errs := out["errors"].([]any)
		ext := errs[0].(map[string]any)["extensions"].(map[string]any)
		if ext["code"] != "unauthorized" {
			t.Fatalf("expected code unauthorized, got %v", ext["code"])
		}
	})

	t.Run("403 forbidden role non-DINKES (Bidan)", func(t *testing.T) {
		cookie := testutils.AccessCookie(f.jwtUtil, authIDs.VerifiedUserID, []string{"BIDAN"})
		out := f.doGraphQL(t, query, map[string]any{
			"id":    int(ids.PendingArtikelID),
			"input": map[string]any{"aksi": "setujui"},
		}, cookie)
		errs := out["errors"].([]any)
		ext := errs[0].(map[string]any)["extensions"].(map[string]any)
		if ext["code"] != "forbidden" {
			t.Fatalf("expected code forbidden, got %v", ext["code"])
		}
	})

	t.Run("Dinkes setujui -> Dipublikasikan + id_verifikator + tanggal_publish", func(t *testing.T) {
		cookie := testutils.AccessCookie(f.jwtUtil, authIDs.AdminUserID, []string{"DINKES"})
		out := f.doGraphQL(t, query, map[string]any{
			"id":    int(ids.PendingArtikelID),
			"input": map[string]any{"aksi": "setujui"},
		}, cookie)

		data := out["data"].(map[string]any)["reviewArtikel"].(map[string]any)
		if data["statusArtikel"] != "Dipublikasikan" {
			t.Fatalf("expected 'Dipublikasikan', got %v", data["statusArtikel"])
		}
		if data["tanggalPublish"] == nil {
			t.Fatal("expected tanggalPublish terisi setelah setujui")
		}

		// Verifikasi DB: id_verifikator + tanggal_publish (persis REST).
		var idVerifikator int32
		var tanggalPublish *time.Time
		err := f.pool.QueryRow(context.Background(),
			`SELECT id_verifikator, tanggal_publish FROM artikel WHERE id_artikel = $1`, ids.PendingArtikelID).
			Scan(&idVerifikator, &tanggalPublish)
		if err != nil {
			t.Fatalf("failed to query artikel: %v", err)
		}
		if idVerifikator != authIDs.AdminUserID {
			t.Fatalf("expected id_verifikator %d, got %d", authIDs.AdminUserID, idVerifikator)
		}
		if tanggalPublish == nil {
			t.Fatal("expected tanggal_publish terisi di DB")
		}
	})

	t.Run("Dinkes tolak -> Ditolak + catatan_review diterima", func(t *testing.T) {
		// Seed artikel pending baru untuk skenario tolak.
		authIDs2 := authIDs
		ctx := context.Background()
		now := time.Now().Truncate(time.Microsecond)
		var pendingID int32
		err := f.pool.QueryRow(ctx, `
			INSERT INTO artikel (judul, isi_artikel, kategori, status_artikel, id_penulis, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $6)
			RETURNING id_artikel`,
			"Artikel Tolak", "Isi artikel ditolak.", "Gizi",
			"Menunggu Verifikasi", authIDs2.VerifiedUserID, now,
		).Scan(&pendingID)
		if err != nil {
			t.Fatalf("failed to seed pending artikel: %v", err)
		}

		cookie := testutils.AccessCookie(f.jwtUtil, authIDs.AdminUserID, []string{"DINKES"})
		out := f.doGraphQL(t, query, map[string]any{
			"id":    int(pendingID),
			"input": map[string]any{"aksi": "tolak", "catatanReview": "Konten tidak layak."},
		}, cookie)

		data := out["data"].(map[string]any)["reviewArtikel"].(map[string]any)
		if data["statusArtikel"] != "Ditolak" {
			t.Fatalf("expected 'Ditolak', got %v", data["statusArtikel"])
		}

		// Verifikasi DB (persis REST).
		var status string
		err = f.pool.QueryRow(ctx,
			`SELECT status_artikel FROM artikel WHERE id_artikel = $1`, pendingID).Scan(&status)
		if err != nil {
			t.Fatalf("failed to query artikel: %v", err)
		}
		if status != "Ditolak" {
			t.Fatalf("expected DB status 'Ditolak', got %s", status)
		}
	})

	t.Run("404 not_found: artikel tidak ada / bukan status Menunggu Verifikasi", func(t *testing.T) {
		cookie := testutils.AccessCookie(f.jwtUtil, authIDs.AdminUserID, []string{"DINKES"})
		out := f.doGraphQL(t, query, map[string]any{
			"id":    int(ids.PublishedArtikelID), // sudah Dipublikasikan
			"input": map[string]any{"aksi": "setujui"},
		}, cookie)
		errs := out["errors"].([]any)
		ext := errs[0].(map[string]any)["extensions"].(map[string]any)
		if ext["code"] != "not_found" {
			t.Fatalf("expected code not_found, got %v", ext["code"])
		}
	})
}

// =============================================================================
// 4. deleteArtikel — role DINKES
// =============================================================================

func TestGraphQLDeleteArtikel(t *testing.T) {
	f := setupGraphQLIntegrationTest(t)
	defer f.cleanup(t)
	authIDs := f.seed(t)
	ids := f.seedArtikel(t, authIDs)

	const query = `
		mutation DeleteArtikel($id: Int!) {
			deleteArtikel(id: $id)
		}`

	t.Run("401 unauthorized tanpa login", func(t *testing.T) {
		out := f.doGraphQL(t, query, map[string]any{"id": int(ids.PendingArtikelID)})
		errs := out["errors"].([]any)
		ext := errs[0].(map[string]any)["extensions"].(map[string]any)
		if ext["code"] != "unauthorized" {
			t.Fatalf("expected code unauthorized, got %v", ext["code"])
		}
	})

	t.Run("403 forbidden role non-DINKES", func(t *testing.T) {
		cookie := testutils.AccessCookie(f.jwtUtil, authIDs.VerifiedUserID, []string{"BIDAN"})
		out := f.doGraphQL(t, query, map[string]any{"id": int(ids.PendingArtikelID)}, cookie)
		errs := out["errors"].([]any)
		ext := errs[0].(map[string]any)["extensions"].(map[string]any)
		if ext["code"] != "forbidden" {
			t.Fatalf("expected code forbidden, got %v", ext["code"])
		}
	})

	t.Run("Dinkes berhasil hapus", func(t *testing.T) {
		cookie := testutils.AccessCookie(f.jwtUtil, authIDs.AdminUserID, []string{"DINKES"})
		out := f.doGraphQL(t, query, map[string]any{"id": int(ids.PendingArtikelID)}, cookie)

		data := out["data"].(map[string]any)["deleteArtikel"].(bool)
		if !data {
			t.Fatal("expected deleteArtikel == true")
		}

		// Verifikasi DB: artikel benar-benar terhapus (persis REST).
		var count int
		err := f.pool.QueryRow(context.Background(),
			`SELECT COUNT(*) FROM artikel WHERE id_artikel = $1`, ids.PendingArtikelID).Scan(&count)
		if err != nil {
			t.Fatalf("failed to query artikel: %v", err)
		}
		if count != 0 {
			t.Fatal("expected artikel terhapus dari DB")
		}
	})
}
