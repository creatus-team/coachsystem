'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    CalendarDays,
    Users,
    CreditCard,
    Settings,
    LogOut,
} from 'lucide-react';

const menuItems = [
    {
        title: '대시보드',
        href: '/',
        icon: LayoutDashboard,
    },
    {
        title: '예약 관리',
        href: '/reservations',
        icon: CalendarDays,
    },
    {
        title: '고객 관리',
        href: '/clients',
        icon: Users,
    },
    {
        title: '정산 관리',
        href: '/settlements',
        icon: CreditCard,
    },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-full w-64 flex-col border-r bg-white">
            <div className="flex h-16 items-center border-b px-6">
                <span className="text-xl font-bold text-primary">Coaching Admin</span>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1 px-2">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-gray-700 hover:bg-gray-100'
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.title}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            <div className="border-t p-4">
                <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                    <LogOut className="h-5 w-5" />
                    로그아웃
                </button>
            </div>
        </div>
    );
}
