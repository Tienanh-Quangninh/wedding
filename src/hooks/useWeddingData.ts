import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Category, Task, ChecklistItem, TaskStatus, TaskPriority } from '../types';

export interface TaskFormData {
  title: string;
  description: string;
  category_id: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string;
  estimated_cost: number;
  actual_cost: number;
  assignee: string;
  notes: string;
}

const DEFAULT_TASK: TaskFormData = {
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

export function useWeddingData() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [catRes, taskRes, checkRes] = await Promise.all([
        supabase.from('wedding_categories').select('*').order('sort_order'),
        supabase.from('wedding_tasks').select('*').order('sort_order'),
        supabase.from('wedding_checklist').select('*').order('sort_order'),
      ]);

      if (catRes.error) throw catRes.error;
      if (taskRes.error) throw taskRes.error;
      if (checkRes.error) throw checkRes.error;

      const cats: Category[] = catRes.data ?? [];
      const rawTasks: Task[] = taskRes.data ?? [];
      const checkItems: ChecklistItem[] = checkRes.data ?? [];

      const catMap = new Map(cats.map(c => [c.id, c]));
      const checkMap = new Map<string, ChecklistItem[]>();
      for (const item of checkItems) {
        if (!checkMap.has(item.task_id)) checkMap.set(item.task_id, []);
        checkMap.get(item.task_id)!.push(item);
      }

      const enriched = rawTasks.map(t => ({
        ...t,
        category: t.category_id ? catMap.get(t.category_id) : undefined,
        checklist: checkMap.get(t.id) ?? [],
      }));

      setCategories(cats);
      setTasks(enriched);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Update task status
  const updateTaskStatus = async (id: string, status: Task['status']) => {
    const { error } = await supabase.from('wedding_tasks').update({ status }).eq('id', id);
    if (!error) setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    return error;
  };

  // Update task cost
  const updateTaskCost = async (id: string, actual_cost: number) => {
    const { error } = await supabase.from('wedding_tasks').update({ actual_cost }).eq('id', id);
    if (!error) setTasks(prev => prev.map(t => t.id === id ? { ...t, actual_cost } : t));
    return error;
  };

  // Create new task
  const createTask = async (data: TaskFormData): Promise<{ error: Error | null; task: Task | null }> => {
    const insertData = {
      title: data.title,
      description: data.description || null,
      category_id: data.category_id || null,
      status: data.status,
      priority: data.priority,
      deadline: data.deadline || null,
      estimated_cost: data.estimated_cost,
      actual_cost: data.actual_cost,
      assignee: data.assignee || null,
      notes: data.notes || null,
    };

    const { data: newTask, error } = await supabase
      .from('wedding_tasks')
      .insert(insertData)
      .select()
      .single();

    if (error) return { error, task: null };

    const cat = data.category_id ? categories.find(c => c.id === data.category_id) : undefined;
    const enriched: Task = { ...newTask, category: cat, checklist: [] };
    setTasks(prev => [...prev, enriched]);
    return { error: null, task: enriched };
  };

  // Update task
  const updateTask = async (id: string, data: Partial<TaskFormData>): Promise<{ error: Error | null }> => {
    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.category_id !== undefined) updateData.category_id = data.category_id || null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.deadline !== undefined) updateData.deadline = data.deadline || null;
    if (data.estimated_cost !== undefined) updateData.estimated_cost = data.estimated_cost;
    if (data.actual_cost !== undefined) updateData.actual_cost = data.actual_cost;
    if (data.assignee !== undefined) updateData.assignee = data.assignee || null;
    if (data.notes !== undefined) updateData.notes = data.notes || null;

    const { error } = await supabase.from('wedding_tasks').update(updateData).eq('id', id);
    if (!error) {
      setTasks(prev => prev.map(t => {
        if (t.id !== id) return t;
        const cat = data.category_id ? categories.find(c => c.id === data.category_id) : t.category;
        return { ...t, ...updateData, category: cat };
      }));
    }
    return { error };
  };

  // Delete task
  const deleteTask = async (id: string): Promise<{ error: Error | null }> => {
    const { error } = await supabase.from('wedding_tasks').delete().eq('id', id);
    if (!error) setTasks(prev => prev.filter(t => t.id !== id));
    return { error };
  };

  // Toggle checklist item
  const toggleChecklist = async (item: ChecklistItem) => {
    const { error } = await supabase
      .from('wedding_checklist')
      .update({ is_completed: !item.is_completed })
      .eq('id', item.id);
    if (!error) {
      setTasks(prev => prev.map(t => {
        if (t.id !== item.task_id) return t;
        return {
          ...t,
          checklist: (t.checklist ?? []).map(c =>
            c.id === item.id ? { ...c, is_completed: !c.is_completed } : c
          ),
        };
      }));
    }
    return error;
  };

  // Add checklist item
  const addChecklistItem = async (taskId: string, title: string): Promise<{ error: Error | null; item: ChecklistItem | null }> => {
    const { data: newItem, error } = await supabase
      .from('wedding_checklist')
      .insert({ task_id: taskId, title, is_completed: false })
      .select()
      .single();

    if (error) return { error, item: null };

    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return { ...t, checklist: [...(t.checklist ?? []), newItem] };
    }));
    return { error: null, item: newItem };
  };

  // Update checklist item
  const updateChecklistItem = async (id: string, title: string): Promise<{ error: Error | null }> => {
    const { error } = await supabase.from('wedding_checklist').update({ title }).eq('id', id);
    if (!error) {
      setTasks(prev => prev.map(t => ({
        ...t,
        checklist: (t.checklist ?? []).map(c => c.id === id ? { ...c, title } : c),
      })));
    }
    return { error };
  };

  // Delete checklist item
  const deleteChecklistItem = async (id: string): Promise<{ error: Error | null }> => {
    const { error } = await supabase.from('wedding_checklist').delete().eq('id', id);
    if (!error) {
      setTasks(prev => prev.map(t => ({
        ...t,
        checklist: (t.checklist ?? []).filter(c => c.id !== id),
      })));
    }
    return { error };
  };

  return {
    categories,
    tasks,
    loading,
    error,
    updateTaskStatus,
    updateTaskCost,
    createTask,
    updateTask,
    deleteTask,
    toggleChecklist,
    addChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    refresh: fetchData,
    DEFAULT_TASK,
  };
}
