import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Role } from '../App';
import { apiPost, apiGet, ApiError, setOnUnauthorized } from '../lib/api';
import { useNotificationSSE } from '../hooks/useNotificationSSE';
import type { SSENotification } from '../hooks/useNotificationSSE';

export interface UserProfile {
  idUser: number;
  name: string;
  email: string;
  nik: string;
  role: Role;
  roles: string[];
  avatarUrl: string;
}

interface LoginPayload {
  email?: string;
  nik?: string;
  password: string;
}

interface AuthContextValue {
  user: UserProfile | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  logout: () => Promise<void>;
  isLoggedIn: boolean;
  loading: boolean;
  unreadCount: number;
  liveNotifications: SSENotification[];
  refreshProfile: () => Promise<void>;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  access_token_expires_in: number;
  refresh_token_expires_in: number;
}

export interface RegisterFormData {
  email: string;
  password: string;
  no_hp: string;
  nama: string;
  nik: string;
  jenis_kelamin: string;
  tanggal_lahir: string;
  id_lokasi: number;
  id_pendidikan?: number | null;
  id_pekerjaan?: number | null;
  id_pendapatan?: number | null;
  jumlah_tanggungan?: number | null;
  role: string;
  no_str?: string;
  wilayah_kerja?: number | null;
  no_sk?: string;
  id_posyandu?: number | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapRolesToFrontendRole(roles: string[]): Role {
  if (roles.includes('DINKES') || roles.includes('SUPER_ADMIN')) return 'Dinas Kesehatan';
  if (roles.includes('BIDAN')) return 'Bidan';
  if (roles.includes('KADER')) return 'Kader Posyandu';
  return 'Ibu/Wali';
}

function getAvatarUrl(name: string): string {
  const seed = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${seed}&background=6366f1&color=fff&size=256`;
}

export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const stored = localStorage.getItem('sigizi_user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        localStorage.removeItem('sigizi_user');
      }
    }
    return null;
  });
  const [loading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [liveNotifications, setLiveNotifications] = useState<SSENotification[]>([]);

  useNotificationSSE(
    user !== null,
    (notif) => setLiveNotifications((prev) => [notif, ...prev].slice(0, 50)),
    setUnreadCount
  );

  const clearAuth = useCallback(() => {
    setUser(null);
    localStorage.removeItem('sigizi_user');
  }, []);

  useEffect(() => {
    setOnUnauthorized(clearAuth);
  }, [clearAuth]);

	useEffect(() => {
		const stored = localStorage.getItem('sigizi_user');
		if (!stored) return;

		const checkSession = async () => {
			try {
				const me = await apiGet<{
					id_user: number;
					nama: string;
					roles: string[];
					email: string;
					nik: string;
				}>('/auth/me');

				const profile: UserProfile = {
					idUser: me.id_user,
					name: me.nama,
					email: me.email,
					nik: me.nik,
					role: mapRolesToFrontendRole(me.roles),
					roles: me.roles,
					avatarUrl: getAvatarUrl(me.nama),
				};

				localStorage.setItem('sigizi_user', JSON.stringify(profile));
				setUser(profile);
			} catch {
				// session invalid — clear stale localStorage if any
				localStorage.removeItem('sigizi_user');
				setUser(null);
			}
		};
		checkSession();
	}, []);

  const login = useCallback(async (payload: LoginPayload) => {
    await apiPost<AuthResponse>('/auth/login', {
      email: payload.email || undefined,
      nik: payload.nik || undefined,
      password: payload.password,
    });

    const me = await apiGet<{
      id_user: number;
      nama: string;
      roles: string[];
      email: string;
      nik: string;
    }>('/auth/me');

    const profile: UserProfile = {
      idUser: me.id_user,
      name: me.nama,
      email: me.email,
      nik: me.nik,
      role: mapRolesToFrontendRole(me.roles),
      roles: me.roles,
      avatarUrl: getAvatarUrl(me.nama),
    };

    localStorage.setItem('sigizi_user', JSON.stringify(profile));
    setUser(profile);
  }, []);

  const register = useCallback(async (data: RegisterFormData) => {
    await apiPost<null>('/auth/register', data);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiPost('/auth/logout');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        // session already expired, that's fine
      }
    }
    localStorage.removeItem('sigizi_user');
    setUser(null);
    // Reset global store on logout so next login fetches fresh data
    try {
      const { useAppStore } = await import('../store/useAppStore');
      useAppStore.setState({
        dashboardStats: null,
        distribusiGizi: [],
        trenStunting: [],
        stuntingPerWilayah: [],
        kehadiranBulanan: [],
        jadwalTerdekat: [],
        aktivitas: [],
        imunisasiPersen: 0,
        imunisasiList: [],
        rujukanList: [],
      });
    } catch {
      // ignore if store not yet initialized
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const me = await apiGet<{
        id_user: number;
        nama: string;
        roles: string[];
        email: string;
        nik: string;
      }>('/auth/me');

      const profile: UserProfile = {
        idUser: me.id_user,
        name: me.nama,
        email: me.email,
        nik: me.nik,
        role: mapRolesToFrontendRole(me.roles),
        roles: me.roles,
        avatarUrl: getAvatarUrl(me.nama),
      };

      localStorage.setItem('sigizi_user', JSON.stringify(profile));
      setUser(profile);
    } catch {
      // session invalid
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoggedIn: user !== null, loading, unreadCount, liveNotifications, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useNotifications must be used inside AuthProvider');
  return { liveNotifications: ctx.liveNotifications, unreadCount: ctx.unreadCount };
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
