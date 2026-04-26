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
  
  // Add Task State
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Edit Task State
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

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: newTaskTitle.trim(),
      status: 'backlog',
      priority: 'medium',
      subjectId: subjects[0]?.id || 'misc',
      dateString: selectedDate || getLocalDateString(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      order: Date.now(),
    };

    // Optimistic
    setTasks(prev => [...prev, newTask]);
    setNewTaskTitle('');
    setIsAddingTask(false);

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
    <div className="h-full flex flex-col relative">
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

      {/* Columns Container */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="h-full flex flex-col md:flex-row gap-4 min-w-[300px] md:min-w-0">
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
                     onClick={() => setIsAddingTask(!isAddingTask)}
                     className="text-slate-500 hover:text-white transition-colors"
                   >
                     <Plus size={16} />
                   </button>
                )}
              </div>

              {/* Add Task Input */}
              {col.id === 'backlog' && isAddingTask && (
                <div className="px-3 pt-3">
                  <input
                    autoFocus
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                    onBlur={() => { if(!newTaskTitle) setIsAddingTask(false) }}
                    placeholder="New task..."
                    className="w-full bg-slate-800 border border-indigo-500/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none placeholder:text-slate-600"
                  />
                </div>
              )}

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
                
                {tasks.filter(t => t.status === col.id).length === 0 && !isAddingTask && (
                  <div className="h-24 border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center text-slate-600 text-xs">
                    Drop here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingTask && (
          <EditTaskModal 
            task={editingTask} 
            onClose={() => setEditingTask(null)} 
            onSave={handleUpdateTask}
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

interface EditTaskModalProps {
  task: Task;
  subjects: Subject[];
  onClose: () => void;
  onSave: (taskId: string, updates: Partial<Task>) => void;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, subjects, onClose, onSave }) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [subjectId, setSubjectId] = useState(task.subjectId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(task.id, {
      title,
      description,
      priority,
      subjectId
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[#0F1115] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Pencil size={18} className="text-violet-400" />
            Edit Task
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Title</label>
            <input
              type="text"
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
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all min-h-[100px] resize-none"
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
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50"
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
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50"
              >
                {subjects.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-violet-500/20 transition-all transform hover:scale-105 active:scale-95"
            >
              <Save size={16} />
              Save Changes
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
