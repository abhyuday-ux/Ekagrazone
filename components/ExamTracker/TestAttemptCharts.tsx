import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area } from 'recharts';
import { MockTest, Subject, isHexColor } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { BarChart3 } from 'lucide-react';

interface TestAttemptChartsProps {
    tests: MockTest[];
    subjects: Subject[];
}

export const TestAttemptCharts: React.FC<TestAttemptChartsProps> = ({ tests, subjects }) => {
    const { accent } = useTheme();

    const attemptedTests = tests
        .filter(t => t.attemptTimestamp && t.subjectScores)
        .sort((a, b) => (a.attemptTimestamp || 0) - (b.attemptTimestamp || 0));

    const overallData = attemptedTests.map((test, index) => ({
        name: `Attempt #${index + 1}`,
        attemptNumber: index + 1,
        timestamp: test.attemptTimestamp,
        scored: test.totalScore || 0,
        max: test.totalMaxMarks
    }));

    const subjectData = attemptedTests.map((test, index) => {
        const entry: any = {
            name: `Attempt #${index + 1}`,
            attemptNumber: index + 1,
            timestamp: test.attemptTimestamp,
        };
        test.subjectIds.forEach(sid => {
            const sub = subjects.find(s => s.id === sid);
            if (sub) {
                entry[sub.name] = test.subjectScores?.[sid] || 0;
                entry[`${sub.name}_max`] = test.subjectMaxMarks[sid] || 100;
            }
        });
        return entry;
    });

    if (attemptedTests.length === 0) {
        return (
            <div className="h-48 flex flex-col items-center justify-center text-slate-600 text-xs border border-dashed border-white/5 rounded-2xl bg-slate-900/20 gap-2">
                <BarChart3 size={20} />
                <span>No attempt data for this test yet.</span>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const attemptTimestamp = payload[0].payload.timestamp;
            return (
                <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 p-3 rounded-xl shadow-2xl">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                        {`ATTEMPT ${label}`}
                    </p>
                     <p className="text-[8px] font-mono text-slate-600 mb-2">
                        {new Date(attemptTimestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                    <div className="space-y-1.5">
                        {payload.map((entry: any, index: number) => {
                            const maxKey = `${entry.name}_max`;
                            const maxVal = entry.payload[maxKey] || entry.payload.max;
                            return (
                                <div key={index} className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                        <span className="text-[10px] font-bold text-slate-200">{entry.name}</span>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold text-white">
                                        {entry.value} <span className="text-slate-500 text-[9px]">/ {maxVal}</span>
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-950/50 border border-white/5 rounded-2xl p-4 shadow-inner">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full bg-${accent}-500 shadow-[0_0_6px_rgba(var(--color-${accent}-500),0.5)]`} />
                    Total Marks Progression
                </h4>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={overallData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                            <defs>
                                <linearGradient id={`colorScored-${accent}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={`var(--color-${accent}-500)`} stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor={`var(--color-${accent}-500)`} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="2 2" stroke="#ffffff10" vertical={false} />
                            <XAxis dataKey="attemptNumber" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} dy={10} />
                            <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} dx={-10} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="scored" name="Total Score" stroke={`var(--color-${accent}-500)`} strokeWidth={2} fillOpacity={1} fill={`url(#colorScored-${accent})`} dot={{ r: 4, fill: '#0f172a', strokeWidth: 2, stroke: `var(--color-${accent}-500)` }} activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-slate-950/50 border border-white/5 rounded-2xl p-4 shadow-inner">
                 <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    Subject-wise Breakdown
                </h4>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={subjectData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="2 2" stroke="#ffffff10" vertical={false} />
                            <XAxis dataKey="attemptNumber" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} dy={10} />
                            <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} dx={-10} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" iconSize={6} formatter={(value) => <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">{value}</span>} />
                            {subjects.map((sub, idx) => (
                                <Line key={`subject-line-${sub.id}-${idx}`} type="monotone" dataKey={sub.name} name={sub.name} stroke={isHexColor(sub.color) ? sub.color : '#64748b'} strokeWidth={2} dot={{ r: 3, fill: '#0f172a', strokeWidth: 1 }} activeDot={{ r: 5, strokeWidth: 0, fill: '#fff' }} connectNulls />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
