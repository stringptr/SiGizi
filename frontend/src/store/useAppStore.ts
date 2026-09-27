import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  DashboardStats, DistribusiGiziItem, TrenStuntingItem, StuntingWilayahItem,
} from '../types/api';
import type { JadwalImunisasi } from '../screens/jadwal-imunisasi/data/imunisasi.data';
import type { Rujukan } from '../screens/tindak-lanjut/components/RujukanAktif';

interface DashboardSlice {
  dashboardStats: DashboardStats | null;
  dashboardLoading: boolean;
  distribusiGizi: DistribusiGiziItem[];
  trenStunting: TrenStuntingItem[];
  stuntingPerWilayah: StuntingWilayahItem[];
  kehadiranBulanan: TrenStuntingItem[];
  jadwalTerdekat: Record<string, unknown>[];
  aktivitas: Record<string, unknown>[];
  imunisasiPersen: number;
  setDashboardStats: (s: DashboardStats) => void;
  setDashboardLoading: (v: boolean) => void;
  setDistribusiGizi: (d: DistribusiGiziItem[]) => void;
  setTrenStunting: (t: TrenStuntingItem[]) => void;
  setStuntingPerWilayah: (w: StuntingWilayahItem[]) => void;
  setKehadiranBulanan: (t: TrenStuntingItem[]) => void;
  setJadwalTerdekat: (j: Record<string, unknown>[]) => void;
  setAktivitas: (a: Record<string, unknown>[]) => void;
  setImunisasiPersen: (n: number) => void;
}

interface ImunisasiSlice {
  imunisasiList: JadwalImunisasi[];
  imunisasiLoading: boolean;
  setImunisasiList: (list: JadwalImunisasi[]) => void;
  setImunisasiLoading: (v: boolean) => void;
}

interface TindakLanjutSlice {
  rujukanList: Rujukan[];
  rujukanLoading: boolean;
  setRujukanList: (list: Rujukan[]) => void;
  setRujukanLoading: (v: boolean) => void;
}

interface GlobalSlice {
  appInitialized: boolean;
}

type AppStore = DashboardSlice & ImunisasiSlice & TindakLanjutSlice & GlobalSlice;

type PersistedState = Omit<
  AppStore,
  | 'dashboardStats'
  | 'dashboardLoading'
  | 'distribusiGizi'
  | 'trenStunting'
  | 'stuntingPerWilayah'
  | 'kehadiranBulanan'
  | 'jadwalTerdekat'
  | 'aktivitas'
  | 'imunisasiPersen'
  | 'imunisasiLoading'
  | 'rujukanLoading'
>;

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      // ── Dashboard ──
      dashboardStats: null,
      dashboardLoading: false,
      distribusiGizi: [],
      trenStunting: [],
      stuntingPerWilayah: [],
      kehadiranBulanan: [],
      jadwalTerdekat: [],
      aktivitas: [],
      imunisasiPersen: 0,
      setDashboardStats: (s) => set({ dashboardStats: s }),
      setDashboardLoading: (v) => set({ dashboardLoading: v }),
      setDistribusiGizi: (d) => set({ distribusiGizi: d }),
      setTrenStunting: (t) => set({ trenStunting: t }),
      setStuntingPerWilayah: (w) => set({ stuntingPerWilayah: w }),
      setKehadiranBulanan: (t) => set({ kehadiranBulanan: t }),
      setJadwalTerdekat: (j) => set({ jadwalTerdekat: j }),
      setAktivitas: (a) => set({ aktivitas: a }),
      setImunisasiPersen: (n) => set({ imunisasiPersen: n }),

      // ── Imunisasi ──
      imunisasiList: [],
      imunisasiLoading: false,
      setImunisasiList: (list) => set({ imunisasiList: list }),
      setImunisasiLoading: (v) => set({ imunisasiLoading: v }),

      // ── Tindak Lanjut ──
      rujukanList: [],
      rujukanLoading: false,
      setRujukanList: (list) => set({ rujukanList: list }),
      setRujukanLoading: (v) => set({ rujukanLoading: v }),

      // ── Global Init ──
      appInitialized: false,
    }),
    {
      name: 'sigizi-store-v2',
      partialize: (state): PersistedState => {
        const {
          dashboardStats,
          dashboardLoading,
          distribusiGizi,
          trenStunting,
          stuntingPerWilayah,
          kehadiranBulanan,
          jadwalTerdekat,
          aktivitas,
          imunisasiPersen,
          imunisasiLoading,
          rujukanLoading,
          ...persisted
        } = state;
        return persisted;
      },
    }
  )
);
