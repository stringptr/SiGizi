import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    BarChart3,
    ClipboardList,
    BookOpen,
    Users,
    Bell,
    Plus,
    ChevronLeft,
    ChevronRight,
    Syringe,
    FileText,
    ClipboardCheck,
} from 'lucide-react';
import type { Role } from '../App';
import { useAuth } from '../context/AuthContext';

interface NavItem {
    path: string;
    label: string;
    icon: React.ReactNode;
}

interface SidebarProps {
    currentRole: Role;
    onLoginClick?: () => void;
}

const NAV_ITEMS: NavItem[] = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/monitoring', label: 'Monitoring', icon: <BarChart3 size={20} /> },
    { path: '/jadwal-imunisasi', label: 'Jadwal Imunisasi', icon: <Syringe size={20} /> },
    { path: '/tindak-lanjut', label: 'Tindak Lanjut & Rujukan', icon: <ClipboardList size={20} /> },
    { path: '/artikel', label: 'Artikel', icon: <BookOpen size={20} /> },
    { path: '/bidan/artikel', label: 'Artikel Saya', icon: <FileText size={20} /> },
    { path: '/dinkes/review-artikel', label: 'Review Artikel', icon: <ClipboardCheck size={20} /> },
    { path: '/user-management', label: 'User Management', icon: <Users size={20} /> },
    { path: '/notifikasi', label: 'Notifikasi', icon: <Bell size={20} /> },
];

/** Halaman publik — bisa diakses tanpa login. */
const PUBLIC_PATHS = ['/', '/artikel'];

const getFilteredNavItems = (role: Role) => {
    return NAV_ITEMS.filter((item) => {
        if (role === 'Ibu/Wali') {
            return ['/', '/monitoring', '/jadwal-imunisasi', '/artikel', '/notifikasi'].includes(item.path);
        }
        if (role === 'Dinas Kesehatan') {
            return ['/', '/monitoring', '/artikel', '/dinkes/review-artikel', '/user-management', '/notifikasi'].includes(item.path);
        }
        if (role === 'Kader Posyandu') {
            return ['/', '/monitoring', '/jadwal-imunisasi', '/artikel', '/notifikasi'].includes(item.path);
        }
        // Bidan: semua kecuali user-management & halaman review Dinkes
        return item.path !== '/user-management' && item.path !== '/dinkes/review-artikel';
    });
};

export function Sidebar({ currentRole, onLoginClick }: SidebarProps): JSX.Element {
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
    const { isLoggedIn, user } = useAuth();

    // Logged-in -> filtered by role. Guest -> only public pages
    const filteredItems = isLoggedIn && user ? getFilteredNavItems(user.role) : NAV_ITEMS.filter(item => PUBLIC_PATHS.includes(item.path));

    return (
        <aside className={`flex flex-col h-screen bg-white border-r border-neutral-100 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
            {/* Logo */}
            <div className="p-6 flex items-center gap-3">
                <div className="w-12 h-12 flex-shrink-0">
                    <img src="/logo-sigizi.svg" alt="SiGizi" className="w-full h-full object-contain" />
                </div>
                {!isCollapsed && (
                    <div className="flex flex-col">
                        <span className="text-lg font-bold text-primary leading-tight font-headline">SiGizi</span>
                        <span className="text-xs text-primary-600 font-medium font-body">JAWA TENGAH</span>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
                {filteredItems.map((item: NavItem) => {
                    // Sub-route (mis. /artikel/12) tetap menyorot item induknya
                    const isActive: boolean = location.pathname === item.path
                        || location.pathname.startsWith(`${item.path}/`);
                    // Public pages need no login; everything else does
                    const isLocked = !isLoggedIn && !PUBLIC_PATHS.includes(item.path);

                    if (isLocked) {
                        return (
                            <button
                                key={item.path}
                                onClick={onLoginClick}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-body text-sm text-neutral-400 hover:bg-neutral-50 hover:text-neutral-500 ${isCollapsed ? 'justify-center' : ''}`}
                            >
                                <span className="flex-shrink-0 text-neutral-300">{item.icon}</span>
                                {!isCollapsed && <span>{item.label}</span>}
                            </button>
                        );
                    }

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-body text-sm
                ${isActive ? 'bg-primary-50 text-primary font-semibold' : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800'}
                ${isCollapsed ? 'justify-center' : ''}
              `}
                        >
                            <span className={`flex-shrink-0 ${isActive ? 'text-primary' : 'text-neutral-400'}`}>
                                {item.icon}
                            </span>
                            {!isCollapsed && <span>{item.label}</span>}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 space-y-3">
                {/* Logged-in: tambah data baru (hanya Bidan & Kader di halaman tindak-lanjut) */}
                {isLoggedIn && currentRole !== 'Ibu/Wali' && currentRole !== 'Dinas Kesehatan' && location.pathname === '/tindak-lanjut' && (
                    <button className={`w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-600 text-white rounded-xl py-3 px-4 transition-colors font-body text-sm font-medium ${isCollapsed ? 'px-2' : ''}`}>
                        <Plus size={18} />
                        {!isCollapsed && <span>Tambah Data Baru</span>}
                    </button>
                )}

                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="w-full flex items-center justify-center p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 rounded-lg transition-colors"
                >
                    {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>
        </aside>
    );
}