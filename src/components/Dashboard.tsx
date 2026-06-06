import { useMemo } from 'react';
import { CheckCircle2, Clock, AlertCircle, XCircle, TrendingUp, DollarSign, Users, CalendarDays, Flame } from 'lucide-react';
import type { Task, Category } from '../types';
import { WEDDING_DATE, formatCurrency, TYPE_LABELS, TYPE_COLORS } from '../types';

interface Props {
  tasks: Task[];
  categories: Category[];
}

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  const colors: Record<string, string> = {
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
  };
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex items-start gap-4">
      <div className={`rounded-xl p-3 border ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-stone-500 text-xs font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-stone-800 mt-0.5">{value}</p>
        {sub && <p className="text-stone-400 text-xs mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  const bg: Record<string, string> = {
    rose: 'bg-rose-500', amber: 'bg-amber-500', violet: 'bg-violet-500',
    green: 'bg-emerald-500', blue: 'bg-blue-500',
  };
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-stone-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${bg[color] ?? 'bg-rose-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-stone-500 tabular-nums w-8 text-right">{pct}%</span>
    </div>
  );
}

const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export default function Dashboard({ tasks, categories }: Props) {
  const now = new Date();
  const daysLeft = Math.ceil((WEDDING_DATE.getTime() - now.getTime()) / 86400000);

  const stats = useMemo(() => {
    const active = tasks.filter(t => t.status !== 'cancelled');
    const completed = active.filter(t => t.status === 'completed');
    const inProgress = active.filter(t => t.status === 'in_progress');
    const totalBudget = active.reduce((s, t) => s + (t.estimated_cost ?? 0), 0);
    const spentSoFar = active.reduce((s, t) => s + (t.actual_cost ?? 0), 0);
    return { total: active.length, completed: completed.length, inProgress: inProgress.length, totalBudget, spentSoFar };
  }, [tasks]);

  const typeStats = useMemo(() => {
    return (['chung', 'nha_trai', 'nha_gai'] as const).map(type => {
      const catIds = categories.filter(c => c.type === type).map(c => c.id);
      const t = tasks.filter(t => t.category_id && catIds.includes(t.category_id) && t.status !== 'cancelled');
      const done = t.filter(x => x.status === 'completed').length;
      return { type, total: t.length, done };
    });
  }, [tasks, categories]);

  const upcoming = useMemo(() => {
    const cutoff = new Date(now.getTime() + 60 * 86400000);
    return tasks
      .filter(t => t.deadline && t.status !== 'completed' && t.status !== 'cancelled' && new Date(t.deadline) <= cutoff)
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
      .slice(0, 6);
  }, [tasks]);

  const critical = useMemo(() =>
    tasks
      .filter(t => t.status !== 'completed' && t.status !== 'cancelled')
      .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9))
      .slice(0, 5),
    [tasks]);

  const statusIcon = (s: string) => {
    if (s === 'completed') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
    if (s === 'in_progress') return <Clock className="w-3.5 h-3.5 text-blue-500" />;
    return <AlertCircle className="w-3.5 h-3.5 text-stone-400" />;
  };

  const priorityBadge = (p: string) => {
    const map: Record<string, string> = {
      critical: 'bg-red-100 text-red-700',
      high: 'bg-orange-100 text-orange-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-stone-100 text-stone-500',
    };
    const label: Record<string, string> = { critical: 'Quan trọng', high: 'Cao', medium: 'TB', low: 'Thấp' };
    return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${map[p]}`}>{label[p]}</span>;
  };

  const deadlineColor = (d: string) => {
    const diff = (new Date(d).getTime() - now.getTime()) / 86400000;
    if (diff < 7) return 'text-red-600 font-semibold';
    if (diff < 30) return 'text-amber-600';
    return 'text-stone-500';
  };

  const typeColor: Record<string, string> = { chung: 'rose', nha_trai: 'violet', nha_gai: 'amber' };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-600 via-rose-500 to-pink-500 p-6 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)' }} />
        <div className="relative">
          <p className="text-rose-200 text-sm font-medium mb-1">Đám cưới</p>
          <h2 className="text-3xl font-bold tracking-tight">Tiến Anh & Lan Anh</h2>
          <p className="text-rose-100 mt-1">Chủ nhật, 20 tháng 12 năm 2026 · Tháng 11 âm lịch</p>
          <div className="mt-4 flex flex-wrap gap-6">
            <div>
              <p className="text-4xl font-bold tabular-nums">{daysLeft}</p>
              <p className="text-rose-200 text-sm">ngày nữa</p>
            </div>
            <div className="border-l border-rose-400 pl-6">
              <p className="text-4xl font-bold tabular-nums">{Math.round((stats.completed / Math.max(1, stats.total)) * 100)}%</p>
              <p className="text-rose-200 text-sm">hoàn thành</p>
            </div>
            <div className="border-l border-rose-400 pl-6">
              <p className="text-4xl font-bold tabular-nums">{stats.inProgress}</p>
              <p className="text-rose-200 text-sm">đang thực hiện</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Tổng hạng mục" value={stats.total} sub={`${stats.completed} hoàn thành`} icon={CheckCircle2} color="rose" />
        <StatCard label="Đang thực hiện" value={stats.inProgress} sub="hạng mục" icon={Clock} color="blue" />
        <StatCard label="Tổng dự toán" value={formatCurrency(stats.totalBudget)} sub="VND" icon={DollarSign} color="green" />
        <StatCard label="Đã chi" value={formatCurrency(stats.spentSoFar)} sub={`${Math.round((stats.spentSoFar / Math.max(1, stats.totalBudget)) * 100)}% ngân sách`} icon={TrendingUp} color="amber" />
      </div>

      {/* Progress by type */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {typeStats.map(({ type, total, done }) => (
          <div key={type} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-stone-400" />
              <h3 className="font-semibold text-stone-700 text-sm">{TYPE_LABELS[type]}</h3>
              <span className="ml-auto text-xs text-stone-400">{done}/{total}</span>
            </div>
            <ProgressBar value={done} max={total} color={typeColor[type]} />
            <p className="text-xs text-stone-400 mt-2">{total - done} việc còn lại</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming deadlines */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-4 h-4 text-rose-500" />
            <h3 className="font-semibold text-stone-700">Deadline sắp tới (60 ngày)</h3>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-stone-400 text-sm text-center py-4">Không có deadline sắp tới</p>
          ) : (
            <div className="space-y-2.5">
              {upcoming.map(t => (
                <div key={t.id} className="flex items-center gap-3 py-2 border-b border-stone-50 last:border-0">
                  {statusIcon(t.status)}
                  <span className="flex-1 text-sm text-stone-700 truncate">{t.title}</span>
                  {priorityBadge(t.priority)}
                  <span className={`text-xs tabular-nums ${deadlineColor(t.deadline!)}`}>
                    {new Date(t.deadline!).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Critical tasks */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-4 h-4 text-orange-500" />
            <h3 className="font-semibold text-stone-700">Ưu tiên cao nhất</h3>
          </div>
          <div className="space-y-2.5">
            {critical.map(t => (
              <div key={t.id} className="flex items-start gap-3 py-2 border-b border-stone-50 last:border-0">
                {statusIcon(t.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-stone-700 truncate">{t.title}</p>
                  <p className="text-xs text-stone-400 truncate">{t.category?.name}</p>
                </div>
                {priorityBadge(t.priority)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Budget by category */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-4 h-4 text-emerald-500" />
          <h3 className="font-semibold text-stone-700">Chi phí theo danh mục</h3>
        </div>
        <div className="space-y-3">
          {categories.map(cat => {
            const catTasks = tasks.filter(t => t.category_id === cat.id && t.status !== 'cancelled');
            const est = catTasks.reduce((s, t) => s + t.estimated_cost, 0);
            const act = catTasks.reduce((s, t) => s + t.actual_cost, 0);
            if (est === 0 && act === 0) return null;
            const totalEst = tasks.reduce((s, t) => s + t.estimated_cost, 0);
            const pct = totalEst === 0 ? 0 : Math.round((est / totalEst) * 100);
            return (
              <div key={cat.id} className="flex items-center gap-4">
                <div className="w-36 text-xs text-stone-600 truncate font-medium" title={cat.name}>{cat.name}</div>
                <div className="flex-1">
                  <div className="bg-stone-100 rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full bg-rose-400" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="text-right text-xs text-stone-500 w-28 tabular-nums">
                  <span className="text-stone-700 font-medium">{formatCurrency(est)}</span>
                  {act > 0 && <span className="text-emerald-600"> / {formatCurrency(act)}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
