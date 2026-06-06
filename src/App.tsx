import { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Timeline from './components/Timeline';
import Tasks from './components/Tasks';
import Budget from './components/Budget';
import Checklist from './components/Checklist';
import FloatingAddButton from './components/FloatingAddButton';
import { useWeddingData } from './hooks/useWeddingData';
import { Heart } from 'lucide-react';

type Tab = 'dashboard' | 'timeline' | 'tasks' | 'budget' | 'checklist';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const {
    categories,
    tasks,
    loading,
    error,
    updateTaskStatus,
    createTask,
    updateTask,
    deleteTask,
    toggleChecklist,
    addChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
  } = useWeddingData();

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Heart className="w-8 h-8 text-rose-400 animate-pulse" />
          <p className="text-stone-400 text-sm">Đang tải kế hoạch cưới...</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-600 font-medium">Lỗi tải dữ liệu</p>
          <p className="text-red-400 text-sm mt-1">{error}</p>
        </div>
      );
    }
    switch (activeTab) {
      case 'dashboard': return <Dashboard tasks={tasks} categories={categories} />;
      case 'timeline': return <Timeline tasks={tasks} categories={categories} />;
      case 'tasks': return (
        <Tasks
          tasks={tasks}
          categories={categories}
          onStatusChange={updateTaskStatus}
          onUpdateTask={updateTask}
          onDeleteTask={deleteTask}
          onAddChecklist={addChecklistItem}
          onUpdateChecklist={updateChecklistItem}
          onDeleteChecklist={deleteChecklistItem}
        />
      );
      case 'budget': return <Budget tasks={tasks} categories={categories} />;
      case 'checklist': return (
        <Checklist
          tasks={tasks}
          categories={categories}
          onToggleChecklist={toggleChecklist}
        />
      );
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
      {!loading && !error && activeTab === 'tasks' && (
        <FloatingAddButton categories={categories} onCreateTask={createTask} />
      )}
    </Layout>
  );
}
