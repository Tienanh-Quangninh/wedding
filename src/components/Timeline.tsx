import { useMemo } from 'react';
import { CheckCircle2, Clock, Circle, XCircle } from 'lucide-react';
import type { Task, Category } from '../types';
import { WEDDING_DATE, TYPE_LABELS } from '../types';

interface Props {
  tasks: Task[];
  categories: Category[];
}

interface Milestone {
  date: Date;
  label: string;
  type: 'wedding' | 'month';
}

const STATUS_DOT: Record<string, { icon: React.ElementType; cls: string }> = {
  completed: { icon: CheckCircle2, cls: 'text-emerald-500' },
  in_progress: { icon: Clock, cls: 'text-blue-500' },
  pending: { icon: Circle, cls: 'text-stone-300' },
  cancelled: { icon: XCircle, cls: 'text-stone-200' },
};

const TYPE_BG: Record<string, string> = {
  chung: 'bg-rose-50 border-rose-200 text-rose-700',
  nha_trai: 'bg-violet-50 border-violet-200 text-violet-700',
  nha_gai: 'bg-amber-50 border-amber-200 text-amber-700',
};

const TYPE_PILL: Record<string, string> = {
  chung: 'bg-rose-100 text-rose-700',
  nha_trai: 'bg-violet-100 text-violet-700',
  nha_gai: 'bg-amber-100 text-amber-700',
};

export default function Timeline({ tasks, categories }: Props) {
  const now = new Date();

  const grouped = useMemo(() => {
    const withDeadline = tasks.filter(t => t.deadline && t.status !== 'cancelled');

    const byMonth = new Map<string, Task[]>();
    for (const t of withDeadline) {
      const d = new Date(t.deadline!);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth.has(key)) byMonth.set(key, []);
      byMonth.get(key)!.push(t);
    }

    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, items]) => {
        const [y, m] = key.split('-').map(Number);
        const date = new Date(y, m - 1, 1);
        const monthName = date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
        const isPast = date < new Date(now.getFullYear(), now.getMonth(), 1);
        const isCurrent = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
        return { key, monthName, date, isPast, isCurrent, items: items.sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime()) };
      });
  }, [tasks]);

  const catMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  const totalTasks = tasks.filter(t => t.status !== 'cancelled').length;
  const doneTasks = tasks.filter(t => t.status === 'completed').length;
  const progressPct = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="font-bold text-stone-800 text-lg">Timeline kế hoạch cưới</h2>
            <p className="text-stone-400 text-sm">Từ hiện tại đến ngày cưới 20/12/2026</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {(['chung', 'nha_trai', 'nha_gai'] as const).map(type => (
              <span key={type} className={`px-2.5 py-1 rounded-full text-xs font-medium border ${TYPE_BG[type]}`}>
                {TYPE_LABELS[type]}
              </span>
            ))}
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-stone-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-pink-400 rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-rose-600 tabular-nums">{progressPct}%</span>
          <span className="text-xs text-stone-400">{doneTasks}/{totalTasks} việc</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[140px] top-0 bottom-0 w-px bg-stone-200 hidden md:block" />

        <div className="space-y-8">
          {grouped.map(({ key, monthName, isPast, isCurrent, items }) => (
            <div key={key} className="md:flex md:gap-0">
              {/* Month label */}
              <div className="md:w-[140px] md:pr-6 md:text-right mb-3 md:mb-0 flex md:flex-col items-center md:items-end gap-2">
                <div className={`flex-shrink-0 w-3 h-3 rounded-full border-2 relative z-10 md:mr-[-6.5px] md:mt-1 hidden md:block ${
                  isCurrent ? 'bg-rose-500 border-rose-500' : isPast ? 'bg-emerald-400 border-emerald-400' : 'bg-white border-stone-300'
                }`} />
                <span className={`text-sm font-semibold ${isCurrent ? 'text-rose-600' : isPast ? 'text-stone-400' : 'text-stone-700'}`}>
                  {monthName.replace(' năm', '\n').split('\n')[0]}
                </span>
                <span className={`text-xs ${isCurrent ? 'text-rose-400' : 'text-stone-400'}`}>
                  {monthName.includes('năm') ? monthName.split('năm')[1]?.trim() ?? '' : ''}
                </span>
                {isCurrent && <span className="text-[10px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full font-medium">Hiện tại</span>}
              </div>

              {/* Tasks */}
              <div className="md:flex-1 md:pl-8 space-y-2">
                {items.map(t => {
                  const cat = t.category_id ? catMap.get(t.category_id) : undefined;
                  const type = cat?.type ?? 'chung';
                  const { icon: StatusIcon, cls } = STATUS_DOT[t.status] ?? STATUS_DOT.pending;
                  const deadline = new Date(t.deadline!);
                  const daysFromNow = Math.ceil((deadline.getTime() - now.getTime()) / 86400000);

                  return (
                    <div
                      key={t.id}
                      className={`bg-white rounded-xl border shadow-sm p-3.5 flex items-start gap-3 hover:shadow-md transition-shadow ${
                        isPast && t.status !== 'completed' ? 'border-red-200 bg-red-50/30' : 'border-stone-100'
                      }`}
                    >
                      <StatusIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cls}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className={`text-sm font-medium ${t.status === 'completed' ? 'line-through text-stone-400' : 'text-stone-700'}`}>
                            {t.title}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {cat && (
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${TYPE_PILL[type]}`}>
                              {cat.name}
                            </span>
                          )}
                          {t.assignee && (
                            <span className="text-[10px] text-stone-400">· {t.assignee}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-xs tabular-nums font-medium ${
                          isPast && t.status !== 'completed' ? 'text-red-600' :
                          daysFromNow <= 7 ? 'text-orange-600' :
                          daysFromNow <= 30 ? 'text-amber-600' : 'text-stone-400'
                        }`}>
                          {deadline.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </p>
                        {t.estimated_cost > 0 && (
                          <p className="text-[10px] text-stone-400 mt-0.5">
                            {new Intl.NumberFormat('vi-VN').format(t.estimated_cost)}đ
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Wedding day milestone */}
          <div className="md:flex md:gap-0">
            <div className="md:w-[140px] md:pr-6 md:text-right mb-3 md:mb-0 flex md:flex-col items-center md:items-end gap-2">
              <div className="flex-shrink-0 w-4 h-4 rounded-full bg-rose-500 border-4 border-rose-200 relative z-10 md:mr-[-8px] hidden md:block" />
              <span className="text-sm font-bold text-rose-600">Tháng 12</span>
              <span className="text-xs text-rose-400">2026</span>
            </div>
            <div className="md:flex-1 md:pl-8">
              <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-xl p-4 text-white shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">💍</div>
                  <div>
                    <p className="font-bold text-lg">Ngày cưới!</p>
                    <p className="text-rose-100 text-sm">20/12/2026 · Tiến Anh & Lan Anh</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
