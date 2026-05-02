import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import { Subject, SyllabusSubject, SyllabusChapter, SyllabusTopic, TopicStatus } from '../types';
import { BookOpen, Plus, Trash2, ChevronDown, ChevronRight, Check, Download, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { PREBUILT_SYLLABUSES } from '../utils/syllabusPresets';
import { db } from '../services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface SyllabusPageProps {
  subjects: Subject[];
}

export const SyllabusPage: React.FC<SyllabusPageProps> = ({ subjects }) => {
  const [syllabusSubjects, setSyllabusSubjects] = useState<SyllabusSubject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'subjects' | 'chapters'>('subjects');
  const [loading, setLoading] = useState(true);
  
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const { accentColor } = useTheme();

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCode, setShareCode] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  const handleExport = async () => {
    const userId = dbService.getUserId();
    if (!userId) {
      alert('Please sign in to export your syllabus and get a share code.');
      return;
    }
    
    if (syllabusSubjects.length === 0) {
      alert('No syllabus to export!');
      return;
    }
    setExportLoading(true);
    try {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      const code = 'EKA-' + Array.from({ length: 8 }, () => 
        chars[Math.floor(Math.random() * chars.length)]
      ).join('');
  
      await setDoc(doc(db, 'shared_syllabuses', code), {
        code,
        syllabusSubjects,
        createdAt: Date.now(),
        createdBy: dbService.getUserId() || 'guest'
      });
  
      setShareCode(code);
      setShowShareModal(true);
    } catch (e) {
      console.error('Export failed:', e);
      alert('Export failed. Please try again.');
    }
    setExportLoading(false);
  };

  const loadSyllabus = async () => {
    setLoading(true);
    const data = await dbService.getSyllabusSubjects();
    setSyllabusSubjects(data);
    setLoading(false);
  };

  useEffect(() => {
    loadSyllabus();
  }, []);

  const handleAddSubject = async (subjectId: string) => {
    const newSub: SyllabusSubject = {
      id: Date.now().toString(),
      subjectId,
      chapters: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await dbService.saveSyllabusSubject(newSub);
    setShowAddSubject(false);
    setSelectedId(newSub.id);
    await loadSyllabus();
  };

  const handleDeleteSubject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to remove this subject from syllabus?')) {
      await dbService.deleteSyllabusSubject(id);
      if (selectedId === id) setSelectedId(null);
      await loadSyllabus();
    }
  };

  const selectedSyllabus = syllabusSubjects.find(s => s.id === selectedId);

  const calculateProgress = (chapters: SyllabusChapter[]) => {
    let total = 0;
    let done = 0;
    chapters.forEach(ch => {
      total += ch.topics.length;
      done += ch.topics.filter(t => t.status === 'done').length;
    });
    return total === 0 ? 0 : Math.round((done / total) * 100);
  };

  const overallProgress = () => {
    let total = 0;
    let done = 0;
    syllabusSubjects.forEach(s => {
      s.chapters.forEach(ch => {
        total += ch.topics.length;
        done += ch.topics.filter(t => t.status === 'done').length;
      });
    });
    return total === 0 ? 0 : Math.round((done / total) * 100);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/40 backdrop-blur-sm rounded-3xl border border-white/10 overflow-hidden">
      {/* Top Bar */}
      <div className="p-4 md:p-6 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-${accentColor}-500/20 text-${accentColor}-400`}>
              <BookOpen size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Syllabus Tracker</h2>
              <p className="text-sm text-slate-400 hidden sm:block">Track your course progression</p>
            </div>
          </div>
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={handleExport}
              disabled={exportLoading}
              className={`p-2 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10 ${exportLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Upload size={18} />
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className={`p-2 rounded-lg bg-${accentColor}-500/20 text-${accentColor}-300 hover:bg-${accentColor}-500/30 transition-colors`}
            >
              <Download size={18} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex-1 sm:w-48">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Overall Progress</span>
              <span className="text-emerald-400 font-medium">{overallProgress()}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                style={{ width: `${overallProgress()}%` }}
              />
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={exportLoading}
              className={`px-3 py-1.5 flex items-center gap-1.5 text-sm font-medium rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 transition-colors whitespace-nowrap border border-white/10 ${exportLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Upload size={16} />
              <span>{exportLoading ? 'Exporting...' : 'Export'}</span>
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className={`px-3 py-1.5 flex items-center gap-1.5 text-sm font-medium rounded-lg bg-${accentColor}-500/20 text-${accentColor}-300 hover:bg-${accentColor}-500/30 transition-colors whitespace-nowrap`}
            >
              <Download size={16} />
              <span>Import</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400">Loading syllabus...</div>
      ) : (
        <div className="flex flex-1 min-h-0 md:overflow-hidden flex-col md:flex-row">
          {/* Left Column: Subjects List */}
          <div className={`w-full md:w-64 lg:w-72 md:border-r border-white/10 overflow-y-auto bg-black/20 p-3 md:p-4 md:flex-shrink-0 ${mobileView === 'subjects' ? 'flex flex-col flex-1 min-h-0 md:flex-none' : 'hidden md:flex md:flex-col'}`}>
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="font-medium text-slate-300 px-1">Subjects</h3>
              <button 
                onClick={() => setShowAddSubject(true)}
                className={`hidden md:block p-1.5 rounded-lg bg-${accentColor}-500/20 text-${accentColor}-400 hover:bg-${accentColor}-500/30 transition-colors mr-1`}
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-2 px-1">
              {syllabusSubjects.length === 0 ? (
                <div className="text-sm text-slate-500 text-center py-4 w-full">No subjects added yet.</div>
              ) : (
                syllabusSubjects.map(s => {
                  const baseSub = subjects.find(bs => bs.id === s.subjectId);
                  const isSelected = selectedId === s.id;
                  const progress = calculateProgress(s.chapters);
                  
                  return (
                    <div 
                      key={s.id}
                      onClick={() => { setSelectedId(s.id); setMobileView('chapters'); }}
                      className={`group p-2.5 md:p-3 rounded-xl cursor-pointer transition-all w-full flex flex-col justify-between ${
                        isSelected 
                          ? `bg-${accentColor}-500/10 border border-${accentColor}-500/30` 
                          : 'bg-white/5 border border-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3 md:mb-2">
                        <span className={`font-medium text-sm ${isSelected ? 'text-white' : 'text-slate-300'} line-clamp-1`}>
                          {baseSub?.name || 'Unknown Subject'}
                        </span>
                        <button 
                          onClick={(e) => handleDeleteSubject(s.id, e)}
                          className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-red-500 md:text-red-400 hover:text-red-300 transition-opacity ml-2 shrink-0 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-auto">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${progress === 100 ? 'bg-emerald-500' : `bg-${accentColor}-500`}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400">{progress}%</span>
                      </div>
                    </div>
                  );
                })
              )}
              <button
                onClick={() => setShowAddSubject(true)}
                className="md:hidden w-full mt-2 p-3 rounded-xl border border-dashed border-white/20 text-slate-400 text-sm flex items-center justify-center gap-2 hover:border-white/30 hover:text-slate-300 transition-colors"
              >
                <Plus size={16} /> Add Subject
              </button>
            </div>
          </div>

          {/* Right Column: Chapters & Topics */}
          <div className={`flex-1 min-h-0 overflow-y-auto p-4 md:p-6 pb-32 md:pb-6 ${mobileView === 'chapters' && selectedId ? 'block' : 'hidden md:block'}`}>
            {selectedSyllabus ? (
              <>
                <button
                  onClick={() => setMobileView('subjects')}
                  className="md:hidden flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium mb-4 transition-colors"
                >
                  ← Back to Subjects
                </button>
                <h3 className="md:hidden text-lg font-bold text-white mb-4">
                  {subjects.find(s => s.id === selectedSyllabus?.subjectId)?.name || 'Syllabus'}
                </h3>
                <SyllabusDetail 
                  syllabus={selectedSyllabus} 
                  loadSyllabus={loadSyllabus} 
                  accentColor={accentColor} 
                />
              </>
            ) : (
              <div className="h-full hidden md:flex items-center justify-center text-slate-500 flex-col gap-3">
                <BookOpen size={48} className="opacity-20" />
                <p>Select a subject to view its syllabus</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      <AnimatePresence>
        {showAddSubject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddSubject(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-slate-900 border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-4 border-b border-white/10">
                <h3 className="font-bold text-white text-lg">Add to Syllabus</h3>
              </div>
              <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
                {subjects
                  .filter(sub => !syllabusSubjects.some(s => s.subjectId === sub.id))
                  .map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => handleAddSubject(sub.id)}
                      className="w-full text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
                    >
                      {sub.name}
                    </button>
                  ))}
                  {subjects.filter(sub => !syllabusSubjects.some(s => s.subjectId === sub.id)).length === 0 && (
                    <div className="text-center text-slate-400 py-4 text-sm">
                      All subjects are already in the tracker.
                    </div>
                  )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full"
            >
              <h3 className="text-lg font-bold text-white mb-2">Syllabus Exported!</h3>
              <p className="text-slate-400 text-sm mb-4">
                Share this code so others can import your syllabus instantly.
              </p>
              
              <div className="bg-black/40 border border-white/10 rounded-xl p-4 text-center mb-4">
                <span className="font-mono text-2xl font-bold text-emerald-400 tracking-widest">
                  {shareCode}
                </span>
              </div>
              
              <button
                onClick={() => navigator.clipboard.writeText(shareCode)}
                className="w-full py-2.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl font-medium mb-3 hover:bg-emerald-500/30 transition-colors"
              >
                Copy Code
              </button>
              
              <p className="text-xs text-slate-500 text-center mb-4">
                Share on WhatsApp, Telegram, or Reddit so others can import it!
              </p>
              
              <button
                onClick={() => setShowShareModal(false)}
                className="w-full py-2.5 bg-white/5 text-slate-400 rounded-xl font-medium hover:bg-white/10 transition-colors"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ImportPresetsModal 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)}
        subjects={subjects}
        loadSyllabus={loadSyllabus}
        accentColor={accentColor}
      />
    </div>
  );
};

const ImportPresetsModal = ({
  isOpen,
  onClose,
  subjects,
  loadSyllabus,
  accentColor
}: {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  loadSyllabus: () => void;
  accentColor: string;
}) => {
  const [importing, setImporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'preset'>('code');
  const [importCode, setImportCode] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');

  const handleImportCode = async () => {
    const code = importCode.trim().toUpperCase();
    if (!code) return;
    
    setImportLoading(true);
    setImportError('');
    
    try {
      const snap = await getDoc(doc(db, 'shared_syllabuses', code));
      
      if (!snap.exists()) {
        setImportError('Code not found. Please check and try again.');
        setImportLoading(false);
        return;
      }
      
      const data = snap.data();
      const imported: SyllabusSubject[] = data.syllabusSubjects || [];
      
      for (const sub of imported) {
        const newSub: SyllabusSubject = {
          ...sub,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          chapters: sub.chapters.map(ch => ({
            ...ch,
            id: crypto.randomUUID(),
            topics: ch.topics.map(t => ({
              ...t,
              id: crypto.randomUUID(),
              status: 'none' as TopicStatus
            }))
          }))
        };
        await dbService.saveSyllabusSubject(newSub);
      }
      
      await loadSyllabus();
      onClose();
      setImportCode('');
    } catch (e) {
      console.error('Import failed:', e);
      setImportError('Import failed. Please try again.');
    }
    setImportLoading(false);
  };

  const handleImport = async (presetKey: 'jee' | 'neet') => {
    setImporting(true);
    const preset = PREBUILT_SYLLABUSES[presetKey];
    
    for (const presetSub of preset.subjects) {
      // Find matching subject by name (case insensitive)
      const existingMatch = subjects.find(s => s.name.toLowerCase() === presetSub.name.toLowerCase());
      const mappedSubjectId = existingMatch ? existingMatch.id : `preset_${presetSub.name.toLowerCase()}`;
      
      const newSyllabus: SyllabusSubject = {
        id: crypto.randomUUID(),
        subjectId: mappedSubjectId,
        chapters: presetSub.chapters.map((ch: any, index: number) => ({
          id: crypto.randomUUID(),
          name: ch.name,
          topics: ch.topics.map((t: any, tIndex: number) => ({ ...t, id: crypto.randomUUID(), order: tIndex })), // ensure fresh IDs
          order: index
        })),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      await dbService.saveSyllabusSubject(newSyllabus);
    }
    
    await loadSyllabus();
    setImporting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden"
      >
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-${accentColor}-500/20 text-${accentColor}-400`}>
              <Download size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Import Syllabus</h3>
              <p className="text-xs text-slate-400">Import your syllabus right away.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="flex border-b border-white/10">
          <button 
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'code' ? `text-${accentColor}-400 border-b-2 border-${accentColor}-500 bg-white/5` : 'text-slate-400 hover:bg-white/5'}`}
            onClick={() => setActiveTab('code')}
          >
            Enter Code
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'preset' ? `text-${accentColor}-400 border-b-2 border-${accentColor}-500 bg-white/5` : 'text-slate-400 hover:bg-white/5'}`}
            onClick={() => setActiveTab('preset')}
          >
            Browse Presets
          </button>
        </div>

        <div className="p-5 space-y-4">
          {activeTab === 'code' ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-300">Enter a share code below to import syllabus structure.</p>
              <div>
                <input 
                  type="text" 
                  value={importCode}
                  onChange={(e) => setImportCode(e.target.value.toUpperCase())}
                  placeholder="Enter share code (e.g. EKA-ABCD1234)"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-white/20 font-mono tracking-wide"
                />
                {importError && (
                  <p className="text-red-400 text-xs mt-2">{importError}</p>
                )}
              </div>
              <button 
                onClick={handleImportCode}
                disabled={importLoading || !importCode.trim()}
                className={`w-full py-2.5 rounded-xl font-medium transition-all ${
                  importLoading || !importCode.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : `bg-${accentColor}-600 hover:bg-${accentColor}-500 text-white shadow-lg shadow-${accentColor}-500/20`
                }`}
              >
                {importLoading ? 'Importing...' : 'Import'}
              </button>
            </div>
          ) : (
            <>
              <h4 className="text-sm font-medium text-slate-400 mb-2">Prebuilt Presets</h4>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {/* JEE Preset */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col pt-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transition-transform group-hover:scale-110">
                <BookOpen size={80} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">JEE</h3>
              <p className="text-sm text-slate-400 mb-4">{PREBUILT_SYLLABUSES.jee.subjects.length} Subjects</p>
              
              <div className="space-y-1 mb-6 text-xs text-slate-500 flex-1">
                {PREBUILT_SYLLABUSES.jee.subjects.map(s => (
                  <div key={s.name} className="flex justify-between">
                    <span>{s.name}</span>
                    <span className="text-slate-400 font-medium">{s.chapters.length} ch</span>
                  </div>
                ))}
              </div>
              
              <button 
                onClick={() => handleImport('jee')}
                disabled={importing}
                className={`w-full py-2.5 rounded-lg font-medium transition-all ${
                  importing 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : `bg-${accentColor}-600 hover:bg-${accentColor}-500 text-white shadow-lg shadow-${accentColor}-500/20`
                }`}
              >
                {importing ? 'Importing...' : 'Import JEE Syllabus'}
              </button>
            </div>

            {/* NEET Preset */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col pt-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transition-transform group-hover:scale-110">
                <BookOpen size={80} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">NEET</h3>
              <p className="text-sm text-slate-400 mb-4">{PREBUILT_SYLLABUSES.neet.subjects.length} Subjects</p>
              
              <div className="space-y-1 mb-6 text-xs text-slate-500 flex-1">
                {PREBUILT_SYLLABUSES.neet.subjects.map(s => (
                  <div key={s.name} className="flex justify-between">
                    <span>{s.name}</span>
                    <span className="text-slate-400 font-medium">{s.chapters.length} ch</span>
                  </div>
                ))}
              </div>
              
              <button 
                onClick={() => handleImport('neet')}
                disabled={importing}
                className={`w-full py-2.5 rounded-lg font-medium transition-all ${
                  importing 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : `bg-${accentColor}-600 hover:bg-${accentColor}-500 text-white shadow-lg shadow-${accentColor}-500/20`
                }`}
              >
                {importing ? 'Importing...' : 'Import NEET Syllabus'}
              </button>
            </div>
          </div>
          
          <p className="text-xs text-center text-slate-500 mt-2">
            Importing a preset will add new subjects to your tracker. Existing tracker progress will not be overwritten.
          </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const SyllabusDetail = ({ 
  syllabus, 
  loadSyllabus, 
  accentColor 
}: { 
  syllabus: SyllabusSubject; 
  loadSyllabus: () => void;
  accentColor: string;
}) => {
  const [newChapter, setNewChapter] = useState('');

  const handleAddChapter = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newChapter.trim()) {
      const chapter: SyllabusChapter = {
        id: Date.now().toString(),
        name: newChapter.trim(),
        topics: [],
        order: syllabus.chapters.length
      };
      const updated = { ...syllabus, chapters: [...syllabus.chapters, chapter], updatedAt: Date.now() };
      await dbService.saveSyllabusSubject(updated);
      setNewChapter('');
      await loadSyllabus();
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (confirm('Delete this chapter?')) {
      const updated = { 
        ...syllabus, 
        chapters: syllabus.chapters.filter(c => c.id !== chapterId),
        updatedAt: Date.now()
      };
      await dbService.saveSyllabusSubject(updated);
      await loadSyllabus();
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="space-y-4">
        {syllabus.chapters.map(chapter => (
          <ChapterView 
            key={chapter.id} 
            chapter={chapter} 
            syllabus={syllabus} 
            onDelete={() => handleDeleteChapter(chapter.id)}
            loadSyllabus={loadSyllabus}
            accentColor={accentColor}
          />
        ))}
      </div>

      <div className="mt-6 flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus-within:border-white/20 transition-colors">
        <Plus size={18} className="text-slate-400" />
        <input 
          type="text"
          value={newChapter}
          onChange={e => setNewChapter(e.target.value)}
          onKeyDown={handleAddChapter}
          placeholder="Add chapter (Press Enter)"
          className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-slate-500 text-sm"
        />
      </div>
    </div>
  );
};

const ChapterView = ({ 
  chapter, 
  syllabus, 
  onDelete, 
  loadSyllabus,
  accentColor
}: { 
  key?: string;
  chapter: SyllabusChapter; 
  syllabus: SyllabusSubject; 
  onDelete: () => Promise<void> | void;
  loadSyllabus: () => void;
  accentColor: string;
}) => {
  const [expanded, setExpanded] = useState(true);
  const [newTopic, setNewTopic] = useState('');

  const progress = chapter.topics.length === 0 ? 0 : 
    Math.round((chapter.topics.filter(t => t.status === 'done').length / chapter.topics.length) * 100);

  const handleAddTopic = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTopic.trim()) {
      const topic: SyllabusTopic = {
        id: Date.now().toString(),
        name: newTopic.trim(),
        status: 'none',
        order: chapter.topics.length
      };
      const updatedChapters = syllabus.chapters.map(c => 
        c.id === chapter.id ? { ...c, topics: [...c.topics, topic] } : c
      );
      await dbService.saveSyllabusSubject({ ...syllabus, chapters: updatedChapters, updatedAt: Date.now() });
      setNewTopic('');
      await loadSyllabus();
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    const updatedChapters = syllabus.chapters.map(c => 
      c.id === chapter.id ? { ...c, topics: c.topics.filter(t => t.id !== topicId) } : c
    );
    await dbService.saveSyllabusSubject({ ...syllabus, chapters: updatedChapters, updatedAt: Date.now() });
    await loadSyllabus();
  };

  const handleToggleStatus = async (topic: SyllabusTopic) => {
    const statusCycle: Record<TopicStatus, TopicStatus> = {
      'none': 'progress',
      'progress': 'done',
      'done': 'revision',
      'revision': 'none'
    };
    const newStatus = statusCycle[topic.status];
    
    const updatedChapters = syllabus.chapters.map(c => 
      c.id === chapter.id 
        ? { ...c, topics: c.topics.map(t => t.id === topic.id ? { ...t, status: newStatus } : t) }
        : c
    );
    await dbService.saveSyllabusSubject({ ...syllabus, chapters: updatedChapters, updatedAt: Date.now() });
    await loadSyllabus();
  };

  const getStatusColor = (status: TopicStatus) => {
    switch (status) {
      case 'none': return 'border-slate-600 bg-transparent';
      case 'progress': return 'border-amber-500 bg-amber-500/20';
      case 'done': return 'border-emerald-500 bg-emerald-500';
      case 'revision': return 'border-purple-500 bg-purple-500/20';
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <div 
        className="flex items-center justify-between p-3 md:p-4 cursor-pointer hover:bg-white/5 transition-colors group"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="text-slate-400">
            {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>
          <h4 className="font-medium text-white">{chapter.name}</h4>
          <span className="text-xs text-slate-500 px-2 py-0.5 rounded-full bg-black/20">
            {progress}%
          </span>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="text-slate-500/50 hover:text-red-400 p-1 transition-all flex-shrink-0"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden border-t border-white/5"
          >
            <div className="p-3 md:p-4 bg-black/10 space-y-2">
              {chapter.topics.map(topic => (
                <div key={topic.id} className="flex items-center justify-between group p-2.5 md:p-2 rounded-lg hover:bg-white/5 active:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3 w-full">
                    <button 
                      onClick={() => handleToggleStatus(topic)}
                      className={`w-6 h-6 md:w-5 md:h-5 rounded-md border-2 flex shrink-0 items-center justify-center transition-colors ${getStatusColor(topic.status)}`}
                    >
                      {topic.status === 'done' && <Check size={12} className="text-white" />}
                    </button>
                    <span className={`text-sm break-words flex-1 ${topic.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                      {topic.name}
                    </span>
                    {topic.status !== 'none' && topic.status !== 'done' && (
                      <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md shrink-0 ${
                        topic.status === 'progress' ? 'bg-amber-500/20 text-amber-400' : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {topic.status}
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => handleDeleteTopic(topic.id)}
                    className="text-slate-500/50 hover:text-red-400 p-1.5 transition-all flex-shrink-0 ml-2"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              <div className="flex items-center gap-2 pl-2 pr-4 py-3 md:py-2 mt-2 border-t border-white/5">
                <Plus size={16} className="text-slate-500 flex-shrink-0" />
                <input 
                  type="text"
                  value={newTopic}
                  onChange={e => setNewTopic(e.target.value)}
                  onKeyDown={handleAddTopic}
                  placeholder="Add topic (Press Enter)"
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-slate-600 text-sm"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
