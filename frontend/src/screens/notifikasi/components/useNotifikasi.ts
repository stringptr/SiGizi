import { useState, useEffect, useRef } from 'react';
import { apiGet, apiPatch } from '../../../lib/api';
import { useAuth, useNotifications } from '../../../context/AuthContext';
import type { NotifGroup, NotifItem, NotifCategory } from './types';

export interface BackendNotifikasi {
  id_notifikasi: number;
  judul: string;
  pesan: string | null;
  tipe_notifikasi: string;
  status_baca: boolean;
  tanggal_kirim: string;
}

interface NotifikasiResponse {
  notifikasi: BackendNotifikasi[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

function mapActionUrl(tipe: string, role?: string): string | undefined {
  switch (tipe) {
    case 'Pemeriksaan': return `/monitoring`;
    case 'Imunisasi':   return `/jadwal-imunisasi`;
    case 'Rujukan':     return `/tindak-lanjut`;
    // Notifikasi artikel (diajukan/direview) — Bidan ke halaman manajemennya,
    // selain itu ke katalog publik (halaman /edukasi sudah dihapus).
    case 'Edukasi':     return role === 'Bidan' ? `/bidan/artikel` : `/artikel`;
    default:            return undefined;
  }
}

function mapCategory(tipe: string): NotifCategory {
  switch (tipe) {
    case 'Pemeriksaan': return 'info';
    case 'Imunisasi': return 'schedule';
    case 'Rujukan': return 'urgent';
    case 'Edukasi': return 'success';
    case 'Pengingat': return 'schedule';
    default: return 'info';
  }
}

function mapTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const hours = Math.floor(diff / 3600000);

  if (hours < 24) return `${hours} jam yang lalu`;
  if (hours < 48) return 'Kemarin';
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
}

export function useNotifikasi() {
  const [notifikasi, setNotifikasi] = useState<BackendNotifikasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ current_page: 1, per_page: 15, total: 0, last_page: 1 });
  const { liveNotifications } = useNotifications();
  const { user } = useAuth();

  const fetchNotifikasi = async (page = 1) => {
    setLoading(true);
    try {
      const res = await apiGet<NotifikasiResponse>(`/notifikasi?page=${page}&per_page=15`);
      setNotifikasi(res.notifikasi);
      setMeta(res.meta);
    } catch (err) {
      console.error('Gagal memuat notifikasi:', err);
      setNotifikasi([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifikasi();
  }, []);

  const prevLiveLength = useRef(0);
  useEffect(() => {
    if (liveNotifications.length > prevLiveLength.current) {
      const newOnes = liveNotifications.slice(prevLiveLength.current);
      setNotifikasi((prev) => {
        const existingIds = new Set(prev.map((n) => n.id_notifikasi));
        const toAdd: BackendNotifikasi[] = [];
        for (const n of newOnes) {
          if (!existingIds.has(n.id)) {
            toAdd.push({
              id_notifikasi: n.id,
              judul: n.judul,
              pesan: n.pesan,
              tipe_notifikasi: n.tipe,
              status_baca: false,
              tanggal_kirim: n.created_at,
            });
          }
        }
        if (toAdd.length > 0) {
          setMeta((m) => ({ ...m, total: m.total + toAdd.length }));
          return [...toAdd, ...prev];
        }
        return prev;
      });
    }
    prevLiveLength.current = liveNotifications.length;
  }, [liveNotifications]);

  const markRead = async (id: number) => {
    try {
      await apiPatch(`/notifikasi/${id}/read`);
      setNotifikasi((prev) =>
        prev.map((n) => (n.id_notifikasi === id ? { ...n, status_baca: true } : n)),
      );
    } catch (err) {
      console.error('Gagal mark read:', err);
    }
  };

  const handleCardMarkRead = (cardId: string) => {
    const idNum = parseInt(cardId.replace('n-', ''), 10);
    if (!isNaN(idNum)) {
      setNotifikasi((prev) =>
        prev.map((n) => (n.id_notifikasi === idNum ? { ...n, status_baca: true } : n)),
      );
    }
  };

  const markAllRead = async () => {
    try {
      await apiPatch('/notifikasi/read-all');
      setNotifikasi((prev) => prev.map((n) => ({ ...n, status_baca: true })));
    } catch (err) {
      console.error('Gagal mark all read:', err);
    }
  };

  const toNotifItems = (list: BackendNotifikasi[]): NotifItem[] =>
    list.map((n) => ({
      id: `n-${n.id_notifikasi}`,
      title: n.judul,
      description: n.pesan || '',
      time: mapTime(n.tanggal_kirim),
      category: mapCategory(n.tipe_notifikasi),
      actionUrl: mapActionUrl(n.tipe_notifikasi, user?.role),
      tags: [
        { label: n.tipe_notifikasi, color: '#4b5563', bg: '#f1f5f9' },
        ...(n.status_baca ? [] : [{ label: 'Baru', color: '#3b82f6', bg: '#eff6ff' }]),
      ],
      read: n.status_baca,
    }));

  const toNotifGroups = (list: BackendNotifikasi[]): NotifGroup[] => {
    if (list.length === 0) return [];

    const today = new Date();
    const todayStr = today.toDateString();
    const yesterdayStr = new Date(today.getTime() - 86400000).toDateString();

    const todayItems = list.filter((n) => new Date(n.tanggal_kirim).toDateString() === todayStr);
    const yesterdayItems = list.filter((n) => new Date(n.tanggal_kirim).toDateString() === yesterdayStr);
    const earlierItems = list.filter(
      (n) =>
        new Date(n.tanggal_kirim).toDateString() !== todayStr &&
        new Date(n.tanggal_kirim).toDateString() !== yesterdayStr,
    );

    const groups: NotifGroup[] = [];
    if (todayItems.length > 0) groups.push({ groupLabel: 'Hari Ini', items: toNotifItems(todayItems) });
    if (yesterdayItems.length > 0) groups.push({ groupLabel: 'Kemarin', items: toNotifItems(yesterdayItems) });
    if (earlierItems.length > 0) groups.push({ groupLabel: 'Sebelumnya', items: toNotifItems(earlierItems) });

    return groups;
  };

  return {
    notifikasi,
    loading,
    meta,
    fetchNotifikasi,
    markRead,
    markAllRead,
    handleCardMarkRead,
    toNotifItems,
    toNotifGroups,
  };
}
