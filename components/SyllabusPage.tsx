import React, { useState, useEffect } from 'react';
import { Subject, SyllabusSubject, SyllabusChapter, SyllabusTopic, TopicStatus } from '../types';
import { dbService } from '../services/db';
import { BookOpen, ChevronRight, ChevronDown, Check, Circle, CircleDashed, RotateCcw, Pencil, Trash2, Plus, Download, Upload, Copy, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

interface SyllabusPageProps {
  subjects: Subject[];
}

export const SyllabusPage: React.FC<SyllabusPageProps> = ({ subjects }) => {
  const { accent } = useTheme();
  const { currentUser } = useAuth();
  const [syllabusSubjects, setSyllabusSubjects] = useState<SyllabusSubject[]>([]);
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);

  // Modals
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Load Data
  const loadData = async () => {
    const data = await dbService.getSyllabusSubjects();
    setSyllabusSubjects(data);
    if (!activeSubjectId && data.length > 0) {
      setActiveSubjectId(data[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeSyllabus = syllabusSubjects.find(s => s.id === activeSubjectId);
  const activeSubjectMeta = subjects.find(s => s.id === activeSyllabus?.subjectId);

  // Stats
  let totalTopics = 0;
  let doneTopics = 0;
  syllabusSubjects.forEach(s => {
    s.chapters.forEach(c => {
      totalTopics += c.topics.length;
      doneTopics += c.topics.filter(t => t.status === 'done').length;
    });
  });
  const overallProgress = totalTopics === 0 ? 0 : Math.round((doneTopics / totalTopics) * 100);

  const saveAndRefresh = async (updatedSyllabus: SyllabusSubject) => {
    updatedSyllabus.updatedAt = Date.now();
    await dbService.saveSyllabusSubject(updatedSyllabus);
    await loadData();
  };

  // Actions
  const addSubject = async (subjectId: string) => {
    const newSub: SyllabusSubject = {
      id: crypto.randomUUID(),
      subjectId,
      chapters: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await dbService.saveSyllabusSubject(newSub);
    setShowAddSubjectModal(false);
    setActiveSubjectId(newSub.id);
    await loadData();
  };

  const addChapter = async (name: string) => {
    if (!activeSyllabus || !name.trim()) return;
    const newChapter: SyllabusChapter = {
      id: crypto.randomUUID(),
      name: name.trim(),
      topics: [],
      order: activeSyllabus.chapters.length,
      isOpen: true
    };
    const updated = {
      ...activeSyllabus,
      chapters: [...activeSyllabus.chapters, newChapter]
    };
    await saveAndRefresh(updated);
  };

  const toggleChapter = async (chapterId: string) => {
    if (!activeSyllabus) return;
    const updated = {
      ...activeSyllabus,
      chapters: activeSyllabus.chapters.map(c => c.id === chapterId ? { ...c, isOpen: !c.isOpen } : c)
    };
    await saveAndRefresh(updated);
  };

  const renameChapter = async (chapterId: string, newName: string) => {
    if (!activeSyllabus || !newName.trim()) return;
    const updated = {
      ...activeSyllabus,
      chapters: activeSyllabus.chapters.map(c => c.id === chapterId ? { ...c, name: newName.trim() } : c)
    };
    await saveAndRefresh(updated);
  };

  const deleteChapter = async (chapterId: string) => {
    if (!activeSyllabus || !confirm('Delete chapter and all its topics?')) return;
    const updated = {
      ...activeSyllabus,
      chapters: activeSyllabus.chapters.filter(c => c.id !== chapterId)
    };
    await saveAndRefresh(updated);
  };

  const addTopic = async (chapterId: string, name: string) => {
    if (!activeSyllabus || !name.trim()) return;
    const newTopic: SyllabusTopic = {
      id: crypto.randomUUID(),
      name: name.trim(),
      status: 'none',
      order: 0 // Will fix when rendering
    };
    const updated = {
      ...activeSyllabus,
      chapters: activeSyllabus.chapters.map(c => {
        if (c.id === chapterId) {
          return { ...c, topics: [...c.topics, { ...newTopic, order: c.topics.length }] };
        }
        return c;
      })
    };
    await saveAndRefresh(updated);
  };

  const cycleTopicStatus = async (chapterId: string, topicId: string, currentStatus: TopicStatus) => {
    if (!activeSyllabus) return;
    const cycleMap: Record<TopicStatus, TopicStatus> = {
      'none': 'progress',
      'progress': 'done',
      'done': 'revision',
      'revision': 'none'
    };
    const nextStatus = cycleMap[currentStatus];
    const updated = {
      ...activeSyllabus,
      chapters: activeSyllabus.chapters.map(c => {
        if (c.id === chapterId) {
          return {
            ...c,
            topics: c.topics.map(t => t.id === topicId ? { ...t, status: nextStatus } : t)
          };
        }
        return c;
      })
    };
    await saveAndRefresh(updated);
  };

  const deleteTopic = async (chapterId: string, topicId: string) => {
    if (!activeSyllabus) return;
    const updated = {
      ...activeSyllabus,
      chapters: activeSyllabus.chapters.map(c => {
        if (c.id === chapterId) {
          return { ...c, topics: c.topics.filter(t => t.id !== topicId) };
        }
        return c;
      })
    };
    await saveAndRefresh(updated);
  };

  const unaddedSubjects = subjects.filter(s => !syllabusSubjects.some(ss => ss.subjectId === s.id));

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-white/10 overflow-hidden relative">
      {/* Top Bar */}
      <div className="p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 bg-slate-900/60 backdrop-blur-xl z-20">
        <div className="flex items-center gap-3">
          <div className={`p-2 bg-${accent}-500/20 text-${accent}-400 rounded-xl`}>
            <BookOpen size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Syllabus Tracker</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                <div className={`h-full bg-${accent}-500 transition-all duration-300`} style={{ width: `${overallProgress}%` }} />
              </div>
              <span className="text-xs font-mono text-slate-400">{overallProgress}% Done</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowImportModal(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors border border-white/5">
            <Download size={16} /> Import
          </button>
          <button onClick={() => setShowExportModal(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors border border-white/5">
            <Upload size={16} /> Export
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Left Col - Subject List */}
        <div className={`w-full md:w-64 border-r border-white/10 bg-slate-900/50 flex flex-col overflow-y-auto shrink-0 ${activeSubjectId && 'hidden md:flex'}`}>
          <div className="p-4 flex flex-col gap-2">
            {syllabusSubjects.map(ss => {
              const meta = subjects.find(s => s.id === ss.subjectId);
              if (!meta) return null;
              const isActive = activeSubjectId === ss.id;
              
              let sTot = 0; let sDone = 0;
              ss.chapters.forEach(c => {
                sTot += c.topics.length;
                sDone += c.topics.filter(t => t.status === 'done').length;
              });
              const pct = sTot > 0 ? Math.round((sDone / sTot) * 100) : 0;

              return (
                <button
                  key={ss.id}
                  onClick={() => setActiveSubjectId(ss.id)}
                  className={`flex flex-col gap-2 p-3 rounded-xl transition-all border ${isActive ? `bg-${accent}-500/10 border-${accent}-500/50` : 'bg-slate-800/80 border-white/5 hover:bg-slate-800 hover:border-white/20'}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color.startsWith('#') ? meta.color : undefined }} />
                      <span className="text-sm font-semibold text-white whitespace-nowrap overflow-hidden text-ellipsis">{meta.name}</span>
                    </div>
                    <span className="text-xs font-mono text-slate-400">{pct}%</span>
                  </div>
                  <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: meta.color.startsWith('#') ? meta.color : '#3b82f6' }} />
                  </div>
                </button>
              );
            })}
            {unaddedSubjects.length > 0 && (
              <button 
                onClick={() => setShowAddSubjectModal(true)}
                className="mt-2 flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-white/20 hover:border-white/40 hover:bg-white/5 transition-all text-slate-400 hover:text-white"
              >
                <Plus size={16} /> Add Subject
              </button>
            )}
          </div>
        </div>

        {/* Right Col - Chapter Tree */}
        <div className={`flex-1 flex flex-col bg-slate-900 ${!activeSubjectId && 'hidden md:flex'}`}>
          {activeSyllabus && activeSubjectMeta ? (
            <>
              {/* Mobile Back Button */}
              <div className="md:hidden p-4 border-b border-white/10 bg-slate-900/80 sticky top-0 z-10 flex items-center gap-2">
                <button onClick={() => setActiveSubjectId(null)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white">
                  <ChevronRight size={20} className="rotate-180" />
                </button>
                <span className="font-semibold text-white">{activeSubjectMeta.name} Chapters</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24">
                <div className="flex flex-col gap-3 max-w-3xl mx-auto">
                  {/* Delete Subject Button */}
                  <div className="flex justify-end mb-2">
                     <button onClick={async () => {
                         if (confirm('Remove this subject from syllabus tracker?')) {
                             await dbService.deleteSyllabusSubject(activeSyllabus.id);
                             setActiveSubjectId(null);
                             loadData();
                         }
                     }} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 opacity-70 hover:opacity-100">
                         <Trash2 size={12} /> Remove Subject from Syllabus
                     </button>
                  </div>

                  {activeSyllabus.chapters.map(chapter => (
                    <div key={chapter.id} className="bg-slate-800/50 border border-white/5 rounded-xl overflow-hidden">
                      <div className="flex items-center gap-2 p-3 hover:bg-white/5 group border-b border-white/5">
                        <button onClick={() => toggleChapter(chapter.id)} className="p-1 text-slate-400 hover:text-white transition-all">
                          <ChevronRight size={18} className={`transition-transform ${chapter.isOpen ? 'rotate-90' : ''}`} />
                        </button>
                        <span className="font-semibold text-slate-200 flex-1" 
                              onDoubleClick={() => {
                                const newName = prompt('Rename chapter:', chapter.name);
                                if (newName) renameChapter(chapter.id, newName);
                              }}>
                          {chapter.name}
                        </span>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => {
                                const newName = prompt('Rename chapter:', chapter.name);
                                if (newName) renameChapter(chapter.id, newName);
                            }} className="p-1.5 text-slate-400 hover:text-emerald-400">
                                <Pencil size={14} />
                            </button>
                            <button onClick={() => deleteChapter(chapter.id)} className="p-1.5 text-slate-400 hover:text-red-400">
                                <Trash2 size={14} />
                            </button>
                        </div>
                        <div className="px-2 py-0.5 rounded-full bg-slate-900 border border-white/10 text-xs font-mono text-slate-400">
                          {chapter.topics.filter(t => t.status === 'done').length}/{chapter.topics.length}
                        </div>
                      </div>

                      <AnimatePresence>
                        {chapter.isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-slate-900/30 pl-10 pr-3 py-2 flex flex-col gap-1"
                          >
                            {chapter.topics.map(topic => {
                              const StatusIcon = () => {
                                if (topic.status === 'done') return <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0"><Check size={12} className="text-white" /></div>;
                                if (topic.status === 'progress') return <div className="w-5 h-5 rounded-full border-2 border-blue-500 bg-blue-500/20 shrink-0" />;
                                if (topic.status === 'revision') return <div className="w-5 h-5 rounded-full border-2 border-amber-500 bg-amber-500/10 flex items-center justify-center shrink-0"><RotateCcw size={10} className="text-amber-500" /></div>;
                                return <div className="w-5 h-5 rounded-full border-2 border-slate-600 bg-transparent shrink-0" />;
                              };

                              return (
                                <div key={topic.id} className="flex items-center gap-3 py-2 px-2 hover:bg-white/5 rounded-lg group">
                                  <button onClick={() => cycleTopicStatus(chapter.id, topic.id, topic.status)} className="flex items-center gap-3 flex-1 text-left">
                                    <StatusIcon />
                                    <span className={`text-sm ${topic.status === 'done' ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                                      {topic.name}
                                    </span>
                                  </button>
                                  <button onClick={() => deleteTopic(chapter.id, topic.id)} className="p-1.5 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              );
                            })}
                            <div className="mt-2 mb-1">
                               <AddInlineInput placeholder="Add topic..." onSave={(val) => addTopic(chapter.id, val)} />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}

                  <div className="mt-4">
                     <AddInlineInput placeholder="Add new chapter..." onSave={(val) => addChapter(val)} />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-6 text-center">
               <BookOpen size={48} className="mb-4 opacity-20" />
               <p>Select a subject from the left to view its syllabus.</p>
               <p className="text-sm mt-2 opacity-70">Or add a new subject to start tracking.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Subject Modal */}
      <AnimatePresence>
        {showAddSubjectModal && (
          <Modal onClose={() => setShowAddSubjectModal(false)} title="Add Subject">
            <div className="flex flex-col gap-2">
              {unaddedSubjects.map(s => (
                <button
                  key={s.id}
                  onClick={() => addSubject(s.id)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-800 border border-white/5 hover:border-white/20 transition-all text-left"
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color.startsWith('#') ? s.color : undefined }} />
                  <span className="font-medium text-white">{s.name}</span>
                </button>
              ))}
              {unaddedSubjects.length === 0 && (
                 <p className="text-slate-400 text-center py-4 text-sm">All subjects have been added to the syllabus!</p>
              )}
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <ImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} onImport={loadData} subjects={subjects} />
      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} syllabusSubjects={syllabusSubjects} />
    </div>
  );
};

// Inline Input Helper
const AddInlineInput = ({ placeholder, onSave }: { placeholder: string, onSave: (val: string) => void }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [val, setVal] = useState('');

    if (!isAdding) {
        return (
            <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors">
                <Plus size={14} /> {placeholder}
            </button>
        );
    }
    return (
        <form onSubmit={(e) => { e.preventDefault(); if (val.trim()) { onSave(val); setVal(''); setIsAdding(false); } }} className="flex items-center gap-2">
            <input 
                autoFocus
                type="text"
                value={val}
                onChange={e => setVal(e.target.value)}
                onBlur={() => { if (!val.trim()) setIsAdding(false); }}
                placeholder={placeholder}
                className="bg-slate-950 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white w-full max-w-[300px] outline-none focus:border-blue-500"
            />
            <button type="submit" className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-sm font-medium transition-colors">Save</button>
        </form>
    );
};

// Generic Modal Base
const Modal = ({ children, onClose, title }: { children: React.ReactNode, onClose: () => void, title: string }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={e => e.stopPropagation()}
            className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
        >
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20} /></button>
            <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
            {children}
        </motion.div>
    </div>
);

// Import Modal
const ImportModal = ({ isOpen, onClose, onImport, subjects }: { isOpen: boolean, onClose: () => void, onImport: () => void, subjects: Subject[] }) => {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { accent } = useTheme();

    const handleImport = async () => {
        if (!input.trim()) return;
        setLoading(true); setError('');
        try {
            let data: any = null;
            if (input.trim().startsWith('EKA-')) {
                const docRef = doc(db, 'shared_syllabuses', input.trim());
                const snap = await getDoc(docRef);
                if (!snap.exists()) throw new Error('Share code not found');
                data = snap.data();
            } else {
                data = JSON.parse(input);
            }
            
            if (!data || !data.subjects || !Array.isArray(data.subjects)) throw new Error('Invalid syllabus format');

            // Map imported subjects to existing user subjects
            const existingSyllabus = await dbService.getSyllabusSubjects();
            
            for (const impSub of data.subjects) {
                // Find matching subject by ID or Name
                const matchedSubject = subjects.find(s => s.name.toLowerCase() === impSub.name?.toLowerCase());
                if (matchedSubject) {
                    // Check if we already have a syllabus entry for it
                    if (!existingSyllabus.some(es => es.subjectId === matchedSubject.id)) {
                        const newSyllabus: SyllabusSubject = {
                            id: crypto.randomUUID(),
                            subjectId: matchedSubject.id,
                            chapters: impSub.chapters.map((c: any) => ({
                                id: crypto.randomUUID(),
                                name: c.name,
                                order: c.order || 0,
                                isOpen: true,
                                topics: c.topics.map((t: any) => ({
                                    id: crypto.randomUUID(),
                                    name: t.name,
                                    status: 'none',
                                    order: t.order || 0
                                }))
                            })),
                            createdAt: Date.now(),
                            updatedAt: Date.now()
                        };
                        await dbService.saveSyllabusSubject(newSyllabus);
                    }
                }
            }
            onImport();
            onClose();
            setInput('');
        } catch (e: any) {
            setError(e.message || 'Failed to parse JSON or fetch code');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;
    return (
        <Modal onClose={onClose} title="Import Syllabus">
            <div className="flex flex-col gap-4">
                <textarea 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Paste share code (EKA-XXXXXXXX) or JSON..."
                    className="w-full h-32 bg-slate-950 border border-white/10 rounded-xl p-3 text-sm text-white resize-none outline-none focus:border-white/30 font-mono"
                />
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button 
                    disabled={loading || !input.trim()}
                    onClick={handleImport}
                    className={`w-full py-3 rounded-xl font-bold bg-${accent}-500 hover:bg-${accent}-600 text-white transition-colors disabled:opacity-50 flex justify-center items-center`}
                >
                    {loading ? 'Importing...' : 'Import'}
                </button>
            </div>
        </Modal>
    );
};

// Export Modal
const ExportModal = ({ isOpen, onClose, syllabusSubjects }: { isOpen: boolean, onClose: () => void, syllabusSubjects: SyllabusSubject[] }) => {
    const { currentUser } = useAuth();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const { accent } = useTheme();

    useEffect(() => {
        if (isOpen) {
            setCode('');
            generateAndUpload();
        }
    }, [isOpen]);

    const generateAndUpload = async () => {
        setLoading(true);
        try {
            const newCode = 'EKA-' + Math.random().toString(36).substring(2, 10).toUpperCase();
            
            // Enrich subjects with names for export compatibility
            const enrichedSubjects = await Promise.all(syllabusSubjects.map(async ss => {
                const subs = await dbService.getSubjects();
                const matched = subs.find(s => s.id === ss.subjectId);
                return {
                    name: matched?.name || 'Unknown Subject',
                    chapters: ss.chapters
                };
            }));

            const template = {
                name: "Exported Syllabus",
                exam: "Custom",
                createdBy: currentUser?.uid || 'guest',
                createdAt: serverTimestamp(),
                subjects: enrichedSubjects
            };

            await setDoc(doc(db, 'shared_syllabuses', newCode), template);
            setCode(newCode);
        } catch (e) {
            console.error("Export failed", e);
        } finally {
            setLoading(false);
        }
    };

    const downloadJson = async () => {
        // Enriched JSON for file download
        const enrichedSubjects = await Promise.all(syllabusSubjects.map(async ss => {
            const subs = await dbService.getSubjects();
            const matched = subs.find(s => s.id === ss.subjectId);
            return {
                name: matched?.name || 'Unknown Subject',
                chapters: ss.chapters
            };
        }));
        
        const template = {
            name: "Exported Syllabus",
            subjects: enrichedSubjects
        };

        const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `syllabus_export.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (!isOpen) return null;
    return (
        <Modal onClose={onClose} title="Export Syllabus">
            <div className="flex flex-col gap-4 items-center">
                <div className="p-4 bg-slate-950 border border-white/10 rounded-xl w-full text-center">
                    <p className="text-sm text-slate-400 mb-2">Share Code</p>
                    {loading ? (
                        <div className="h-8 animate-pulse bg-white/5 rounded mx-auto w-48" />
                    ) : (
                        <div className="flex items-center justify-center gap-3">
                            <span className="text-2xl font-mono font-bold text-white tracking-wider">{code}</span>
                            <button 
                                onClick={() => navigator.clipboard.writeText(code)}
                                className="p-1.5 text-slate-400 hover:text-white bg-white/5 rounded-lg transition-colors"
                            >
                                <Copy size={16} />
                            </button>
                        </div>
                    )}
                </div>
                <p className="text-sm text-center text-slate-400">
                    Share this code on Reddit or WhatsApp so others can import your syllabus!
                </p>
                <button 
                    onClick={downloadJson}
                    className="w-full py-3 mt-2 rounded-xl font-bold bg-white/10 hover:bg-white/15 text-white transition-colors border border-white/5 flex items-center justify-center gap-2"
                >
                    <Download size={18} /> Download as JSON
                </button>
            </div>
        </Modal>
    );
};
