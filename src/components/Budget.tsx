import { useMemo } from 'react';
import { TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';
import type { Task, Category } from '../types';
import { formatCurrencyFull, TYPE_LABELS } from '../types';

interface Props {
  tasks: Task[];
  categories: Category[];
}

function Ring({ pct, size = 80, stroke = 8, color = '#e11d48' }: { pct: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.7s ease' }}
      />
    </svg>
  );
}

const TYPE_COLORS_HEX: Record<string, string> = {
  chung: '#e11d48',
  nha_trai: '#7c3aed',
  nha_gai: '#f59e0b',
};

export default function Budget({ tasks, categories }: Props) {
  const activeTasks = tasks.filter(t => t.status !== 'cancelled');

  const totalEst = activeTasks.reduce((s, t) => s + t.estimated_cost, 0);
  const totalAct = activeTasks.reduce((s, t) => s + t.actual_cost, 0);
  const spentPct = totalEst === 0 ? 0 : Math.round((totalAct / totalEst) * 100);
  const remaining = totalEst - totalAct;

  const byCategory = useMemo(() => {
    return categories.map(cat => {
      const catTasks = activeTasks.filter(t => t.category_id === cat.id);
      const est = catTasks.reduce((s, t) => s + t.estimated_cost, 0);
      const act = catTasks.reduce((s, t) => s + t.actual_cost, 0);
      return { cat, tasks: catTasks, est, act };
    }).filter(x => x.est > 0 || x.act > 0);
  }, [tasks, categories]);

  const byType = useMemo(() => {
    return (['chung', 'nha_trai', 'nha_gai'] as const).map(type => {
      const catIds = categories.filter(c => c.type === type).map(c => c.id);
      const typeTasks = activeTasks.filter(t => t.category_id && catIds.includes(t.category_id));
      const est = typeTasks.reduce((s, t) => s + t.estimated_cost, 0);
      const act = typeTasks.reduce((s, t) => s + t.actual_cost, 0);
      return { type, est, act };
    });
  }, [tasks, categories]);

  const overBudget = activeTasks.filter(t => t.actual_cost > t.estimated_cost && t.estimated_cost > 0);

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex items-center gap-5">
          <div className="relative">
            <Ring pct={spentPct} size={80} stroke={8} color="#e11d48" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-stone-700">{spentPct}%</span>
            </div>
          </div>
          <div>
            <p className="text-stone-400 text-xs uppercase tracking-wide mb-1">Tổng ngân sách</p>
            <p className="text-xl font-bold text-stone-800">{formatCurrencyFull(totalEst)}</p>
            <p className="text-xs text-stone-400 mt-1">Đã chi: <span className="text-rose-600 font-medium">{formatCurrencyFull(totalAct)}</span></p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <p className="text-stone-500 text-xs uppercase tracking-wide">Đã chi tiêu</p>
          </div>
          <p className="text-xl font-bold text-emerald-600">{formatCurrencyFull(totalAct)}</p>
          <div className="mt-3 bg-stone-100 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, spentPct)}%` }} />
          </div>
          <p className="text-xs text-stone-400 mt-1.5">{spentPct}% ngân sách đã dùng</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-blue-500" />
            <p className="text-stone-500 text-xs uppercase tracking-wide">Còn lại cần chi</p>
          </div>
          <p className={`text-xl font-bold ${remaining < 0 ? 'text-red-600' : 'text-blue-600'}`}>
            {formatCurrencyFull(Math.abs(remaining))}
          </p>
          <p className="text-xs text-stone-400 mt-1">
            {remaining < 0 ? 'Vượt ngân sách dự kiến' : 'Trong ngân sách còn lại'}
          </p>
        </div>
      </div>

      {/* By type */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {byType.map(({ type, est, act }) => {
          const pct = est === 0 ? 0 : Math.round((act / est) * 100);
          return (
            <div key={type} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-stone-700">{TYPE_LABELS[type]}</h3>
                <div className="relative w-10 h-10">
                  <Ring pct={pct} size={40} stroke={5} color={TYPE_COLORS_HEX[type]} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-stone-600">{pct}%</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-stone-500">Dự toán: <span className="text-stone-700 font-medium">{formatCurrencyFull(est)}</span></p>
              <p className="text-xs text-stone-500 mt-0.5">Đã chi: <span className="font-medium" style={{ color: TYPE_COLORS_HEX[type] }}>{formatCurrencyFull(act)}</span></p>
            </div>
          );
        })}
      </div>

      {/* Over budget warning */}
      {overBudget.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h3 className="text-sm font-semibold text-red-700">Hạng mục vượt ngân sách ({overBudget.length})</h3>
          </div>
          <div className="space-y-2">
            {overBudget.map(t => (
              <div key={t.id} className="flex items-center gap-3 text-xs">
                <span className="flex-1 text-red-700 font-medium">{t.title}</span>
                <span className="text-stone-500">DT: {formatCurrencyFull(t.estimated_cost)}</span>
                <span className="text-red-600 font-semibold">TT: {formatCurrencyFull(t.actual_cost)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed table */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="bg-stone-800 px-5 py-3">
          <h3 className="text-white font-semibold text-sm">Chi tiết theo danh mục</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Danh mục / Hạng mục</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Dự toán</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Thực tế</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">% Chi</th>
              </tr>
            </thead>
            <tbody>
              {byCategory.map(({ cat, tasks: catTasks, est, act }) => {
                const pct = est === 0 ? 0 : Math.round((act / est) * 100);
                return [
                  <tr key={`cat-${cat.id}`} className="bg-stone-50 border-b border-stone-100">
                    <td className="px-5 py-2.5 font-semibold text-stone-700 text-xs uppercase tracking-wide">{cat.name}</td>
                    <td className="px-4 py-2.5 text-right text-xs font-semibold text-stone-600 tabular-nums">{formatCurrencyFull(est)}</td>
                    <td className="px-4 py-2.5 text-right text-xs font-semibold text-rose-600 tabular-nums">{formatCurrencyFull(act)}</td>
                    <td className="px-5 py-2.5 text-right">
                      <span className={`text-xs font-semibold ${pct > 100 ? 'text-red-600' : pct > 75 ? 'text-amber-600' : 'text-stone-500'}`}>{pct}%</span>
                    </td>
                  </tr>,
                  ...catTasks.map(t => (
                    <tr key={t.id} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
                      <td className="px-5 py-2 pl-8 text-stone-600 text-xs">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${t.status === 'completed' ? 'bg-emerald-500' : t.status === 'in_progress' ? 'bg-blue-500' : 'bg-stone-300'}`} />
                          {t.title}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right text-xs text-stone-500 tabular-nums">
                        {t.estimated_cost > 0 ? formatCurrencyFull(t.estimated_cost) : <span className="text-stone-300">—</span>}
                      </td>
                      <td className="px-4 py-2 text-right text-xs tabular-nums">
                        {t.actual_cost > 0 ? (
                          <span className={t.actual_cost > t.estimated_cost && t.estimated_cost > 0 ? 'text-red-600 font-semibold' : 'text-emerald-600'}>
                            {formatCurrencyFull(t.actual_cost)}
                          </span>
                        ) : <span className="text-stone-300">—</span>}
                      </td>
                      <td className="px-5 py-2 text-right">
                        {t.estimated_cost > 0 && t.actual_cost > 0 && (
                          <span className={`text-xs ${t.actual_cost > t.estimated_cost ? 'text-red-500' : 'text-stone-400'}`}>
                            {Math.round((t.actual_cost / t.estimated_cost) * 100)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ];
              })}
              <tr className="bg-rose-50 border-t-2 border-rose-200">
                <td className="px-5 py-3 font-bold text-rose-800 text-sm">TONG CONG</td>
                <td className="px-4 py-3 text-right font-bold text-rose-800 tabular-nums text-sm">{formatCurrencyFull(totalEst)}</td>
                <td className="px-4 py-3 text-right font-bold text-rose-600 tabular-nums text-sm">{formatCurrencyFull(totalAct)}</td>
                <td className="px-5 py-3 text-right font-bold text-rose-700 text-sm">{spentPct}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
