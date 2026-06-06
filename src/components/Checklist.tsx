import { useState, useMemo } from 'react';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Pencil, Trash2, Plus } from 'lucide-react';
import type { Task, Category, ChecklistItem } from '../types';
import { TYPE_LABELS } from '../types';

interface Props {
  tasks: Task[];
  categories: Category[];
  onToggleChecklist: (item: ChecklistItem) => Promise<unknown>;
}

const TYPE_HEADER: Record<string, string> = {
  chung: 'from-rose-600 to-rose-500',
  nha_trai: 'from-violet-600 to-violet-500',
  nha_gai: 'from-amber-600 to-amber-500',
};

const TYPE_ACCENT: Record<string, string> = {
  chung: 'bg-rose-500',
  nha_trai: 'bg-violet-500',
  nha_gai: 'bg-amber-500',
};

function TaskChecklist({ task, type, onToggle, onEdit, onDelete }: {
  task: Task;
  type: string;
  onToggle: (item: ChecklistItem) => Promise<unknown>;
  onEdit: (item: ChecklistItem, newTitle: string) => Promise<unknown>;
  onDelete: (item: ChecklistItem) => Promise<unknown>;
}) {
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const checklist = task.checklist ?? [];
  if (checklist.length === 0) return null;
  const done = checklist.filter(c => c.is_completed).length;
  const pct = checklist.length === 0 ? 0 : Math.round((done / checklist.length) * 100);

  const handleToggle = async (item: ChecklistItem) => {
    setLoading(item.id);
    await onToggle(item);
    setLoading(null);
  };

  const startEdit = (item: ChecklistItem) => {
    setEditing(item.id);
    setEditValue(item.title);
  };

  const saveEdit = async (item: ChecklistItem) => {
    if (editValue.trim() && editValue !== item.title) {
      setLoading(item.id);
      await onEdit(item, editValue.trim());
      setLoading(null);
    }
    setEditing(null);
  };

  const handleDelete = async (item: ChecklistItem) => {
    setLoading(item.id);
    await onDelete(item);
    setLoading(null);
  };

  return (
    <div className="bg-white rounded-xl border border-stone-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors"
      >
        <div className={`w-1 h-8 rounded-full ${TYPE_ACCENT[type] ?? 'bg-stone-400'}`} />
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-stone-700">{task.title}</p>
          <p className="text-xs text-stone-400 mt-0.5">{done}/{checklist.length} mục · {pct}% hoàn thành</p>
        </div>
        {/* Mini progress */}
        <div className="w-24 bg-stone-100 rounded-full h-1.5 overflow-hidden">
          <div className={`h-full rounded-full ${TYPE_ACCENT[type] ?? 'bg-rose-500'}`} style={{ width: `${pct}%` }} />
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-stone-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-stone-400 flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-1">
          {checklist.map(item => (
            <div key={item.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-stone-50 group">
              <button
                onClick={() => handleToggle(item)}
                disabled={loading === item.id}
                className="flex-shrink-0"
              >
                {item.is_completed
                  ? <CheckCircle2 className={`w-4 h-4 text-emerald-500 ${loading === item.id ? 'animate-spin' : ''}`} />
                  : <Circle className={`w-4 h-4 text-stone-300 hover:text-stone-400 ${loading === item.id ? 'animate-spin' : ''}`} />
                }
              </button>

              {editing === item.id ? (
                <input
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onBlur={() => saveEdit(item)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') saveEdit(item);
                    if (e.key === 'Escape') setEditing(null);
                  }}
                  autoFocus
                  className="flex-1 text-xs border border-rose-300 rounded px-2 py-0.5 outline-none"
                />
              ) : (
                <span
                  className={`flex-1 text-sm cursor-pointer ${item.is_completed ? 'line-through text-stone-400' : 'text-stone-600'}`}
                  onDoubleClick={() => startEdit(item)}
                >
                  {item.title}
                </span>
              )}

              <button
                onClick={() => startEdit(item)}
                className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-blue-600 transition-all"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleDelete(item)}
                className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-600 transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Checklist({ tasks, categories, onToggleChecklist }: Props) {
  const [filterType, setFilterType] = useState<'all' | 'chung' | 'nha_trai' | 'nha_gai'>('all');

  const catMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  const allChecklist = useMemo(() => tasks.flatMap(t => t.checklist ?? []), [tasks]);
  const totalItems = allChecklist.length;
  const doneItems = allChecklist.filter(c => c.is_completed).length;
  const pct = totalItems === 0 ? 0 : Math.round((doneItems / totalItems) * 100);

  const tasksWithChecklist = useMemo(() => {
    return tasks.filter(t => {
      if ((t.checklist ?? []).length === 0) return false;
      const cat = t.category_id ? catMap.get(t.category_id) : undefined;
      if (filterType !== 'all' && cat?.type !== filterType) return false;
      return true;
    });
  }, [tasks, catMap, filterType]);

  // Group by category
  const grouped = useMemo(() => {
    const groups = new Map<string, { tasks: Task[]; cat: Category | undefined; type: string }>();
    for (const t of tasksWithChecklist) {
      const cat = t.category_id ? catMap.get(t.category_id) : undefined;
      const key = cat?.name ?? 'Khác';
      if (!groups.has(key)) groups.set(key, { tasks: [], cat, type: cat?.type ?? 'chung' });
      groups.get(key)!.tasks.push(t);
    }
    return Array.from(groups.entries()).map(([name, v]) => ({ name, ...v }));
  }, [tasksWithChecklist, catMap]);

  const TYPE_PILL: Record<string, string> = {
    all: 'bg-stone-800 text-white',
    chung: 'bg-rose-600 text-white',
    nha_trai: 'bg-violet-600 text-white',
    nha_gai: 'bg-amber-500 text-white',
  };

  // Helper to find task and item for operations
  const findTaskAndItem = (itemId: string): { task: Task | undefined; item: ChecklistItem | undefined } => {
    for (const t of tasks) {
      const item = (t.checklist ?? []).find(c => c.id === itemId);
      if (item) return { task: t, item };
    }
    return { task: undefined, item: undefined };
  };

  return (
    <div className="space-y-5 pb-20">
      {/* Summary */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="font-bold text-stone-800 text-lg">Checklist tổng hợp</h2>
            <p className="text-stone-400 text-sm">{doneItems}/{totalItems} mục đã hoàn thành</p>
          </div>
          <div className="relative w-16 h-16">
            <svg width="64" height="64" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="32" cy="32" r="24" fill="none" stroke="#f1f5f9" strokeWidth="6" />
              <circle
                cx="32" cy="32" r="24" fill="none" stroke="#e11d48" strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 24}`}
                strokeDashoffset={`${2 * Math.PI * 24 * (1 - pct / 100)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.7s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-stone-700">{pct}%</span>
            </div>
          </div>
        </div>
        <div className="bg-stone-100 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-rose-500 to-pink-400 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {([['all', 'Tất cả'], ['chung', 'Việc chung'], ['nha_trai', 'Nhà trai'], ['nha_gai', 'Nhà gái']] as const).map(([v, l]) => (
          <button
            key={v}
            onClick={() => setFilterType(v)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              filterType === v ? TYPE_PILL[v] : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-xs text-blue-700">
        <strong>Lưu ý:</strong> Double-click để sửa tên mục. Hover để hiện nút edit/xóa.
      </div>

      {/* Grouped checklists */}
      {grouped.length === 0 ? (
        <div className="text-center py-12 text-stone-400">Không có checklist nào</div>
      ) : (
        grouped.map(({ name, tasks: groupTasks, type }) => {
          const allItems = groupTasks.flatMap(t => t.checklist ?? []);
          const groupDone = allItems.filter(c => c.is_completed).length;
          const headerGrad = TYPE_HEADER[type] ?? 'from-stone-600 to-stone-500';

          return (
            <div key={name} className="space-y-2">
              <div className={`bg-gradient-to-r ${headerGrad} rounded-xl px-4 py-2.5 flex items-center justify-between`}>
                <h3 className="text-white font-semibold text-sm">{name}</h3>
                <span className="text-white/70 text-xs">{groupDone}/{allItems.length}</span>
              </div>
              <div className="space-y-2 pl-1">
                {groupTasks.map(t => (
                  <TaskChecklist
                    key={t.id}
                    task={t}
                    type={type}
                    onToggle={onToggleChecklist}
                    onEdit={async (item, newTitle) => {
                      // This would need to be passed from parent - for now just use toggle
                      // In a full implementation, we'd pass updateChecklistItem here
                    }}
                    onDelete={async (item) => {
                      // This would need to be passed from parent - for now just toggle
                      // In a full implementation, we'd pass deleteChecklistItem here
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
