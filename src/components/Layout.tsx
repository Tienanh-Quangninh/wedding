import { useState, useEffect } from 'react';
import { Heart, LayoutDashboard, Calendar, CheckSquare, DollarSign, ListTodo, Menu, X } from 'lucide-react';
import { WEDDING_DATE } from '../types';

type Tab = 'dashboard' | 'timeline' | 'tasks' | 'budget' | 'checklist';

interface LayoutProps {
  activeTab: Tab;
  setActiveTab: (t: Tab) => void;
  children: React.ReactNode;
}

function Countdown() {
  const [diff, setDiff] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calc = () => {
      const now = Date.now();
      const total = Math.max(0, WEDDING_DATE.getTime() - now);
      const days = Math.floor(total / 86400000);
      const hours = Math.floor((total % 86400000) / 3600000);
      const minutes = Math.floor((total % 3600000) / 60000);
      const seconds = Math.floor((total % 60000) / 1000);
      setDiff({ days, hours, minutes, seconds });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hidden sm:flex items-center gap-3 text-rose-100">
      {[
        { v: diff.days, l: 'ngày' },
        { v: diff.hours, l: 'giờ' },
        { v: diff.minutes, l: 'phút' },
        { v: diff.seconds, l: 'giây' },
      ].map(({ v, l }) => (
        <div key={l} className="text-center">
          <div className="text-xl font-bold text-white leading-none tabular-nums">{String(v).padStart(2, '0')}</div>
          <div className="text-xs text-rose-200 mt-0.5">{l}</div>
        </div>
      ))}
    </div>
  );
}

const NAV_ITEMS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'timeline', label: 'Timeline', icon: Calendar },
  { id: 'tasks', label: 'Kế hoạch', icon: ListTodo },
  { id: 'budget', label: 'Chi phí', icon: DollarSign },
  { id: 'checklist', label: 'Checklist', icon: CheckSquare },
];

export default function Layout({ activeTab, setActiveTab, children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-rose-700 via-rose-600 to-pink-600 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-1.5">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight tracking-wide">Tiến Anh & Lan Anh</h1>
              <p className="text-rose-200 text-xs">20 tháng 12, 2026 · Lễ cưới</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Countdown />
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="md:hidden text-white p-1"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Nav */}
      <nav className="bg-white border-b border-stone-200 shadow-sm sticky top-[62px] z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className={`${mobileOpen ? 'flex flex-col py-2' : 'hidden'} md:flex md:flex-row gap-1`}>
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setActiveTab(id); setMobileOpen(false); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  activeTab === id
                    ? 'bg-rose-50 text-rose-700 border-b-2 border-rose-600 md:rounded-none md:rounded-t-lg'
                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      <footer className="text-center py-4 text-stone-400 text-xs border-t border-stone-100">
        Tiến Anh & Lan Anh · Đám cưới tháng 11 âm lịch 2026 · Với tất cả tình yêu
      </footer>
    </div>
  );
}
