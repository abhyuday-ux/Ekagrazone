import React, { useMemo } from 'react';
import { StudySession, Subject } from '../types';
import { motion } from 'framer-motion';

interface FocusGardenProps {
  sessions: StudySession[];
  subjects: Subject[];
}

export const FocusGarden: React.FC<FocusGardenProps> = ({ sessions, subjects }) => {
  const subjectMap = useMemo(() => {
    const map: Record<string, Subject> = {};
    subjects.forEach(s => map[s.id] = s);
    return map;
  }, [subjects]);

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [sessions]);

  // Grid generation
  const { N, gridTiles } = useMemo(() => {
    let currentN = 7;
    let plots = [];
    let paths = [];

    // Find required N
    while (true) {
      plots = [];
      paths = [];
      const center = (currentN - 1) / 2;

      for (let x = 0; x < currentN; x++) {
        for (let y = 0; y < currentN; y++) {
          // Create a city block pattern: paths every 3rd tile
          const isPath = x % 3 === 0 || y % 3 === 0;
          const dist = Math.sqrt(Math.pow(x - center, 2) + Math.pow(y - center, 2));
          if (isPath) {
            paths.push({ x, y, dist, type: 'path' });
          } else {
            plots.push({ x, y, dist, type: 'plot' });
          }
        }
      }

      if (plots.length >= sortedSessions.length) {
        break;
      }
      currentN++;
    }

    // Sort plots from center outwards
    plots.sort((a, b) => a.dist - b.dist);

    const tiles: any[] = [];

    // Add paths
    paths.forEach(p => {
      tiles.push({ ...p, renderType: 'path', id: `path-${p.x}-${p.y}` });
    });

    // Add plots (filled or empty)
    plots.forEach((p, i) => {
      if (i < sortedSessions.length) {
        const session = sortedSessions[i];
        const durationMinutes = session.durationMs / (1000 * 60);
        
        // Pseudo-random choice between building and plant based on session ID
        // Mix it up so it looks like a city with parks
        const charCode0 = session.id.charCodeAt(0) || 0;
        const charCode1 = session.id.charCodeAt(1) || 0;
        const isBuilding = charCode0 % 2 === 0;

        const subject = subjectMap[session.subjectId];
        const color = subject ? subject.color : 'emerald';

        let size = 1;
        if (durationMinutes >= 60) size = 4;
        else if (durationMinutes >= 25) size = 3;
        else if (durationMinutes >= 10) size = 2;

        let buildingType = 'residential';
        if (isBuilding) {
           const bTypes = ['residential', 'commercial', 'skyscraper', 'industrial'];
           buildingType = bTypes[charCode1 % bTypes.length];
        }

        let plantType = 'sprout';
        if (!isBuilding) {
            if (size === 4) {
                const pTypes = ['oak', 'pine', 'palm'];
                plantType = pTypes[charCode1 % pTypes.length];
            } else if (size === 3) {
                const pTypes = ['flower', 'sunflower', 'rose'];
                plantType = pTypes[charCode1 % pTypes.length];
            } else if (size === 2) {
                const pTypes = ['bush', 'cactus', 'fern'];
                plantType = pTypes[charCode1 % pTypes.length];
            } else {
                plantType = 'sprout';
            }
        }

        tiles.push({
          ...p,
          id: session.id,
          renderType: isBuilding ? 'building' : 'plant',
          plantType,
          buildingType,
          size,
          color,
          duration: durationMinutes,
          subjectName: subject?.name || 'Unknown'
        });
      } else {
        tiles.push({ ...p, renderType: 'empty', id: `empty-${p.x}-${p.y}` });
      }
    });

    // Sort tiles for correct isometric rendering (back to front)
    tiles.sort((a, b) => (a.x + a.y) - (b.x + b.y));

    return { N: currentN, gridTiles: tiles };
  }, [sortedSessions, subjectMap]);

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, any> = {
      blue: { top: 'bg-blue-400', left: 'bg-blue-600', right: 'bg-blue-800' },
      indigo: { top: 'bg-indigo-400', left: 'bg-indigo-600', right: 'bg-indigo-800' },
      purple: { top: 'bg-purple-400', left: 'bg-purple-600', right: 'bg-purple-800' },
      pink: { top: 'bg-pink-400', left: 'bg-pink-600', right: 'bg-pink-800' },
      rose: { top: 'bg-rose-400', left: 'bg-rose-600', right: 'bg-rose-800' },
      orange: { top: 'bg-orange-400', left: 'bg-orange-600', right: 'bg-orange-800' },
      amber: { top: 'bg-amber-400', left: 'bg-amber-600', right: 'bg-amber-800' },
      yellow: { top: 'bg-yellow-400', left: 'bg-yellow-600', right: 'bg-yellow-800' },
      lime: { top: 'bg-lime-400', left: 'bg-lime-600', right: 'bg-lime-800' },
      green: { top: 'bg-green-400', left: 'bg-green-600', right: 'bg-green-800' },
      emerald: { top: 'bg-emerald-400', left: 'bg-emerald-600', right: 'bg-emerald-800' },
      teal: { top: 'bg-teal-400', left: 'bg-teal-600', right: 'bg-teal-800' },
      cyan: { top: 'bg-cyan-400', left: 'bg-cyan-600', right: 'bg-cyan-800' },
      sky: { top: 'bg-sky-400', left: 'bg-sky-600', right: 'bg-sky-800' },
      slate: { top: 'bg-slate-400', left: 'bg-slate-600', right: 'bg-slate-800' },
    };
    return colorMap[color] || colorMap.emerald;
  };

  const getPlantHeight = (type: string) => {
    switch (type) {
      case 'oak':
      case 'pine':
      case 'palm': return 'h-24 -translate-y-24';
      case 'flower':
      case 'sunflower':
      case 'rose': return 'h-16 -translate-y-16';
      case 'bush':
      case 'cactus':
      case 'fern': return 'h-12 -translate-y-12';
      case 'sprout': return 'h-8 -translate-y-8';
      default: return 'h-0';
    }
  };

  // Calculate scale to fit grid in view
  const scale = Math.min(1, 600 / (N * 40));

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 overflow-hidden relative">
      <div className="absolute top-8 left-8 z-10">
        <h2 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg">Focus Oasis</h2>
        <p className="text-emerald-400/80 font-medium">Grow your city and garden with every session.</p>
      </div>

      {/* Isometric Container */}
      <div className="relative w-full max-w-4xl aspect-square flex items-center justify-center mt-12">
        <div 
          className="relative"
          style={{
            width: `${N * 40}px`,
            height: `${N * 40}px`,
            transform: `scale(${scale}) rotateX(60deg) rotateZ(-45deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {gridTiles.map((tile, index) => {
            const isFilled = tile.renderType === 'building' || tile.renderType === 'plant';
            const colors = isFilled ? getColorClasses(tile.color) : null;
            
            return (
              <motion.div 
                key={tile.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.005, duration: 0.4 }}
                className="absolute w-[40px] h-[40px]"
                style={{ 
                  left: `${tile.x * 40}px`, 
                  top: `${tile.y * 40}px`,
                  transformStyle: 'preserve-3d' 
                }}
                title={isFilled ? `${tile.subjectName} (${Math.round(tile.duration!)}m)` : tile.renderType === 'path' ? 'Path' : 'Empty Plot'}
              >
                {/* Path */}
                {tile.renderType === 'path' && (
                  <div className="absolute inset-0 bg-slate-700 border border-slate-800/50 overflow-hidden">
                    <div className="w-full h-full opacity-20" style={{
                        backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
                        backgroundSize: '4px 4px'
                    }} />
                  </div>
                )}

                {/* Empty Plot */}
                {tile.renderType === 'empty' && (
                  <div className="absolute inset-0 bg-emerald-900/20 border border-emerald-900/40" />
                )}

                {/* Building */}
                {tile.renderType === 'building' && colors && (
                  <div className="absolute inset-[4px]">
                    {/* Base shadow */}
                    <div className="absolute inset-0 bg-black/40 blur-[2px]" />
                    
                    {/* Top Face */}
                    <div 
                      className={`absolute inset-0 ${colors.top} border border-white/20`} 
                      style={{ transform: `translateZ(${tile.size * 15}px)` }} 
                    >
                        {/* Roof decorations based on type */}
                        {tile.buildingType === 'skyscraper' && (
                            <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-slate-300 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-sm">
                                <div className="absolute top-1/2 left-1/2 w-0.5 h-6 bg-slate-400 -translate-x-1/2 -translate-y-full" />
                            </div>
                        )}
                        {tile.buildingType === 'industrial' && (
                            <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-slate-700 rounded-full shadow-sm">
                                <div className="absolute top-1/2 left-1/2 w-2 h-4 bg-slate-600 -translate-x-1/2 -translate-y-full rounded-sm" />
                            </div>
                        )}
                    </div>
                    
                    {/* Left Face */}
                    <div 
                      className={`absolute top-full left-0 w-full origin-top ${colors.left} border-l border-b border-black/20 flex flex-col justify-evenly items-center`} 
                      style={{ height: `${tile.size * 15}px`, transform: 'rotateX(-90deg)' }}
                    >
                        {/* Windows */}
                        {tile.buildingType === 'commercial' || tile.buildingType === 'skyscraper' ? (
                            Array.from({ length: tile.size * 2 }).map((_, i) => (
                                <div key={i} className="w-3/4 h-1.5 bg-sky-200/40 rounded-sm" />
                            ))
                        ) : tile.buildingType === 'residential' ? (
                            Array.from({ length: tile.size }).map((_, i) => (
                                <div key={i} className="w-1/2 h-2 bg-amber-200/40 rounded-sm" />
                            ))
                        ) : (
                            <div className="w-3/4 h-1/2 bg-slate-800/40 rounded-sm mt-auto mb-2" />
                        )}
                    </div>
                    
                    {/* Right Face */}
                    <div 
                      className={`absolute top-0 left-full h-full origin-left ${colors.right} border-r border-b border-black/20 flex flex-row justify-evenly items-center`} 
                      style={{ width: `${tile.size * 15}px`, transform: 'rotateY(90deg)' }}
                    >
                        {/* Windows */}
                        {tile.buildingType === 'commercial' || tile.buildingType === 'skyscraper' ? (
                            Array.from({ length: tile.size * 2 }).map((_, i) => (
                                <div key={i} className="h-3/4 w-1.5 bg-sky-900/40 rounded-sm" />
                            ))
                        ) : tile.buildingType === 'residential' ? (
                            Array.from({ length: tile.size }).map((_, i) => (
                                <div key={i} className="h-1/2 w-2 bg-amber-900/40 rounded-sm" />
                            ))
                        ) : (
                            <div className="h-3/4 w-1/2 bg-slate-900/40 rounded-sm ml-auto mr-2" />
                        )}
                    </div>
                  </div>
                )}

                {/* Plant */}
                {tile.renderType === 'plant' && colors && (
                  <>
                    <div className="absolute inset-0 bg-emerald-900/30 border border-emerald-900/50" />
                    <div 
                      className={`absolute bottom-1/2 left-1/2 w-8 ${getPlantHeight(tile.plantType)} -translate-x-1/2 origin-bottom flex items-end justify-center pointer-events-none`}
                      style={{ transform: 'rotateZ(45deg) rotateX(-60deg)' }}
                    >
                      {tile.plantType === 'oak' && (
                        <div className="relative w-full h-full flex flex-col items-center justify-end">
                          <div className={`w-12 h-16 rounded-full ${colors.top} shadow-lg absolute bottom-4 opacity-90 blur-[1px]`} />
                          <div className={`w-10 h-10 rounded-full ${colors.left} shadow-lg absolute bottom-10 -left-2 opacity-90 blur-[1px]`} />
                          <div className={`w-10 h-10 rounded-full ${colors.right} shadow-lg absolute bottom-8 -right-2 opacity-90 blur-[1px]`} />
                          <div className="w-2 h-8 bg-amber-900/80 rounded-t-sm" />
                        </div>
                      )}
                      {tile.plantType === 'pine' && (
                        <div className="relative w-full h-full flex flex-col items-center justify-end">
                          <div className={`w-10 h-10 ${colors.top} shadow-lg absolute bottom-6 opacity-90`} style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
                          <div className={`w-12 h-12 ${colors.left} shadow-lg absolute bottom-2 opacity-90`} style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
                          <div className="w-2 h-6 bg-amber-900/80 rounded-t-sm" />
                        </div>
                      )}
                      {tile.plantType === 'palm' && (
                        <div className="relative w-full h-full flex flex-col items-center justify-end">
                          <div className={`w-16 h-4 rounded-full ${colors.top} shadow-lg absolute bottom-16 opacity-90 rotate-12`} />
                          <div className={`w-16 h-4 rounded-full ${colors.left} shadow-lg absolute bottom-16 opacity-90 -rotate-12`} />
                          <div className={`w-4 h-16 rounded-full ${colors.right} shadow-lg absolute bottom-12 opacity-90`} />
                          <div className="w-1.5 h-12 bg-amber-700/80 rounded-t-sm rotate-3" />
                        </div>
                      )}
                      {tile.plantType === 'flower' && (
                        <div className="relative w-full h-full flex flex-col items-center justify-end">
                          <div className={`w-6 h-6 rounded-full ${colors.top} shadow-md absolute bottom-4`} />
                          <div className="w-1 h-6 bg-emerald-600/80" />
                        </div>
                      )}
                      {tile.plantType === 'sunflower' && (
                        <div className="relative w-full h-full flex flex-col items-center justify-end">
                          <div className={`w-8 h-8 rounded-full bg-yellow-400 shadow-md absolute bottom-4 flex items-center justify-center`}>
                              <div className="w-4 h-4 rounded-full bg-amber-900" />
                          </div>
                          <div className="w-1 h-8 bg-emerald-600/80" />
                        </div>
                      )}
                      {tile.plantType === 'rose' && (
                        <div className="relative w-full h-full flex flex-col items-center justify-end">
                          <div className={`w-5 h-5 rounded-full bg-rose-500 shadow-md absolute bottom-5`} />
                          <div className={`w-4 h-4 rounded-full bg-rose-600 shadow-md absolute bottom-4 -left-1`} />
                          <div className={`w-4 h-4 rounded-full bg-rose-400 shadow-md absolute bottom-4 -right-1`} />
                          <div className="w-1 h-6 bg-emerald-700/80" />
                        </div>
                      )}
                      {tile.plantType === 'bush' && (
                        <div className="relative w-full h-full flex flex-col items-center justify-end">
                          <div className={`w-10 h-10 rounded-full ${colors.top} shadow-md absolute bottom-0 opacity-90`} />
                        </div>
                      )}
                      {tile.plantType === 'cactus' && (
                        <div className="relative w-full h-full flex flex-col items-center justify-end">
                          <div className={`w-4 h-10 rounded-full ${colors.top} shadow-md absolute bottom-0 opacity-90`} />
                          <div className={`w-3 h-6 rounded-full ${colors.left} shadow-md absolute bottom-2 -left-2 -rotate-45 opacity-90`} />
                          <div className={`w-3 h-5 rounded-full ${colors.right} shadow-md absolute bottom-4 -right-2 rotate-45 opacity-90`} />
                        </div>
                      )}
                      {tile.plantType === 'fern' && (
                        <div className="relative w-full h-full flex flex-col items-center justify-end">
                          <div className={`w-8 h-2 rounded-full ${colors.top} shadow-md absolute bottom-2 rotate-45 opacity-90`} />
                          <div className={`w-8 h-2 rounded-full ${colors.left} shadow-md absolute bottom-2 -rotate-45 opacity-90`} />
                          <div className={`w-6 h-2 rounded-full ${colors.right} shadow-md absolute bottom-4 rotate-12 opacity-90`} />
                        </div>
                      )}
                      {tile.plantType === 'sprout' && (
                        <div className="relative w-full h-full flex flex-col items-center justify-end">
                          <div className={`w-4 h-4 rounded-full ${colors.top} shadow-sm absolute bottom-2`} />
                          <div className="w-1 h-3 bg-emerald-500/80" />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-8 left-8 right-8 flex flex-col items-center gap-2 bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10">
        <div className="flex flex-wrap justify-center gap-4">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-slate-700" /> <span className="text-xs text-slate-300">Path</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-emerald-900/50" /> <span className="text-xs text-slate-300">Empty</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-emerald-400" /> <span className="text-xs text-slate-300">&lt; 10m</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-sm bg-emerald-400" /> <span className="text-xs text-slate-300">10-25m</span></div>
          <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-sm bg-emerald-400" /> <span className="text-xs text-slate-300">25-60m</span></div>
          <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-sm bg-emerald-400" /> <span className="text-xs text-slate-300">60m+</span></div>
        </div>
        <div className="text-xs text-slate-400 text-center">
          Colors represent subjects. Buildings and plants are randomly generated based on session ID.
        </div>
      </div>
    </div>
  );
};
