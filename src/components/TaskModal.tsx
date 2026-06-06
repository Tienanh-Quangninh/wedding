import { useState, useEffect } from 'react';
import { X, Save, Trash2, Plus } from 'lucide-react';
import type { Category, Task, TaskStatus, TaskPriority, TaskFormData } from '../types';
import { STATUS_LABELS, PRIORITY_LABELS, formatCurrencyFull } from '../types';

interface Props {
  task?: Task | null;
  categories: Category[];
  onSave: (data: TaskFormData) => Promise<{ error: Error | null }>;
  onDelete?: () => Promise<{ error: Error | null }>;
  onClose: () => void;
}

const emptyForm: TaskFormData = {
  title: '',
  description: '',
  category_id: null,
  status: 'pending',
  priority: 'medium',
  deadline: '',
  estimated_cost: 0,
  actual_cost: 0,
  assignee: '',
  notes: '',
};

export default function TaskModal({ task, categories, onSave, onDelete, onClose }: Props) {
  const [form, setForm] = useState<TaskFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description || '',
        category_id: task.category_id || null,
        status: task.status,
        priority: task.priority,
        deadline: task.deadline || '',
        estimated_cost: task.estimated_cost,
        actual_cost: task.actual_cost,
        assignee: task.assignee || '',
        notes: task.notes || '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    const result = await onSave(form);
    setSaving(false);
    if (!result.error) onClose();
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    const result = await onDelete();
    setDeleting(false);
    if (!result.error) onClose();
  };

  const update = <K extends keyof TaskFormData>(key: K, value: TaskFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const formatNumber = (n: number) => n === 0 ? '' : n.toString();
  const parseNumber = (s: string) => {
    const parsed = parseInt(s.replace(/[^0-9]/g, ''), 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4 pt-16" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 to-pink-500 px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">{task ? 'Chỉnh sửa hạng mục' : 'Thêm hạng mục mới'}</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
              Tiêu đề <span className="text-rose-500">*</span>
            </label>
            <input
              value={form.title}
              onChange={e => update('title', e.target.value)}
              placeholder="Ví dụ: Đặt nhà hàng tiệc cưới"
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 transition-all"
              required
            />
          </div>

          {/* Category & Status & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">Danh mục</label>
              <select
                value={form.category_id || ''}
                onChange={e => update('category_id', e.target.value || null)}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-300"
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">Trạng thái</label>
              <select
                value={form.status}
                onChange={e => update('status', e.target.value as TaskStatus)}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-300"
              >
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">Ưu tiên</label>
              <select
                value={form.priority}
                onChange={e => update('priority', e.target.value as TaskPriority)}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-300"
              >
                {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Deadline & Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">Deadline</label>
              <input
                type="date"
                value={form.deadline}
                onChange={e => update('deadline', e.target.value)}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">Người phụ trách</label>
              <input
                value={form.assignee}
                onChange={e => update('assignee', e.target.value)}
                placeholder="Ví dụ: Tiến Anh"
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
          </div>

          {/* Costs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">Chi phí dự toán (VNĐ)</label>
              <input
                type="text"
                value={formatNumber(form.estimated_cost)}
                onChange={e => update('estimated_cost', parseNumber(e.target.value))}
                placeholder="0"
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-300 tabular-nums"
              />
              {form.estimated_cost > 0 && (
                <p className="text-xs text-stone-400 mt-1">{formatCurrencyFull(form.estimated_cost)}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">Chi phí thực tế (VNĐ)</label>
              <input
                type="text"
                value={formatNumber(form.actual_cost)}
                onChange={e => update('actual_cost', parseNumber(e.target.value))}
                placeholder="0"
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-300 tabular-nums"
              />
              {form.actual_cost > 0 && (
                <p className="text-xs text-stone-400 mt-1">{formatCurrencyFull(form.actual_cost)}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">Mô tả</label>
            <textarea
              value={form.description}
              onChange={e => update('description', e.target.value)}
              placeholder="Mô tả chi tiết hạng mục..."
              rows={2}
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-300 resize-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">Ghi chú</label>
            <textarea
              value={form.notes}
              onChange={e => update('notes', e.target.value)}
              placeholder="Ghi chú thêm..."
              rows={2}
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-300 resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-stone-100 px-6 py-4 flex items-center justify-between gap-3 bg-stone-50">
          {task && onDelete ? (
            showDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600">Xác nhận xóa?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? 'Đang xóa...' : 'Xóa'}
                </button>
                <button
                  onClick={() => setShowDelete(false)}
                  className="px-3 py-1.5 bg-stone-200 text-stone-600 rounded-lg text-xs font-medium hover:bg-stone-300"
                >
                  Huỷ
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDelete(true)}
                className="flex items-center gap-1.5 text-red-500 hover:text-red-700 text-xs font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Xóa hạng mục
              </button>
            )
          ) : <div />}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-200 text-stone-700 rounded-xl text-sm font-medium hover:bg-stone-300 transition-colors"
            >
              Đóng
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !form.title.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                'Đang lưu...'
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {task ? 'Cập nhật' : 'Thêm mới'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
