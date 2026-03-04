
import React, { useState, useEffect } from 'react';
import { Subject, isHexColor } from '../types';
import { Plus, X, Edit2, Trash2, Check, Palette, AlertTriangle, Info, Archive, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { dbService } from '../services/db';
import { useTheme } from '../contexts/ThemeContext';

import { useGlobalContext } from '../contexts/GlobalContext';

const PRESET_THEMES = [
  { name: 'Chemistry Blue', color: '#3b82f6' },
  { name: 'Bio Green', color: '#22c55e' },
  { name: 'Physics Purple', color: '#a855f7' },
  { name: 'Math Red', color: '#ef4444' },
  { name: 'History Orange', color: '#f97316' },
  { name: 'Lit Yellow', color: '#eab308' },
];

export const SubjectManager: React.FC = () => {
  const { subjects: initialSubjects, refreshSubjects: onUpdate, setIsSubjectManagerOpen } = useGlobalContext();
  const onClose = () => setIsSubjectManagerOpen(false);
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_THEMES[0].color);
  const [isCreating, setIsCreating] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { accent } = useTheme();

  const activeSubjects = subjects.filter(s => !s.isArchived);
  const archivedSubjects = subjects.filter(s => s.isArchived);

  // Sync local state with props when props change
  useEffect(() => {
    setSubjects(initialSubjects);
  }, [initialSubjects]);

  const handleStartEdit = (subject: Subject) => {
    setEditingId(subject.id);
    setName(subject.name);
    setColor(subject.color);
    setIsCreating(false);
    setError(null);
  };

  const handleStartCreate = () => {
    setEditingId(null);
    setName('');
    setColor(PRESET_THEMES[0].color);
    setIsCreating(true);
    setError(null);
  };

  const validateSubject = (subjectName: string, currentId: string | null): string | null => {
    if (!subjectName.trim()) return "Subject name cannot be empty.";
    const duplicate = subjects.find(
      s => s.name.toLowerCase() === subjectName.trim().toLowerCase() && s.id !== currentId
    );
    if (duplicate) return "Subject already exists.";
    return null;
  };

  // --- ATOMIC CRUD OPERATIONS (STRATEGY: SAVE FULL ARRAY) ---

  const handleAdd = async () => {
    const validationError = validateSubject(name, null);
    if (validationError) {
      setError(validationError);
      return;
    }

    const newSubject: Subject = {
      id: Date.now().toString(),
      name: name.trim(),
      color,
      isArchived: false,
    };

    const newList = [...subjects, newSubject];
    setSubjects(newList);
    resetForm();

    try {
      await dbService.saveSubjects(newList);
      onUpdate();
    } catch (e) {
      console.error("Failed to add subject", e);
      setSubjects(initialSubjects);
      setError("Failed to save. Please try again.");
    }
  };

  const handleEdit = async () => {
    if (!editingId) return;
    const validationError = validateSubject(name, editingId);
    if (validationError) {
      setError(validationError);
      return;
    }

    const newList = subjects.map(s => 
      s.id === editingId 
        ? { ...s, name: name.trim(), color } 
        : s
    );

    setSubjects(newList);
    resetForm();

    try {
      await dbService.saveSubjects(newList);
      onUpdate();
    } catch (e) {
      console.error("Failed to edit subject", e);
      setSubjects(initialSubjects);
      setError("Failed to save changes. Please try again.");
    }
  };

  const handleArchiveToggle = async (id: string, archive: boolean, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (archive && activeSubjects.length <= 1) {
      setError("You cannot archive your last active subject.");
      return;
    }

    const newList = subjects.map(s => s.id === id ? { ...s, isArchived: archive } : s);
    setSubjects(newList);

    try {
      await dbService.saveSubjects(newList);
      onUpdate();
    } catch (err) {
      console.error("Failed to toggle archive", err);
      setSubjects(initialSubjects);
      setError("Failed to update status. Please try again.");
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (window.confirm("Are you sure? This will permanently delete this subject and all associated statistics.")) {
      const newList = subjects.filter(s => s.id !== id);
      setSubjects(newList);

      try {
        await dbService.saveSubjects(newList);
        onUpdate();
      } catch (err) {
        console.error("Failed to delete subject", err);
        setSubjects(initialSubjects);
        setError("Failed to delete subject. Please try again.");
      }
    }
  };

  const handleSubmit = () => {
      if (isCreating) handleAdd();
      else handleEdit();
  };

  const resetForm = () => {
    setEditingId(null);
    setIsCreating(false);
    setName('');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
          <div>
            <h2 className="font-bold text-xl text-white">Manage Subjects</h2>
            <p className="text-xs text-slate-400 mt-0.5">Customize your focus categories</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-5 mt-5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto p-5 space-y-4 flex-1 custom-scrollbar">
          
          {/* Create/Edit Form */}
          {isCreating || editingId ? (
            <div className="bg-slate-800/50 p-5 rounded-2xl border border-white/10 space-y-5 animate-in slide-in-from-top-2">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Subject Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-${accent}-500 focus:ring-1 focus:ring-${accent}-500 transition-all`}
                  placeholder="e.g. Quantum Physics"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-3">Theme Color</label>
                <div className="grid grid-cols-6 gap-2 mb-4">
                  {PRESET_THEMES.map((theme) => (
                    <button
                      key={theme.color}
                      onClick={() => setColor(theme.color)}
                      className={`w-10 h-10 rounded-full transition-all flex items-center justify-center relative group ${color === theme.color ? 'ring-2 ring-white scale-110' : 'hover:scale-110'}`}
                      style={{ backgroundColor: theme.color }}
                      title={theme.name}
                    >
                      {color === theme.color && <Check size={16} className="text-white drop-shadow-md" />}
                    </button>
                  ))}
                </div>
                
                {/* Custom Color Toggle */}
                <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-white/5">
                     <div className="p-2 bg-white/5 rounded-lg">
                         <Palette size={16} className="text-slate-400" />
                     </div>
                     <span className="text-xs text-slate-300 font-medium">Custom Hex:</span>
                     <div className="relative flex-1 flex items-center justify-end">
                         <input 
                            type="color" 
                            value={color.startsWith('#') ? color : '#3b82f6'} 
                            onChange={(e) => setColor(e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0 opacity-0 absolute inset-0"
                         />
                         <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: color }} />
                            <span className="font-mono text-xs text-slate-500 uppercase">{color}</span>
                         </div>
                     </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={resetForm} 
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                    onClick={handleSubmit} 
                    className={`px-6 py-2.5 bg-${accent}-600 hover:bg-${accent}-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-${accent}-500/20 transition-all active:scale-95`}
                >
                    <Check size={16} /> {isCreating ? 'Add Subject' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
             <button
                onClick={handleStartCreate}
                className="w-full py-4 border border-dashed border-white/10 rounded-2xl text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all flex items-center justify-center gap-2 group"
              >
                <div className={`p-2 bg-${accent}-500/10 rounded-full text-${accent}-400 group-hover:bg-${accent}-500/20 transition-colors`}>
                  <Plus size={20} />
                </div>
                <span className="font-medium">Add New Subject</span>
              </button>
          )}

          {/* Active Subject List */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-2 pb-2">
                <Info size={14} className="text-slate-500" />
                <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Active Subjects ({activeSubjects.length})</span>
            </div>
            
            {activeSubjects.length === 0 && !isCreating && (
                <div className="text-center py-8 text-slate-500 text-sm">
                    No active subjects found. Add one to get started!
                </div>
            )}

            {activeSubjects.map((subject) => {
              const isHex = isHexColor(subject.color);
              return (
                <div 
                    key={subject.id} 
                    className="flex items-center justify-between p-4 bg-slate-800/30 border border-white/5 rounded-2xl hover:bg-slate-800/50 hover:border-white/10 transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div 
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${!isHex ? subject.color : ''}`} 
                            style={isHex ? { backgroundColor: subject.color, color: 'white' } : {}}
                        >
                            <span className="text-lg font-bold opacity-80">{subject.name[0]?.toUpperCase()}</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-200 group-hover:text-white transition-colors">{subject.name}</h3>
                            <p className="text-[10px] text-slate-500">
                                {PRESET_THEMES.find(t => t.color === subject.color)?.name || 'Custom Theme'}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => handleStartEdit(subject)} 
                            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title="Edit"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button 
                            onClick={(e) => handleArchiveToggle(subject.id, true, e)} 
                            className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                            title="Archive"
                        >
                            <Archive size={16} />
                        </button>
                    </div>
                </div>
              );
            })}
          </div>

          {/* Archived Subjects Section */}
          {archivedSubjects.length > 0 && (
            <div className="pt-4 border-t border-white/5">
              <button 
                onClick={() => setShowArchived(!showArchived)}
                className="flex items-center justify-between w-full px-2 py-2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Archive size={14} />
                  <span className="text-xs font-bold uppercase tracking-wider">Archived Subjects ({archivedSubjects.length})</span>
                </div>
                {showArchived ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showArchived && (
                <div className="space-y-2 mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  {archivedSubjects.map((subject) => {
                    const isHex = isHexColor(subject.color);
                    return (
                      <div 
                          key={subject.id} 
                          className="flex items-center justify-between p-4 bg-slate-900/40 border border-white/5 rounded-2xl opacity-70 hover:opacity-100 transition-all group"
                      >
                          <div className="flex items-center gap-4">
                              <div 
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center grayscale ${!isHex ? subject.color : ''}`} 
                                  style={isHex ? { backgroundColor: subject.color, color: 'white' } : {}}
                              >
                                  <span className="text-lg font-bold opacity-80">{subject.name[0]?.toUpperCase()}</span>
                              </div>
                              <div>
                                  <h3 className="font-bold text-slate-400 group-hover:text-white transition-colors">{subject.name}</h3>
                                  <p className="text-[10px] text-slate-500 italic">Archived</p>
                              </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                              <button 
                                  onClick={(e) => handleArchiveToggle(subject.id, false, e)} 
                                  className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                                  title="Restore"
                              >
                                  <RotateCcw size={16} />
                              </button>
                              <button 
                                  onClick={(e) => handleDelete(subject.id, e)} 
                                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                  title="Delete Permanently"
                              >
                                  <Trash2 size={16} />
                              </button>
                          </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
