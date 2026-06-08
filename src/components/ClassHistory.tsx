import React, { useState } from 'react';
import { Classroom, ClassSession } from '../types';
import { Calendar, Clock, Award, Award as Trophy, Users, FileDown, Image, ListTodo, Search, Filter } from 'lucide-react';
import { generateAvatarSvg } from '../utils/avatarUtils';
import { generateSessionPdf } from '../utils/sessionPdfGenerator';
import { toPng } from 'html-to-image';

interface ClassHistoryProps {
  currentClass: Classroom | null;
  classes: Classroom[];
  onSelectClass: (c: Classroom) => void;
}

export default function ClassHistory({ currentClass, classes, onSelectClass }: ClassHistoryProps) {
  const [dateFilter, setDateFilter] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Retrieve the session history of the active class
  const sessions = currentClass?.sessionHistory || [];

  // Filter sessions by date
  const filteredSessions = sessions.filter((session) => {
    if (!dateFilter) return true;
    const sessionDateStr = new Date(session.startTime).toISOString().substring(0, 10);
    return sessionDateStr === dateFilter;
  });

  const exportAsImage = async (sessionId: string) => {
    const element = document.getElementById(`session-card-${sessionId}`);
    if (!element) return;

    try {
      // Create high-fidelity snapshot using html-to-image (toPng)
      const imgData = await toPng(element, {
        backgroundColor: '#ffffff',
        filter: (node) => {
          // Hide session actions buttons from output
          if (node instanceof HTMLElement && node.classList.contains('session-actions-wrapper')) {
            return false;
          }
          return true;
        },
        cacheBust: true,
        style: {
          transform: 'scale(1)',
          borderRadius: '16px',
        }
      });

      const link = document.createElement('a');
      link.href = imgData;
      link.download = `session_report_${sessionId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export session image:', err);
      alert('Could not export session image. Please try again.');
    }
  };

  return (
    <div className="space-y-6" id="class-history-root">
      
      {/* Class Selector Header and Filters */}
      <div className="bg-white rounded-2xl border-2 border-slate-900 p-6 shadow-bento flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight font-display mb-1 flex items-center gap-2">
            <Calendar className="text-indigo-600 w-5 h-5" /> Previous Class Sessions
          </h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Review detailed analytical timelines, find class MVPs, and export previous logs
          </p>
        </div>

        {/* Date Filter Input */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
              <Filter className="w-3.5 h-3.5" />
            </span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs font-bold uppercase tracking-wider border-2 border-slate-900 rounded-xl bg-white w-full md:w-44 focus:outline-none"
            />
          </div>
          
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="bg-slate-105 hover:bg-slate-200 text-slate-800 border-2 border-slate-900 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white border-2 border-slate-900 rounded-3xl p-12 text-center text-slate-400 shadow-bento max-w-xl mx-auto">
          <Calendar className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
          <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 font-display">No Saved Session History</h3>
          <p className="text-sm font-bold text-slate-500 mt-2">
            Start and end a live class session under "Class Session" tab to seed diagnostic records.
          </p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="bg-white border-2 border-slate-900 rounded-3xl p-12 text-center text-slate-400 shadow-bento max-w-xl mx-auto">
          <Search className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
          <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 font-display">No Results Match date</h3>
          <p className="text-xs font-bold text-slate-500 mt-2">
            No class sessions were logged on {new Date(dateFilter).toLocaleDateString()}. Try choosing another date!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSessions.map((session) => {
            const dateObj = new Date(session.startTime);
            const friendlyDate = dateObj.toLocaleDateString([], {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            const friendlyTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={session.id}
                id={`session-card-${session.id}`}
                className="bg-white rounded-2xl border-2 border-slate-900 p-6 shadow-bento flex flex-col justify-between hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-200"
              >
                <div>
                  {/* Card Title Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-[9px] uppercase font-black bg-indigo-100 text-indigo-850 px-2 py-0.5 rounded-md border border-indigo-300">
                        Class Session Details
                      </span>
                      <h3 className="text-base font-black text-slate-900 uppercase tracking-tight font-display mt-1.5">
                        {session.className}
                      </h3>
                      {session.subject && (
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">
                          {session.subject}
                        </p>
                      )}
                    </div>

                    <div className="text-right font-mono text-[10px] font-bold text-slate-400">
                      ID: {session.id.toUpperCase()}
                    </div>
                  </div>

                  {/* Datetime stats */}
                  <div className="space-y-2 py-3 border-y divide-y divide-dashed divide-slate-150 border-slate-150 my-4 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <div className="flex items-center gap-2 py-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{friendlyDate}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-2 pb-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>
                        LOGGED: {friendlyTime} ({session.duration})
                      </span>
                    </div>
                  </div>

                  {/* Comprehensive Stats Profile Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
                    
                    {/* Attendance profile counts */}
                    <div className="bg-slate-50 border border-slate-900 p-3 rounded-xl flex flex-col justify-center">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2 text-center border-b border-dashed border-slate-200 pb-1 font-mono">
                        Attendance Profile
                      </div>
                      <div className="flex justify-around text-[10px] font-extrabold uppercase">
                        <span className="text-emerald-700">PRESENT: {session.studentsCount}</span>
                        <span className="text-amber-700">LATE: {session.lateCount ?? 0}</span>
                        <span className="text-rose-700">ABS: {session.absentCount ?? 0}</span>
                      </div>
                    </div>

                    {/* Engagement Rate and tools count */}
                    <div className="bg-slate-50 border border-slate-900 p-3 rounded-xl text-center flex flex-col justify-center">
                      <div className="text-[9px] font-black text-slate-450 uppercase tracking-widest mb-1.5 flex justify-between px-1 font-mono">
                        <span>Rate: <strong className="text-indigo-650">{session.engagementRate ?? 0}%</strong></span>
                        <span>Spins: <strong className="text-slate-700">{session.spinWheelWinnersCount ?? 0}</strong></span>
                      </div>
                      <div className="text-[10px] font-black uppercase text-slate-700 tracking-wider mt-1 border-t border-dashed border-slate-200 pt-1">
                        {session.eventsCount} Turns / {session.pointsAwarded >= 0 ? `+${session.pointsAwarded}` : session.pointsAwarded} PTS
                      </div>
                    </div>

                  </div>

                  {/* MVP Banner */}
                  <div className="bg-amber-50 border border-amber-300 p-3 rounded-xl flex items-center justify-between gap-3 my-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full border border-slate-900 bg-slate-100 overflow-hidden flex-shrink-0">
                        <div
                          className="w-full h-full"
                          dangerouslySetInnerHTML={{ __html: generateAvatarSvg(session.mvpAvatarSeed || 'seed') }}
                        />
                      </div>
                      <div>
                        <div className="text-[9px] font-black uppercase text-amber-800 tracking-wider flex items-center gap-0.5">
                          <Award className="w-3 h-3 fill-current" /> Class Session MVP
                        </div>
                        <div className="text-xs font-black text-slate-900 capitalize leading-tight mt-0.2">
                          {session.mvpName || 'No recitation events'}
                        </div>
                      </div>
                    </div>

                    {session.mvpPointsGained > 0 && (
                      <div className="text-amber-950 font-mono font-black text-xs uppercase text-right">
                        +{session.mvpPointsGained} PTS
                      </div>
                    )}
                  </div>

                  {/* Toggle list of events */}
                  {selectedSessionId === session.id ? (
                    <div className="my-4 pt-1 bg-slate-50 border-2 border-slate-900 p-3 rounded-xl max-h-[160px] overflow-y-auto space-y-1.5 shadow-inner">
                      <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                        <span>Event List Logs</span>
                        <span onClick={() => setSelectedSessionId(null)} className="cursor-pointer text-indigo-600 underline">Hide</span>
                      </div>
                      {(session.events || []).length === 0 ? (
                        <div className="text-[10px] text-slate-400 italic">No events logged.</div>
                      ) : (
                        (session.events || []).map((ev) => (
                          <div key={ev.id} className="text-[10px] font-bold text-slate-700 uppercase flex justify-between gap-2 border-b border-slate-100 pb-1">
                            <span className="truncate">{ev.studentName}: <span className="text-slate-400 font-normal italic">{ev.reason || 'Recitated'}</span></span>
                            <span className="text-emerald-700 whitespace-nowrap">+{ev.pointsAwarded} pts</span>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedSessionId(selectedSessionId === session.id ? null : session.id)}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-extrabold uppercase tracking-wide cursor-pointer flex items-center gap-1 my-3"
                    >
                      <ListTodo className="w-3.5 h-3.5" /> View Timeline Details
                    </button>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="session-actions-wrapper border-t-2 border-slate-100 pt-4 mt-3 flex items-center gap-2 justify-end">
                  <button
                    onClick={() => exportAsImage(session.id)}
                    className="border-2 border-slate-900 bg-white hover:bg-slate-50 text-slate-905 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shadow-bento-sm"
                  >
                    <Image className="w-3.5 h-3.5" /> Image CAP
                  </button>
                  <button
                    onClick={() => generateSessionPdf(session)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white border-2 border-slate-900 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shadow-bento-sm hover:translate-y-[1px]"
                  >
                    <FileDown className="w-3.5 h-3.5" /> Export PDF
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
