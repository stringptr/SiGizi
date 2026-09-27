import { Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import ToastContainer from "./components/ToastContainer";

import { Sidebar } from "./components/sidebar";
import {Header} from "./components/header";
import { Footer } from "./components/footer";
import { GuestDashboard } from "./screens/guest/GuestDashboard";

// Screens
import LoginPage from "./screens/login/LoginPage";
import RegisterPage from "./screens/register/RegisterPage";
import Dashboard from "./screens/dashboard/dashboard";
import Monitoring from "./screens/monitoring/monitoring";
import TindakLanjut from "./screens/tindak-lanjut/tindak-lanjut";
import ArtikelKatalog from "./screens/artikel/ArtikelKatalog";
import ArtikelDetailPage from "./screens/artikel/ArtikelDetailPage";
import BidanArtikelPage from "./screens/bidan-artikel/BidanArtikelPage";
import DinkesReviewPage from "./screens/dinkes-review/DinkesReviewPage";
import UserManagement from "./screens/user-management/user-management";
import Notifikasi from "./screens/notifikasi/notifikasi";
import JadwalImunisasi from "./screens/jadwal-imunisasi/jadwal-imunisasi";
import ProfilePage from "./screens/profile/ProfilePage";

export type Role =
  | "Ibu/Wali"
  | "Bidan"
  | "Dinas Kesehatan"
  | "Kader Posyandu";

function AppShell(): JSX.Element {
  const { isLoggedIn, user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-3">
          <img src="/logo-sigizi.svg" alt="SiGizi" className="w-12 h-12 object-contain" />
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const currentRole: Role =
    isLoggedIn && user ? user.role : "Kader Posyandu";

  const goLogin = () => navigate("/login");

  return (
    <Routes>
      {/* Auth Pages */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Main Layout */}
      <Route
        path="/*"
        element={
          <div className="flex h-screen bg-neutral-50">
            <Sidebar
              currentRole={currentRole}
              onLoginClick={goLogin}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <Header
                currentRole={isLoggedIn ? currentRole : undefined}
                onLoginClick={goLogin}
              />

              <main className="flex-1 overflow-y-auto p-8">
                <Routes>
                  <Route
                    path="/"
                    element={
                      isLoggedIn
                        ? <Dashboard currentRole={currentRole} />
                        : <GuestDashboard />
                    }
                  />
                  <Route
                    path="/monitoring"
                    element={<Monitoring currentRole={currentRole} />}
                  />
                  <Route
                    path="/tindak-lanjut"
                    element={<TindakLanjut currentRole={currentRole} />}
                  />
                  {/* Katalog & baca artikel — publik, tanpa login */}
                  <Route path="/artikel" element={<ArtikelKatalog />} />
                  <Route path="/artikel/:id" element={<ArtikelDetailPage />} />
                  {/* Manajemen artikel (GraphQL) — guard role di halaman masing-masing */}
                  <Route path="/bidan/artikel" element={<BidanArtikelPage />} />
                  <Route path="/dinkes/review-artikel" element={<DinkesReviewPage />} />
                  <Route
                    path="/user-management"
                    element={<UserManagement />}
                  />
                  <Route
                    path="/notifikasi"
                    element={<Notifikasi role={currentRole} />}
                  />
                  <Route
                    path="/jadwal-imunisasi"
                    element={<JadwalImunisasi currentRole={currentRole} />}
                  />
                  <Route
                    path="/profile"
                    element={<ProfilePage />}
                  />
                </Routes>
              </main>

              <Footer />
            </div>
          </div>
        }
      />
    </Routes>
  );
}

export default function App(): JSX.Element {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppShell />
        <ToastContainer />
      </NotificationProvider>
    </AuthProvider>
  );
}