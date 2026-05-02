import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, Subject, isHexColor, getLocalDateString, TaskPriority } from '../types';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  ListTodo, 
  Plus, 
  Trash2, 
  Archive,
  RotateCcw,
  Play,
  Pencil,
  X,
  Save
} from 'lucide-react';
import { db, auth } from '../services/firebase';
import { 
  doc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  collection, 
  writeBatch,
  query,
  onSnapshot
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { dbService } from '../services/db';
import { motion, AnimatePresence } from 'framer-motion';

interface KanbanBoardProps {
  tasks: Task[];
  subjects: Subject[];
  onTaskUpdate: () => void;
  onStartSession: (subjectId: string) => void;
  selectedDate?: string;
  dayStartHour?: number;
}

const COLUMNS: { id: TaskStatus; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'backlog', label: 'Backlog', icon: ListTodo, color: 'slate' },
  { id: 'todo', label: 'To Do', icon: Circle, color: 'indigo' },
  { id: 'doing', label: 'Doing', icon: Clock, color: 'violet' },
  { id: 'done', label: 'Done', icon: CheckCircle2, color: 'emerald' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  tasks: initialTasks, 
  subjects, 
  onTaskUpdate,
  onStartSession,
  selectedDate,
  dayStartHour
}) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [activeColumn, setActiveColumn] = useState<TaskStatus>('todo');
  
  // Modals state
  const [addingTaskStatus, setAddingTaskStatus] = useState<TaskStatus | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const cleanupRun = React.useRef(false);
  const [todayStr, setTodayStr] = useState<string>('');

  useEffect(() => {
    const startHour = dayStartHour || 0;
    const now = new Date();
    const logicalDate = new Date(now);
    if (now.getHours() < startHour) {
      logicalDate.setDate(logicalDate.getDate() - 1);
    }
    setTodayStr(logicalDate.toISOString().split('T')[0]);
  }, [dayStartHour]);

  useEffect(() => {
    if (cleanupRun.current || tasks.length === 0 || !todayStr) return;
    cleanupRun.current = true;

    const tasksToUpdate = tasks.filter(t => 
      (t.status === 'todo' || t.status === 'doing') && 
      t.dateString && t.dateString < todayStr
    );

    const tasksToArchive = tasks.filter(t => 
      t.status === 'done' && 
      t.dateString && t.dateString < todayStr
    );

    if (tasksToUpdate.length === 0 && tasksToArchive.length === 0) return;

    const performCleanup = async () => {
      try {
        if (user) {
          const batch = writeBatch(db);
          
          tasksToUpdate.forEach(t => {
            const ref = doc(db, 'users', user.uid, 'tasks', t.id);
            batch.update(ref, { status: 'backlog', updatedAt: Date.now() });
          });

          if (tasksToArchive.length > 0) {
              const archiveRef = collection(db, 'users', user.uid, 'archived_tasks');
              tasksToArchive.forEach(t => {
                const newDocRef = doc(archiveRef);
                batch.set(newDocRef, { ...t, archivedAt: Date.now() });
                const taskRef = doc(db, 'users', user.uid, 'tasks', t.id);
                batch.delete(taskRef);
              });
          }
          
          await batch.commit();
        } else {
          // Guest mode
          await Promise.all(tasksToUpdate.map(t => 
             dbService.saveTask({ ...t, status: 'backlog', updatedAt: Date.now() })
          ));
          await Promise.all(tasksToArchive.map(t => dbService.deleteTask(t.id)));
          onTaskUpdate();
        }
      } catch (err) {
        console.error("Day start cleanup failed:", err);
      }
    };
    
    performCleanup();
  }, [tasks, user, todayStr, onTaskUpdate]);

  // Auth & Realtime Listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setTasks(initialTasks);
      return;
    }

    // Realtime listener for the board
    const q = query(collection(db, 'users', user.uid, 'tasks'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      // We only update if we are NOT currently dragging to avoid jitter
      if (!draggedTaskId && !editingTask) {
        setTasks(newTasks);
      }
    });

    return () => unsubscribe();
  }, [user, initialTasks, draggedTaskId, editingTask]);

  // --- Drag & Drop Logic ---

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent drag image or default
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    const task = tasks.find(t => t.id === draggedTaskId);
    if (!task || task.status === targetStatus) {
      setDraggedTaskId(null);
      return;
    }

    // 1. Optimistic Update
    const updatedTask = { ...task, status: targetStatus, updatedAt: Date.now() };
    setTasks(prev => prev.map(t => t.id === draggedTaskId ? updatedTask : t));
    setDraggedTaskId(null);

    // 2. Firestore Update
    try {
      if (user) {
        await updateDoc(doc(db, 'users', user.uid, 'tasks', draggedTaskId), {
          status: targetStatus,
          updatedAt: Date.now()
        });
      } else {
        await dbService.saveTask(updatedTask);
        onTaskUpdate();
      }
    } catch (err) {
      console.error("Drop failed:", err);
      // Revert on failure could go here
    }
  };

  // --- Actions ---

  const handleSaveTask = async (taskId: string | null, updates: Partial<Task>) => {
    if (taskId) {
      handleUpdateTask(taskId, updates);
    } else {
      if (!updates.title?.trim()) return;
      
      const newTask: Task = {
        id: crypto.randomUUID(),
        title: updates.title.trim(),
        description: updates.description,
        status: updates.status as TaskStatus || addingTaskStatus || 'backlog',
        priority: updates.priority as TaskPriority || 'medium',
        subjectId: updates.subjectId || (subjects.length > 0 ? subjects[0].id : 'misc'),
        dateString: selectedDate || getLocalDateString(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        order: Date.now(),
      };

      setTasks(prev => [...prev, newTask]);
      setAddingTaskStatus(null);

      try {
        if (user) {
          await setDoc(doc(db, 'users', user.uid, 'tasks', newTask.id), newTask);
        } else {
          await dbService.saveTask(newTask);
          onTaskUpdate();
        }
      } catch (err) {
        console.error("Add task failed:", err);
      }
    }
  };

  const handleDelete = async (taskId: string) => {
    // Optimistic
    setTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      if (user) {
        await deleteDoc(doc(db, 'users', user.uid, 'tasks', taskId));
      } else {
        await dbService.deleteTask(taskId);
        onTaskUpdate();
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    // Optimistic Update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    setEditingTask(null);

    try {
      if (user) {
        await updateDoc(doc(db, 'users', user.uid, 'tasks', taskId), {
          ...updates,
          updatedAt: Date.now()
        });
      } else {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          await dbService.saveTask({ ...task, ...updates });
          onTaskUpdate();
        }
      }
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  const handleResetDay = async () => {
    const doneTasks = tasks.filter(t => t.status === 'done');
    if (doneTasks.length === 0) return;
    
    if (!confirm(`Archive ${doneTasks.length} completed tasks and clear the board?`)) return;

    setIsResetting(true);

    // Optimistic Clear
    setTasks(prev => prev.filter(t => t.status !== 'done'));

    try {
      if (user) {
        const batch = writeBatch(db);
        const archiveRef = collection(db, 'users', user.uid, 'archived_tasks');
        
        // 1. Copy to Archive & 2. Delete from Tasks
        for (const task of doneTasks) {
          const newDocRef = doc(archiveRef); // Auto-ID for archive
          batch.set(newDocRef, { ...task, archivedAt: Date.now() });
          
          const taskRef = doc(db, 'users', user.uid, 'tasks', task.id);
          batch.delete(taskRef);
        }
        
        await batch.commit();
      } else {
        // Guest mode: just delete for now, or implement archive in dbService if needed
        await Promise.all(doneTasks.map(t => dbService.deleteTask(t.id)));
        onTaskUpdate();
      }
    } catch (err) {
      console.error("Reset day failed:", err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex flex-col relative md:h-full md:min-h-0 md:overflow-hidden">
      {/* Header Actions */}
      <div className="flex justify-end mb-4 px-2">
        <button
          onClick={handleResetDay}
          disabled={isResetting || !tasks.some(t => t.status === 'done')}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-white/5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw size={14} />
          {isResetting ? 'Archiving...' : 'Reset Day'}
        </button>
      </div>

      {/* Mobile column switcher tab bar */}
      <div className="flex md:hidden gap-1 mb-3 bg-white/5 p-1 rounded-xl border border-white/5 mx-2">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          const isActive = activeColumn === col.id;
          const Icon = col.icon;
          return (
            <button
              key={col.id}
              onClick={() => setActiveColumn(col.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all relative ${isActive ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <div className="flex items-center gap-1">
                <Icon size={12} className={isActive ? `text-${col.color}-400` : ''} />
                <span>{col.label}</span>
              </div>
              {colTasks.length > 0 && (
                <div className={`absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center ${isActive ? `bg-${col.color}-500 text-white` : 'bg-slate-700 text-slate-300'}`}>
                  {colTasks.length}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Columns Container */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Desktop: all 4 columns */}
        <div className="hidden md:flex h-full flex-row gap-4 min-w-[300px] md:min-w-0">
          {COLUMNS.map(col => (
            <div 
              key={col.id}
              className={`flex-1 flex flex-col min-w-[280px] md:min-w-0 rounded-2xl border ${
                col.id === 'doing' 
                  ? 'bg-violet-500/5 border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]' 
                  : 'bg-slate-900/40 border-white/5'
              } backdrop-blur-sm transition-colors`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Column Header */}
              <div className={`p-4 border-b border-white/5 flex items-center justify-between ${
                col.id === 'doing' ? 'bg-violet-500/10' : ''
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg bg-${col.color}-500/10 text-${col.color}-400`}>
                    <col.icon size={16} />
                  </div>
                  <h3 className={`font-bold text-sm ${col.id === 'doing' ? 'text-violet-200' : 'text-slate-300'}`}>
                    {col.label}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] font-mono text-slate-500">
                    {tasks.filter(t => t.status === col.id).length}
                  </span>
                </div>
                {col.id === 'backlog' && (
                   <button 
                     onClick={() => setAddingTaskStatus(col.id)}
                     className="text-slate-500 hover:text-white transition-colors"
                   >
                     <Plus size={16} />
                   </button>
                )}
              </div>

              {/* Task List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                <AnimatePresence mode="popLayout">
                  {tasks
                    .filter(t => t.status === col.id)
                    .map(task => (
                      <KanbanCard 
                        key={task.id} 
                        task={task} 
                        subject={subjects.find(s => s.id === task.subjectId)}
                        onDragStart={handleDragStart}
                        onDelete={handleDelete}
                        onEdit={() => setEditingTask(task)}
                        onStartSession={onStartSession}
                        todayStr={todayStr}
                      />
                    ))}
                </AnimatePresence>
                
                {tasks.filter(t => t.status === col.id).length === 0 && (
                  <div className="h-24 border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center text-slate-600 text-xs">
                    Drop here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile: single active column */}
        <div className="flex md:hidden flex-col flex-1 pb-32 px-2">
          {COLUMNS.filter(col => col.id === activeColumn).map(col => (
             <KanbanColumnMobile 
               key={col.id} 
               column={col} 
               tasks={tasks}
               subjects={subjects}
               onEdit={(task) => setEditingTask(task)}
               onStartSession={onStartSession}
               onAddTask={(status) => setAddingTaskStatus(status)}
               onMove={(id, status) => handleUpdateTask(id, {status})}
               onDelete={(id) => handleDelete(id)}
             />
          ))}
        </div>
      </div>

      {/* Task Modal */}
      <AnimatePresence>
        {(editingTask || addingTaskStatus) && (
          <TaskModal 
            task={editingTask}
            defaultStatus={addingTaskStatus || 'backlog'}
            onClose={() => {
              setEditingTask(null);
              setAddingTaskStatus(null);
            }} 
            onSave={handleSaveTask}
            subjects={subjects}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

interface KanbanCardProps {
  task: Task;
  subject?: Subject;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDelete: (id: string) => void;
  onEdit: () => void;
  onStartSession: (subjectId: string) => void;
  todayStr?: string;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ task, subject, onDragStart, onDelete, onEdit, onStartSession, todayStr }) => {
  const color = subject?.color || '#64748b';
  const isHex = isHexColor(color);
  
  const isAutoMoved = task.status === 'backlog' && task.dateString && todayStr && task.dateString < todayStr;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      draggable
      onDragStart={(e) => {
        // @ts-ignore - React.DragEvent mismatch with HTML element sometimes
        onDragStart(e, task.id);
      }}
      className="group relative bg-slate-800/80 hover:bg-slate-800 border border-white/5 hover:border-white/10 rounded-xl p-3 shadow-sm hover:shadow-lg transition-all cursor-grab active:cursor-grabbing"
    >
      {/* Subject Indicator */}
      <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full" style={{ backgroundColor: isHex ? color : undefined }} />

      <div className="pl-3">
        {/* Header */}
        <div className="flex justify-between items-start mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {subject?.name || 'General'}
          </span>
          <div className="flex items-center gap-1">
            {task.priority === 'high' && (
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
            )}
            {task.priority === 'medium' && (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
            {task.priority === 'low' && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </div>
        </div>

        {isAutoMoved ? (
          <div className="mb-2 w-fit flex items-center gap-1 mt-1 bg-amber-500/10 text-amber-500/80 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase border border-amber-500/20">
            <RotateCcw size={8} /> From Yesterday
          </div>
        ) : null}

        {/* Title */}
        <h4 className={`text-sm font-medium mb-1 ${task.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
          {task.title}
        </h4>
        
        {/* Description Preview (if any) */}
        {task.description && (
          <p className="text-[10px] text-slate-500 line-clamp-2 mb-2">
            {task.description}
          </p>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
           {/* Left: Time/Date or Start Button */}
           <div className="flex items-center gap-2">
              {task.status === 'todo' ? (
                 <button 
                   onClick={() => onStartSession(task.subjectId)}
                   className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-1 rounded transition-colors"
                 >
                   <Play size={10} /> START
                 </button>
              ) : (
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Clock size={10} /> {new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              )}
           </div>

           {/* Right: Edit/Delete/Archive */}
           <div className="flex items-center gap-1">
             <button 
               onClick={(e) => {
                 e.stopPropagation();
                 onEdit();
               }}
               className="text-slate-600 hover:text-indigo-400 p-1 rounded hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100"
               title="Edit Task"
             >
               <Pencil size={14} />
             </button>
             <button 
               onClick={(e) => {
                 e.stopPropagation();
                 onDelete(task.id);
               }}
               className="text-slate-600 hover:text-rose-400 p-1 rounded hover:bg-white/5 transition-colors"
               title={task.status === 'done' ? "Archive Task" : "Delete Task"}
             >
               {task.status === 'done' ? <Archive size={14} /> : <Trash2 size={14} />}
             </button>
           </div>
        </div>
      </div>
    </motion.div>
  );
};

interface TaskModalProps {
  task?: Task | null;
  defaultStatus?: TaskStatus;
  subjects: Subject[];
  onClose: () => void;
  onSave: (taskId: string | null, updates: Partial<Task>) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ task, defaultStatus, subjects, onClose, onSave }) => {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'medium');
  const [subjectId, setSubjectId] = useState(task?.subjectId || (subjects.length > 0 ? subjects[0].id : 'misc'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(task ? task.id : null, {
      title,
      description,
      priority,
      subjectId,
      ...(task ? {} : { status: defaultStatus || 'backlog' })
    });
  };

  const isNew = !task;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25 }}
        className="w-full sm:max-w-md bg-[#0F1115] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden pb-safe max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex-none flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            {isNew ? <Plus size={18} className="text-indigo-400" /> : <Pencil size={18} className="text-violet-400" />}
            {isNew ? 'New Task' : 'Edit Task'}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <form id="taskForm" onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Title</label>
              <input
                type="text"
                autoFocus={isNew}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
                placeholder="Task title"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all min-h-[100px] resize-none custom-scrollbar"
                placeholder="Add notes or details..."
              />
            </div>

            {/* Row: Priority & Subject */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 appearance-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Subject</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 appearance-none"
                >
                  {subjects.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </form>
        </div>

        {/* Actions - Fixed at bottom */}
        <div className="flex-none flex items-center justify-end gap-3 p-4 border-t border-white/5 bg-slate-900/50 shadow-[0_-20px_20px_-10px_rgba(0,0,0,0.5)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="taskForm"
            disabled={!title.trim()}
            className="flex items-center gap-2 px-6 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl shadow-lg shadow-violet-500/20 transition-all transform md:hover:scale-105 active:scale-95"
          >
            {isNew ? <Plus size={16} /> : <Save size={16} />}
            {isNew ? 'Create Task' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

interface KanbanColumnMobileProps {
  column: { id: TaskStatus; label: string; icon: React.ElementType; color: string };
  tasks: Task[];
  subjects: Subject[];
  onEdit: (task: Task) => void;
  onStartSession: (subjectId: string) => void;
  onAddTask: (status: TaskStatus) => void;
  onMove: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
}

const KanbanColumnMobile: React.FC<KanbanColumnMobileProps> = ({ 
  column, tasks, subjects, onEdit, onStartSession, onAddTask, onMove, onDelete 
}) => {
  const colTasks = tasks.filter(t => t.status === column.id);
  const Icon = column.icon;
  
  return (
    <div className="flex flex-col flex-1 min-h-0 gap-2 pb-4">
      {/* Column header */}
      <div className="flex items-center justify-between py-2 px-1">
        <div className="flex items-center gap-2">
          <Icon size={14} className={`text-${column.color}-400`} />
          <span className="text-sm font-bold text-white">
            {column.label}
          </span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-${column.color}-500/15 text-${column.color}-400`}>
            {colTasks.length}
          </span>
        </div>
        {/* Add task button for backlog column */}
        {column.id === 'backlog' && (
          <button
            onClick={() => onAddTask(column.id)}
            className="flex items-center gap-1 text-[10px] font-bold bg-white/5 hover:bg-white/10 text-slate-300 px-2 py-1 rounded-lg transition-colors border border-white/5"
          >
            <Plus size={10} /> Add
          </button>
        )}
      </div>

      {/* Content */}
      {colTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 border-2 border-dashed border-white/5 rounded-xl text-slate-600 flex-1">
          <Icon size={28} className="opacity-40" />
          <span className="text-xs">No tasks here</span>
          {column.id === 'backlog' && (
            <button
              onClick={() => onAddTask(column.id)}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-1 transition-colors"
            >
              <Plus size={12} /> Add your first task
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2 flex-1">
          {colTasks
            .sort((a,b) => {
              const p = {high:0, medium:1, low:2};
              return (p[a.priority]||1) - (p[b.priority]||1);
            })
            .map(task => (
              <MobileTaskCard
                key={task.id}
                task={task}
                subjects={subjects}
                column={column}
                onEdit={() => onEdit(task)}
                onMove={(newStatus) => onMove(task.id, newStatus)}
                onDelete={() => onDelete(task.id)}
                onStartSession={onStartSession}
              />
            ))}
        </div>
      )}
    </div>
  );
};

interface MobileTaskCardProps {
  task: Task;
  subjects: Subject[];
  column: { id: TaskStatus; label: string; icon: React.ElementType; color: string };
  onEdit: () => void;
  onMove: (newStatus: TaskStatus) => void;
  onDelete: () => void;
  onStartSession: (subjectId: string) => void;
}

const MobileTaskCard: React.FC<MobileTaskCardProps> = ({ 
  task, subjects, column, onEdit, onMove, onDelete, onStartSession 
}) => {
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const subject = subjects.find(s => s.id === task.subjectId);
  const priorityColors: Record<string, string> = {
    high: 'rose', medium: 'amber', low: 'emerald'
  };
  const pColor = priorityColors[task.priority] || 'slate';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/60 border border-white/8 rounded-xl p-3 relative"
    >
      {/* Priority bar on left */}
      <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-${pColor}-500 ml-0`} />
      
      <div className="pl-2">
        {/* Task title */}
        <div className={`text-sm font-medium ${task.status === 'done' ? 'text-slate-500 line-through' : 'text-white'} leading-snug mb-2`}>{task.title}</div>
        
        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap">
          {subject && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background: subject.color}} />
              <span className="text-[10px] text-slate-400 truncate max-w-[80px]">{subject.name}</span>
            </div>
          )}
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-${pColor}-500/10 text-${pColor}-400 uppercase tracking-wide`}>
            {task.priority}
          </span>
          {task.dateString && task.dateString < new Date().toISOString().split('T')[0] && column.id !== 'done' && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 flex items-center gap-0.5">
              <RotateCcw size={8} /> Yesterday
            </span>
          )}
        </div>

        {/* Action buttons row */}
        <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-white/5">
          {/* Move to button */}
          <div className="relative flex-1">
            <button
              onClick={() => setShowMoveMenu(m => !m)}
              className="w-full flex items-center justify-center gap-1 text-[10px] font-bold bg-white/5 hover:bg-white/10 text-slate-300 px-2 py-1.5 rounded-lg transition-colors border border-white/5"
            >
              Move to ▾
            </button>
            <AnimatePresence>
              {showMoveMenu && (
                <motion.div
                  initial={{opacity:0, y:5, scale:0.95}}
                  animate={{opacity:1, y:0, scale:1}}
                  exit={{opacity:0, y:5, scale:0.95}}
                  className="absolute bottom-full left-0 mb-1 bg-slate-800 border border-white/10 rounded-xl overflow-hidden shadow-xl z-20 min-w-[120px]"
                >
                  {COLUMNS
                    .filter(c => c.id !== column.id)
                    .map(c => (
                      <button
                        key={c.id}
                        onClick={() => {
                          onMove(c.id);
                          setShowMoveMenu(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-white/5 transition-colors text-left text-${c.color}-300`}
                      >
                        <c.icon size={12} />
                        {c.label}
                      </button>
                    ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Edit */}
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
          >
            <Pencil size={12} />
          </button>

          {/* Start session */}
          {task.subjectId && column.id === 'todo' && (
            <button
              onClick={() => onStartSession(task.subjectId)}
              className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors text-indigo-400 font-bold"
            >
              <Play size={12} />
            </button>
          )}

          {/* Delete */}
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 transition-colors text-rose-400"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
