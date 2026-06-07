import React, { useState } from 'react';
import { Classroom, RecitationEvent } from '../types';
import { Search, Trophy, History, ShieldAlert, Sparkles, SlidersHorizontal, ArrowDownAZ } from 'lucide-react';
import { generateAvatarSvg } from '../utils/avatarUtils';

interface LeaderboardProps {
  currentClass: Classroom;
}

export default function Leaderboard({ currentClass }: LeaderboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [logFilter, setLogFilter] = useState<'all' | 'high'>('all');

  // Sort students by points descending
  const sortedStudents = [...currentClass.students].sort((a, b) => b.points - a.points);

  // Search filtered
  const filteredStudents = sortedStudents.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort logs by time descending
  const recentLogs = [...currentClass.history].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const filteredLogs = recentLogs.filter((log) => {
    if (logFilter === 'high') {
      return log.pointsAwarded >= 3;
    }
    return true;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="leaderboard-root">
      
      {/* Standings List - Column 1 & 2 */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl border-2 border-slate-900 p-6 shadow-bento">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-slate-900 pb-4 mb-4 gap-3">
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight font-display text-slate-900 flex items-center gap-2">
                <Trophy className="text-amber-500 w-5 h-5 fill-current" /> Standings & Leaderboard
              </h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">Live standings of class activities.</p>
            </div>

            {/* Live Standings search bar */}
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                id="leaderboard-search"
                type="text"
                placeholder="Search pupil..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs font-bold border-2 border-slate-900 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none bg-white shadow-bento-sm"
              />
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-extrabold uppercase tracking-wider text-sm">
              No students found inside rankings.
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
              {filteredStudents.map((student, index) => {
                // Get overall index from original sorted lists
                const overallRank = sortedStudents.findIndex((st) => st.id === student.id) + 1;
                
                let rankStyle = 'bg-slate-105 text-slate-800 border-2 border-slate-900';
                let cardStyle = 'border-2 border-slate-900 bg-white shadow-bento-sm';
                
                if (overallRank === 1) {
                  rankStyle = 'bg-amber-400 text-slate-950 font-black border-2 border-slate-900 shadow-bento-sm';
                  cardStyle = 'border-2 border-slate-900 bg-amber-50 shadow-bento';
                } else if (overallRank === 2) {
                  rankStyle = 'bg-slate-300 text-slate-900 font-black border-2 border-slate-900';
                  cardStyle = 'border-2 border-slate-900 bg-slate-50 shadow-bento-sm';
                } else if (overallRank === 3) {
                  rankStyle = 'bg-orange-300 text-slate-950 font-black border-2 border-slate-900';
                  cardStyle = 'border-2 border-slate-900 bg-orange-50 shadow-bento-sm';
                }

                return (
                  <div
                    key={student.id}
                    id={`leaderboard-row-${student.id}`}
                    className={`flex items-center justify-between p-3.5 rounded-2xl transition-all ${cardStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank Badge */}
                      <span className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center ${rankStyle}`}>
                        {overallRank}
                      </span>

                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-white shadow-bento-sm overflow-hidden flex-shrink-0">
                        <div
                          className="w-full h-full"
                          dangerouslySetInnerHTML={{ __html: generateAvatarSvg(student.avatarSeed) }}
                        />
                      </div>

                      {/* Info name */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-sm sm:text-base">{student.name}</span>
                          {student.streak >= 3 && (
                            <span className="text-[9px] bg-red-400 text-slate-950 font-black border-2 border-slate-900 px-2 py-0.5 rounded-md flex items-center gap-0.5 shadow-bento-sm">
                              🔥 ON FIRE ({student.streak}x)
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-405 mt-0.5">
                          {student.attendance === 'present' ? (
                            <span className="text-emerald-600 font-black">● Active Session</span>
                          ) : (
                            <span className="text-slate-400">● Status: {student.attendance}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-display select-none">
                      <div className="text-base sm:text-lg font-black text-indigo-600 uppercase">
                        {student.points} <span className="text-[10px] font-black text-slate-450">PTS</span>
                      </div>
                      {student.streak > 0 && (
                        <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Streak: {student.streak} days</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recitation Event Logs Tracker - Column 3 */}
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border-2 border-slate-900 p-6 shadow-bento">
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3.5 mb-3.5">
            <h4 className="font-black font-display text-sm uppercase text-slate-950 flex items-center gap-2">
              <History className="text-slate-600 w-4 h-4" /> Recitation Event Log
            </h4>
            
            {/* Quick logs filter */}
            <div className="flex rounded-lg bg-[#f1f5f9] p-1 border-2 border-slate-900 shadow-bento-sm">
              <button
                id="log-filter-all"
                onClick={() => setLogFilter('all')}
                className={`px-2 py-0.5 text-[9px] uppercase tracking-wider font-black rounded-md cursor-pointer border ${
                  logFilter === 'all' ? 'bg-white text-slate-900 border-slate-900' : 'text-slate-400 border-transparent hover:text-slate-600'
                }`}
              >
                All
              </button>
              <button
                id="log-filter-high"
                onClick={() => setLogFilter('high')}
                className={`px-2 py-0.5 text-[9px] uppercase tracking-wider font-black rounded-md cursor-pointer border ${
                  logFilter === 'high' ? 'bg-white text-slate-900 border-slate-900' : 'text-slate-400 border-transparent hover:text-slate-600'
                }`}
              >
                High Scores (+3)
              </button>
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-bold uppercase tracking-wider text-xs">
              No recitation events recorded yet in this section.
            </div>
          ) : (
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-3.5 bg-white rounded-xl border-2 border-slate-900 text-xs shadow-bento-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-extrabold text-slate-900 truncate">{log.studentName}</span>
                    <span className={`font-black px-1.5 py-0.5 border-2 border-slate-900 rounded text-[9px] ${
                      log.pointsAwarded >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {log.pointsAwarded >= 0 ? '+' : ''}{log.pointsAwarded} PTS
                    </span>
                  </div>
                  
                  <p className="text-[11px] font-bold text-slate-500 italic mt-1 bg-slate-50 p-1.5 rounded border border-slate-100">"{log.reason || 'Slipped recitation Session'}"</p>
                  
                  <div className="text-[10px] font-bold text-slate-400 text-right mt-2 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
