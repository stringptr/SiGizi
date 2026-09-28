import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, LogOut, LogIn, ChevronDown, ArrowRight } from 'lucide-react';
import type { Role } from '../App';
import { useAuth, useNotifications } from '../context/AuthContext';
import { apiPatch } from '../lib/api';

interface HeaderProps {
  currentRole?: Role;
  onLoginClick: () => void;
  onChangeRole?: (role: Role) => void;
}

interface NotifPreview {
  id_notifikasi: number;
  judul: string;
  pesan: string | null;
  tipe_notifikasi: string;
  status_baca: boolean;
  tanggal_kirim: string;
}

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard Overview',
  '/monitoring': 'Monitoring Gizi Ibu dan Anak',
  '/tindak-lanjut': 'Tindak Lanjut',
  '/jadwal-imunisasi': 'Jadwal Imunisasi',
  '/artikel': 'Artikel',
  '/user-management': 'User Management',
  '/notifikasi': 'Notifikasi',
};

const TIPE_DOT: Record<string, string> = {
  Pemeriksaan: 'bg-blue-500',
  Imunisasi: 'bg-green-500',
  Rujukan: 'bg-orange-500',
  Edukasi: 'bg-purple-500',
  Pengingat: 'bg-yellow-500',
};

const TIPE_ROUTE: Record<string, string> = {
  Pemeriksaan: '/monitoring',
  Imunisasi: '/jadwal-imunisasi',
  Rujukan: '/tindak-lanjut',
  Edukasi: '/artikel',
  Pengingat: '/notifikasi',
};

