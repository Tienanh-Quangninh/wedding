import { useState, useMemo } from 'react';
import { CheckCircle2, Clock, Circle, ChevronDown, ChevronUp, User, Calendar, DollarSign, Pencil, Trash2 } from 'lucide-react';
import type { Task, Category, TaskStatus, TaskPriority, ChecklistItem } from '../types';
import { STATUS_LABELS, PRIORITY_LABELS, TYPE_LABELS, formatCurrencyFull } from '../types';
import type { TaskFormData } from '../hooks/useWeddingData';
import TaskModal from './TaskModal';

interface Props {
  tasks: Task[];
  categories: Category[];
  onStatusChange: (id: string, status: Task['status']) => Promise<unknown>;
  onUpdateTask: (id: string, data: Partial<TaskFormData>) => Promise<{ error: Error | null }>;
  onDeleteTask: (id: string) => Promise<{ error: Error | null }>;
  onAddChecklist: (taskId: string, title: string) => Promise<{ error: Error | null }>;
  onUpdateChecklist: (id: string, title: string) => Promise<{ error: Error | null }>;
  onDeleteChecklist: (id: string) => Promise<{ error: Error | null }>;
}

type FilterType = 'all' | 'chung' | 'nha_trai' | 'nha_gai';
type FilterStatus = 'all' | 'pending' | 'in_progress' | 'completed';

