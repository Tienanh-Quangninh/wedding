import { useState } from 'react';
import { Plus, X, ListTodo, DollarSign, CheckSquare } from 'lucide-react';
import type { Category } from '../types';
import type { TaskFormData } from '../hooks/useWeddingData';
import TaskModal from './TaskModal';

interface Props {
  categories: Category[];
  onCreateTask: (data: TaskFormData) => Promise<{ error: Error | null }>;
}

export default function FloatingAddButton({ categories, onCreateTask }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-r from-rose-600 to-pink-500 rounded-full shadow-lg flex items-center justify-center text-white hover:shadow-xl hover:scale-105 transition-all"
        title="Thêm hạng mục mới"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modal */}
      {open && (
        <TaskModal
          categories={categories}
          onSave={onCreateTask}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