function getInitials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function Header({ currentRole, onLoginClick, onChangeRole }: HeaderProps): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { liveNotifications, unreadCount } = useNotifications();

  const notifPreviews: NotifPreview[] = liveNotifications.slice(0, 4).map((n) => ({
    id_notifikasi: n.id,
    judul: n.judul,
    pesan: n.pesan,
    tipe_notifikasi: n.tipe,
    status_baca: false,
    tanggal_kirim: n.created_at,
  }));

  // /artikel/:id tidak ada di PAGE_TITLES (path-nya dinamis) → cari prefix-nya
  const pageTitle = PAGE_TITLES[location.pathname]
    ?? Object.entries(PAGE_TITLES).find(
      ([path, title]) => path !== '/' && location.pathname.startsWith(`${path}/`) && title,
    )?.[1]
    ?? 'SiGizi';

  // Halaman artikel punya pencarian sendiri, jadi search bar global disembunyikan
  const hideGlobalSearch = location.pathname === '/monitoring'
    || location.pathname.startsWith('/artikel');

  const handleNotifClick = async (id: number, tipe: string) => {
    setShowNotifications(false);
    try {
      await apiPatch(`/notifikasi/${id}/read`);
      const route = TIPE_ROUTE[tipe] ?? '/notifikasi';
      navigate(route);
    } catch {
      navigate('/notifikasi');
    }
  };


  const handleLogout = async () => {
    setShowProfileMenu(false);
    await logout();
    navigate('/');
  };

  return (
    <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-neutral-100 relative z-30">
      {/* Left: page title + role badge/switcher */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-neutral-800 font-headline">{pageTitle}</h1>
        {isLoggedIn && currentRole && (
          <>
            <div className="h-5 w-px bg-neutral-200" />
            {onChangeRole ? (
              <div className="relative flex items-center">
                <select
                  value={currentRole}
                  onChange={(e) => onChangeRole(e.target.value as Role)}
                  className="appearance-none bg-white border border-primary text-primary text-xs font-semibold px-3 py-1.5 pr-8 rounded-lg focus:outline-none cursor-pointer"
                >
                  <option value="Ibu/Wali">Role: Ibu/Wali</option>
                  <option value="Bidan">Role: Bidan</option>
                  <option value="Dinas Kesehatan">Role: Dinas Kesehatan</option>
                  <option value="Kader Posyandu">Role: Kader Posyandu</option>
                </select>
                <span className="absolute right-2.5 pointer-events-none text-primary">
                  <ChevronDown size={14} />
                </span>
              </div>
            ) : (
              <span className="text-xs font-semibold text-primary border border-primary px-2.5 py-1 rounded-lg font-body">
                {currentRole}
              </span>
            )}
          </>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Search — hide on monitoring & artikel (punya pencarian sendiri) */}
        {isLoggedIn && !hideGlobalSearch && (
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Cari data..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-56 pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-700 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-200 font-body"
            />
          </div>
        )}

        {isLoggedIn ? (
          <>
            {/* Notification bell — preview dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                }}
                className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors relative"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-xl border border-neutral-100 overflow-hidden z-50">
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100">
                    <div className="flex items-center gap-2">
                      <Bell size={15} className="text-neutral-500" />
                      <span className="text-sm font-bold text-neutral-800 font-headline">Notifikasi</span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
                          {unreadCount} baru
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => { navigate('/notifikasi'); setShowNotifications(false); }}
                      className="text-xs text-primary font-semibold hover:text-primary-600 transition-colors flex items-center gap-1"
                    >
                      Lihat Semua <ArrowRight size={11} />
                    </button>
                  </div>

                  {/* Preview list */}
                  <div className="divide-y divide-neutral-50 max-h-80 overflow-y-auto">
                    {notifPreviews.length === 0 ? (
                      <div className="px-5 py-8 text-center text-sm text-neutral-400">
                        Belum ada notifikasi
                      </div>
                    ) : (
                      notifPreviews.map((item) => (
                        <div
                          key={item.id_notifikasi}
                          onClick={() => handleNotifClick(item.id_notifikasi, item.tipe_notifikasi)}
                          className="flex items-start gap-3 px-5 py-3.5 hover:bg-neutral-50 cursor-pointer transition-colors"
                        >
                          {/* Category dot */}
                          <div className="flex-shrink-0 mt-1.5">
                            <span className={`w-2 h-2 rounded-full block ${TIPE_DOT[item.tipe_notifikasi] ?? 'bg-neutral-300'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-neutral-800 leading-snug truncate">{item.judul}</p>
                            {item.pesan && (
                              <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1 leading-relaxed">{item.pesan}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[10px] text-neutral-400">
                                {new Date(item.tanggal_kirim).toLocaleDateString('id-ID')}
                              </span>
                              {!item.status_baca && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                                  Baru
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer CTA */}
                  <div className="px-5 py-3 bg-neutral-50 border-t border-neutral-100">
                    <button
                      onClick={() => { navigate('/notifikasi'); setShowNotifications(false); }}
                      className="w-full py-2 bg-primary hover:bg-primary-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                    >
                      Buka Semua Notifikasi <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile avatar + dropdown */}
            <div className="relative">
              <button
                onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
                className="flex items-center gap-2 p-1 hover:bg-neutral-50 rounded-xl transition-colors"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-100 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {getInitials(user?.name)}
                </div>
                <span className="text-sm font-semibold text-neutral-700 font-body hidden sm:inline">
                  {user?.name ?? ''}
                </span>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-neutral-100 py-2 z-50">
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-neutral-100">
                    <p className="text-sm font-semibold text-neutral-800 font-body">{user?.name}</p>
                    <p className="text-xs text-neutral-500 font-body mt-0.5">{user?.email}</p>
                    <p className="text-xs text-neutral-400 font-body mt-0.5">{user?.role}</p>
                  </div>
                  {/* Edit Profil */}
                  <button
                    onClick={() => { navigate('/profile'); setShowProfileMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors font-body"
                  >
                    <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Edit Profil
                  </button>
                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-body"
                  >
                    <LogOut size={15} />
                    Keluar
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Not logged in → Login button */
          <button
            onClick={onLoginClick}
            className="flex items-center gap-2 bg-primary hover:bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-semibold font-body transition-colors"
          >
            <LogIn size={16} />
            Masuk
          </button>
        )}
      </div>

      {/* Click-outside dismiss overlay */}
      {(showNotifications || showProfileMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setShowNotifications(false); setShowProfileMenu(false); }}
        />
      )}
    </header>
  );
}