const STATUS_CONFIG: Record<string, { icon: React.ElementType; bg: string; text: string; dot: string }> = {
  completed: { icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  in_progress: { icon: Clock, bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  pending: { icon: Circle, bg: 'bg-stone-50', text: 'text-stone-500', dot: 'bg-stone-300' },
  cancelled: { icon: Circle, bg: 'bg-stone-50', text: 'text-stone-400', dot: 'bg-stone-200' },
};

const PRIORITY_CONFIG: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border border-red-200',
  high: 'bg-orange-100 text-orange-700 border border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  low: 'bg-stone-100 text-stone-500 border border-stone-200',
};

const TYPE_HEADER: Record<string, string> = {
  chung: 'bg-rose-600',
  nha_trai: 'bg-violet-600',
  nha_gai: 'bg-amber-600',
};

function TaskCard({
  task,
  onStatusChange,
  onEdit,
  onDelete,
  onAddChecklist,
  onUpdateChecklist,
  onDeleteChecklist,
}: {
  task: Task;
  onStatusChange: (id: string, status: Task['status']) => Promise<unknown>;
  onEdit: () => void;
  onDelete: () => void;
  onAddChecklist: (title: string) => Promise<{ error: Error | null }>;
  onUpdateChecklist: (id: string, title: string) => Promise<{ error: Error | null }>;
  onDeleteChecklist: (id: string) => Promise<{ error: Error | null }>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState<string | null>(null);
  const [newItemTitle, setNewItemTitle] = useState('');

  const cfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;

  const statusCycle: Record<Task['status'], Task['status']> = {
    pending: 'in_progress',
    in_progress: 'completed',
    completed: 'pending',
    cancelled: 'pending',
  };

  const handleStatusClick = async () => {
    setUpdating(true);
    await onStatusChange(task.id, statusCycle[task.status]);
    setUpdating(false);
  };

  const checklist = task.checklist ?? [];
  const doneChecklist = checklist.filter(c => c.is_completed).length;
  const deadline = task.deadline ? new Date(task.deadline) : null;
  const now = new Date();
  const isOverdue = deadline && deadline < now && task.status !== 'completed';

  const handleAddItem = async () => {
    if (!newItemTitle.trim()) return;
    await onAddChecklist(newItemTitle.trim());
    setNewItemTitle('');
  };

  return (
    <div className={`bg-white rounded-xl border shadow-sm transition-shadow hover:shadow-md ${isOverdue ? 'border-red-200' : 'border-stone-100'}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <button
            onClick={handleStatusClick}
            disabled={updating}
            className={`mt-0.5 flex-shrink-0 rounded-full p-0.5 transition-all hover:scale-110 ${cfg.bg}`}
            title={`Chuyển sang: ${STATUS_LABELS[statusCycle[task.status]]}`}
          >
            <StatusIcon className={`w-4 h-4 ${cfg.text} ${updating ? 'animate-spin' : ''}`} />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start gap-2">
              <h4 className={`text-sm font-semibold flex-1 ${task.status === 'completed' ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                {task.title}
              </h4>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PRIORITY_CONFIG[task.priority]}`}>
                {PRIORITY_LABELS[task.priority]}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-stone-400">
              {task.assignee && (
                <span className="flex items-center gap-1"><User className="w-3 h-3" />{task.assignee}</span>
              )}
              {deadline && (
                <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-medium' : ''}`}>
                  <Calendar className="w-3 h-3" />
                  {deadline.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  {isOverdue && ' (Quá hạn)'}
                </span>
              )}
              {task.estimated_cost > 0 && (
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  {formatCurrencyFull(task.estimated_cost)}
                </span>
              )}
              {checklist.length > 0 && (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {doneChecklist}/{checklist.length}
                </span>
              )}
            </div>
          </div>

          {/* Edit & Delete buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={onEdit}
              className="p-1.5 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Chỉnh sửa"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Xóa"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {(task.description || checklist.length > 0 || task.notes) && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex-shrink-0 text-stone-400 hover:text-stone-600 transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-stone-50 space-y-3">
            {task.description && (
              <p className="text-xs text-stone-500 leading-relaxed">{task.description}</p>
            )}
            {task.notes && (
              <p className="text-xs text-stone-400 italic">{task.notes}</p>
            )}

            {/* Checklist section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-stone-600">
                  Checklist ({doneChecklist}/{checklist.length})
                </p>
              </div>

              {/* Progress bar */}
              {checklist.length > 0 && (
                <div className="bg-stone-200 h-1.5 rounded-full overflow-hidden mb-2">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{ width: `${(doneChecklist / checklist.length) * 100}%` }}
                  />
                </div>
              )}

              {/* Checklist items */}
              <div className="space-y-1">
                {checklist.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-stone-50 group"
                  >
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 ${
                      item.is_completed ? 'bg-emerald-500 border-emerald-500' : 'border-stone-300'
                    }`} />
                    {editingChecklist === item.id ? (
                      <input
                        autoFocus
                        defaultValue={item.title}
                        onBlur={e => {
                          if (e.target.value.trim() && e.target.value !== item.title) {
                            onUpdateChecklist(item.id, e.target.value.trim());
                          }
                          setEditingChecklist(null);
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            onUpdateChecklist(item.id, e.currentTarget.value.trim());
                            setEditingChecklist(null);
                          }
                          if (e.key === 'Escape') setEditingChecklist(null);
                        }}
                        className="flex-1 text-xs border border-rose-300 rounded px-2 py-0.5 outline-none"
                      />
                    ) : (
                      <span
                        className={`flex-1 text-xs cursor-pointer ${
                          item.is_completed ? 'line-through text-stone-400' : 'text-stone-600'
                        }`}
                        onDoubleClick={() => setEditingChecklist(item.id)}
                      >
                        {item.title}
                      </span>
                    )}
                    <button
                      onClick={() => onDeleteChecklist(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-stone-400 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add new item */}
              <div className="flex gap-2 mt-2">
                <input
                  value={newItemTitle}
                  onChange={e => setNewItemTitle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddItem();
                  }}
                  placeholder="Thêm mục mới..."
                  className="flex-1 text-xs border border-stone-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-rose-300"
                />
                <button
                  onClick={handleAddItem}
                  disabled={!newItemTitle.trim()}
                  className="px-3 py-1.5 bg-rose-600 text-white text-xs rounded-lg font-medium hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Thêm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Tasks({
  tasks,
  categories,
  onStatusChange,
  onUpdateTask,
  onDeleteTask,
  onAddChecklist,
  onUpdateChecklist,
  onDeleteChecklist,
}: Props) {
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Task | null>(null);

  const catMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      const cat = t.category_id ? catMap.get(t.category_id) : undefined;
      if (filterType !== 'all' && cat?.type !== filterType) return false;
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !(t.assignee?.toLowerCase().includes(search.toLowerCase()))) return false;
      return true;
    });
  }, [tasks, filterType, filterStatus, search, catMap]);

  // Group by category
  const grouped = useMemo(() => {
    const groups = new Map<string, Task[]>();
    for (const t of filtered) {
      const cat = t.category_id ? catMap.get(t.category_id) : undefined;
      const key = cat?.name ?? 'Chưa phân loại';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    }
    return Array.from(groups.entries()).map(([name, items]) => {
      const cat = categories.find(c => c.name === name);
      return { name, items, cat };
    });
  }, [filtered, catMap, categories]);

  const counts = useMemo(() => ({
    all: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  }), [tasks]);

  const typeCountMap = useMemo(() => {
    const m: Record<string, number> = { all: tasks.length, chung: 0, nha_trai: 0, nha_gai: 0 };
    for (const t of tasks) {
      const cat = t.category_id ? catMap.get(t.category_id) : undefined;
      if (cat) m[cat.type] = (m[cat.type] ?? 0) + 1;
    }
    return m;
  }, [tasks, catMap]);

  const TYPE_TAB_STYLE: Record<string, string> = {
    all: 'bg-stone-800 text-white',
    chung: 'bg-rose-600 text-white',
    nha_trai: 'bg-violet-600 text-white',
    nha_gai: 'bg-amber-500 text-white',
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    const result = await onDeleteTask(deleteConfirm.id);
    if (!result.error) setDeleteConfirm(null);
  };

  return (
    <div className="space-y-5 pb-20">
      {/* Filters */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {([['all', 'Tất cả'], ['chung', 'Việc chung'], ['nha_trai', 'Nhà trai'], ['nha_gai', 'Nhà gái']] as [FilterType, string][]).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFilterType(v)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                filterType === v ? TYPE_TAB_STYLE[v] : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {l} <span className="opacity-70">({typeCountMap[v] ?? 0})</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {([['all', 'Tất cả trạng thái'], ['pending', 'Chưa bắt đầu'], ['in_progress', 'Đang thực hiện'], ['completed', 'Hoàn thành']] as [FilterStatus, string][]).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFilterStatus(v)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filterStatus === v ? 'bg-stone-700 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
              }`}
            >
              {l} {v !== 'all' && <span className="opacity-60">({counts[v] ?? 0})</span>}
            </button>
          ))}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm hạng mục..."
            className="ml-auto border border-stone-200 rounded-full px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-rose-300 w-48"
          />
        </div>
      </div>

      {/* Task groups */}
      {grouped.length === 0 ? (
        <div className="text-center py-12 text-stone-400">Không có hạng mục nào</div>
      ) : (
        grouped.map(({ name, items, cat }) => {
          const type = cat?.type ?? 'chung';
          const headerBg = TYPE_HEADER[type] ?? 'bg-stone-600';
          const done = items.filter(t => t.status === 'completed').length;

          return (
            <div key={name} className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
              <div className={`${headerBg} px-5 py-3 flex items-center justify-between`}>
                <h3 className="text-white font-semibold text-sm">{name}</h3>
                <span className="text-white/70 text-xs">{done}/{items.length} hoàn thành</span>
              </div>
              <div className="p-4 space-y-3">
                {items.map(t => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    onStatusChange={onStatusChange}
                    onEdit={() => setEditingTask(t)}
                    onDelete={() => setDeleteConfirm(t)}
                    onAddChecklist={(title) => onAddChecklist(t.id, title)}
                    onUpdateChecklist={onUpdateChecklist}
                    onDeleteChecklist={onDeleteChecklist}
                  />
                ))}
              </div>
            </div>
          );
        })
      )}

      {/* Edit Modal */}
      {editingTask && (
        <TaskModal
          task={editingTask}
          categories={categories}
          onSave={async (data) => {
            const result = await onUpdateTask(editingTask.id, data);
            if (!result.error) setEditingTask(null);
            return result;
          }}
          onDelete={async () => {
            const result = await onDeleteTask(editingTask.id);
            if (!result.error) setEditingTask(null);
            return result;
          }}
          onClose={() => setEditingTask(null)}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-stone-800 mb-2">Xác nhận xóa</h3>
              <p className="text-stone-500 text-sm mb-4">
                Bạn có chắc muốn xóa hạng mục <strong className="text-stone-700">"{deleteConfirm.title}"</strong>?
                <br />Hành động này không thể hoàn tác.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 bg-stone-200 text-stone-700 rounded-xl text-sm font-medium hover:bg-stone-300"
                >
                  Huỷ
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
