import React, { useState } from 'react';
import { Classroom, Student, AttendanceStatus } from '../types';
import { Play, Square, Check, X, AlertCircle, Clock, UserCheck, Flame, Award, Minus, BookOpen, Layers, Search, Grid, List } from 'lucide-react';
import { generateAvatarSvg } from '../utils/avatarUtils';

interface SessionManagerProps {
  classes: Classroom[];
  currentClass: Classroom | null;
  onSelectClass: (c: Classroom) => void;
  isSessionActive: boolean;
  onStartSession: () => void;
  onEndSession: () => void;
  onUpdateStudents: (updatedStudents: Student[]) => void;
  onRecordEvent: (studentId: string, points: number, reason: string) => void;
  elapsedTime: string;
}

export default function SessionManager({
  classes,
  currentClass,
  onSelectClass,
  isSessionActive,
  onStartSession,
  onEndSession,
  onUpdateStudents,
  onRecordEvent,
  elapsedTime
}: SessionManagerProps) {
  const [filter, setFilter] = useState<'all' | 'present' | 'absent' | 'late' | 'excused'>('all');
  const [quickReason, setQuickReason] = useState('Active Participation');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  const handleSetAttendance = (studentId: string, status: AttendanceStatus) => {
    if (!currentClass) return;
    const updated = currentClass.students.map((s) => {
      if (s.id === studentId) {
        return { ...s, attendance: status };
      }
      return s;
    });
    onUpdateStudents(updated);
  };

  const handleAddPoints = (student: Student, pts: number) => {
    if (!currentClass) return;
    // Record event
    onRecordEvent(student.id, pts, quickReason);
    
    // Update student points and update streak if pts > 0 and wasn't earned today
    const updated = currentClass.students.map((s) => {
      if (s.id === student.id) {
        const newPoints = s.points + pts;
        const today = new Date().toISOString().substring(0, 10);
        let newStreak = s.streak;

        if (pts > 0) {
          if (s.lastRecitationDate !== today) {
            newStreak = s.streak + 1; // Increment hot streak!
          }
        }

        return {
          ...s,
          points: Math.max(0, newPoints),
          streak: newStreak,
          lastRecitationDate: pts > 0 ? today : s.lastRecitationDate
        };
      }
      return s;
    });
    onUpdateStudents(updated);
  };

  const handleMarkAllPresent = () => {
    if (!currentClass) return;
    const updated = currentClass.students.map((s) => s.archived ? s : { ...s, attendance: 'present' as AttendanceStatus });
    onUpdateStudents(updated);
  };

  const filteredStudents = currentClass
    ? currentClass.students.filter((s) => {
        if (s.archived) return false;
        
        // Match attendance filter first
        const matchesFilter = filter === 'all' || s.attendance === filter;
        if (!matchesFilter) return false;
        
        // Match search query
        if (searchTerm.trim() !== '') {
          return s.name.toLowerCase().includes(searchTerm.toLowerCase());
        }
        
        return true;
      })
    : [];

  return (
    <div className="space-y-6" id="session-manager-root">
      
      {/* Session Action Bar */}
      {!isSessionActive && (
        <div className="bg-white rounded-2xl border-2 border-slate-900 p-6 shadow-bento flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl border-2 border-slate-900 bg-slate-100 text-slate-500">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight font-display text-slate-900">
                Ready to Start Live Class
              </h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
                {currentClass 
                  ? `Launch live session tracker for: ${currentClass.name}`
                  : 'Please select a class from the options below to begin tracking.'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            {currentClass ? (
              <button
                id="start-session-btn"
                onClick={onStartSession}
                className="bg-emerald-500 text-slate-950 border-2 border-slate-900 rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-bento-sm hover:translate-x-[1px] hover:translate-y-[1px] cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current text-slate-950" /> Start Live Class
              </button>
            ) : (
              <button
                disabled
                className="bg-slate-100 text-slate-400 border-2 border-slate-200 rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-not-allowed opacity-60"
              >
                Choose Class Below
              </button>
            )}
          </div>
        </div>
      )}

      {/* BEFORE STARTING: Choose which class to use first */}
      {!isSessionActive && (
        classes.length > 0 ? (
          <div className="bg-white rounded-2xl border-2 border-slate-900 p-6 shadow-bento space-y-6" id="launcher-selector-block">
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight font-display mb-1 flex items-center gap-2">
                <Layers className="text-indigo-600 w-5 h-5" /> Choose Class To Launch
              </h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Select which class roster you'd like to use first. This will instantly activate roll call and starting timers.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((cls) => {
                const isSelected = currentClass?.id === cls.id;
                return (
                  <button
                    key={cls.id}
                    id={`session-class-pick-${cls.id}`}
                    onClick={() => onSelectClass(cls)}
                    className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between h-36 ${
                      isSelected
                        ? 'border-slate-900 bg-indigo-50 shadow-bento-sm ring-4 ring-indigo-500/20'
                        : 'border-slate-900 bg-white hover:bg-slate-50 shadow-none'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm tracking-tight uppercase flex justify-between items-start gap-2">
                        <span className="truncate">{cls.name}</span>
                        {isSelected && (
                          <span className="p-1 rounded bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1 truncate">{cls.subject || "No Subject"}</div>
                    </div>
                    
                    <div className="flex items-center justify-between font-mono text-[10px] font-black uppercase text-slate-700 bg-slate-100 border border-slate-900 px-2.5 py-1.5 rounded-lg mt-3">
                      <span>Roster:</span>
                      <span>{cls.students.length} Students</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {currentClass && (
              <div className="pt-4 border-t-2 border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-left">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SELECTED TARGET CLASS</div>
                  <div className="text-sm sm:text-base font-black text-slate-900 uppercase font-display">{currentClass.name}</div>
                </div>
                <button
                  id="launcher-big-active-btn"
                  onClick={onStartSession}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white border-2 border-slate-900 rounded-xl px-8 py-3.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-bento select-none cursor-pointer hover:-translate-x-[1px] hover:-translate-y-[1px]"
                >
                  <Play className="w-4 h-4 fill-current text-white" /> Activate Live Timeline
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border-2 border-slate-900 rounded-3xl p-12 text-center text-slate-500 shadow-bento">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 font-display">No Classes Created Yet</h3>
            <p className="text-sm font-bold text-slate-500 max-w-sm mx-auto mt-2">
              Please head over to the Class Setup tab first to create a roster and add student profiles.
            </p>
          </div>
        )
      )}

      {isSessionActive && currentClass && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Attendance and Quick-grade list */}
          <div className="lg:col-span-2 bg-white rounded-2xl border-2 border-slate-900 p-6 shadow-bento">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-slate-100 pb-4 mb-4 gap-3">
              <div>
                <h3 className="text-lg font-black font-display uppercase tracking-tight text-slate-900 flex items-center gap-2">
                  <UserCheck className="text-indigo-600 w-5 h-5" /> Attendance & Grading
                </h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Quickly click attendance categories and award recitation points</p>
              </div>

              <div className="flex items-center gap-1.5 self-start">
                <button
                  id="mark-all-present-btn"
                  onClick={handleMarkAllPresent}
                  className="bg-[#f1f5f9] text-slate-900 border-2 border-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider select-none cursor-pointer shadow-bento-sm hover:translate-x-[1px] hover:translate-y-[1px]"
                >
                  Mark All Present
                </button>
              </div>
            </div>

            {/* Quick Reason Input */}
            <div className="mb-4 bg-[#f1f5f9] border-2 border-slate-900 p-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <label className="text-xs font-black text-slate-600 uppercase tracking-widest whitespace-nowrap">
                Default Point Event Label:
              </label>
              <input
                type="text"
                value={quickReason}
                onChange={(e) => setQuickReason(e.target.value)}
                placeholder="e.g. Correct Answer, Excellent Reading, Code Walkthrough"
                className="flex-1 text-xs border-2 border-slate-200 bg-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-slate-900 font-bold"
              />
            </div>            {/* Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none border-b-2 border-slate-100 mb-3 block">
              {(['all', 'present', 'absent', 'late', 'excused'] as const).map((st) => (
                <button
                  key={st}
                  id={`filter-btn-${st}`}
                  onClick={() => setFilter(st)}
                  className={`px-3 py-1.5 border-2 border-slate-900 rounded-lg text-xs font-black uppercase tracking-wider capitalize whitespace-nowrap cursor-pointer transition-all ${
                    filter === st
                      ? 'bg-indigo-600 text-white shadow-bento-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-50 shadow-none'
                  }`}
                >
                  {st} ({st === 'all' ? currentClass.students.length : currentClass.students.filter(s => s.attendance === st).length})
                </button>
              ))}
            </div>

            {/* Search and View Mode controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 bg-slate-50 border-2 border-slate-900 p-3 rounded-xl">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search students by name..."
                  className="w-full text-xs pl-9 pr-3 py-2 border-2 border-slate-200 bg-white rounded-lg focus:outline-none focus:border-slate-900 font-bold font-sans"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-650 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-1">Roster View:</span>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 border-2 border-slate-900 rounded-lg cursor-pointer transition-all ${
                    viewMode === 'list'
                      ? 'bg-slate-900 text-white shadow-bento-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('card')}
                  className={`p-1.5 border-2 border-slate-900 rounded-lg cursor-pointer transition-all ${
                    viewMode === 'card'
                      ? 'bg-slate-900 text-white shadow-bento-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                  title="Grid/Card View"
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm font-bold italic uppercase tracking-wider">
                No students match this attendance filter or search query.
              </div>
            ) : viewMode === 'list' ? (
              <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1 animate-fadeIn">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    id={`student-row-${student.id}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border-2 border-slate-900 bg-white transition-all gap-3"
                  >
                    
                    {/* Left: Info with Attendance selection */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-100 overflow-hidden flex-shrink-0">
                        <div
                          className="w-full h-full"
                          dangerouslySetInnerHTML={{ __html: generateAvatarSvg(student.avatarSeed) }}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm sm:text-base">{student.name}</span>
                          {student.streak > 0 && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-400 px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider flex items-center gap-0.5 animate-bounce">
                              🔥 Streak {student.streak}
                            </span>
                          )}
                        </div>
                        
                        {/* Attendance Buttons Selection */}
                        <div className="flex items-center gap-1 mt-1.5">
                          {(['present', 'absent', 'late', 'excused'] as AttendanceStatus[]).map((st) => {
                            let colorClasses = 'border-slate-200 text-slate-400 hover:bg-slate-100';
                            if (student.attendance === st) {
                              if (st === 'present') colorClasses = 'bg-emerald-50 border-emerald-500 text-emerald-850 font-black';
                              if (st === 'absent') colorClasses = 'bg-rose-50 border-rose-500 text-rose-850 font-black';
                              if (st === 'late') colorClasses = 'bg-amber-50 border-amber-500 text-amber-850 font-black';
                              if (st === 'excused') colorClasses = 'bg-sky-50 border-sky-500 text-sky-850 font-black';
                            }

                            return (
                              <button
                                key={st}
                                id={`attendance-set-${student.id}-${st}`}
                                onClick={() => handleSetAttendance(student.id, st)}
                                className={`px-2 py-0.5 text-[10px] uppercase tracking-wider rounded border-2 transition-all cursor-pointer ${colorClasses}`}
                              >
                                {st}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Right: Quick Point Grading Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-center">
                      <div className="text-left sm:text-right pr-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Points</div>
                        <div className="font-black text-slate-900 text-sm sm:text-base uppercase">{student.points} PTS</div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          id={`pts-btn-${student.id}-minus1`}
                          disabled={student.points === 0}
                          onClick={() => handleAddPoints(student, -1)}
                          className="w-8 h-8 rounded-lg border-2 border-slate-900 flex items-center justify-center text-slate-700 bg-white hover:bg-rose-100 hover:text-rose-750 font-black transition-all disabled:opacity-40 cursor-pointer text-xs"
                          title="Subtract 1 Point"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`pts-btn-${student.id}-plus1`}
                          onClick={() => handleAddPoints(student, 1)}
                          className="w-8 h-8 rounded-lg border-2 border-slate-900 bg-white flex items-center justify-center text-slate-900 hover:bg-slate-100 font-extrabold transition-all cursor-pointer text-xs"
                          title="Award 1 Point"
                        >
                          +1
                        </button>
                        <button
                          id={`pts-btn-${student.id}-plus3`}
                          onClick={() => handleAddPoints(student, 3)}
                          className="w-8 h-8 rounded-lg border-2 border-slate-900 bg-amber-100 text-slate-900 hover:bg-amber-250 flex items-center justify-center font-extrabold transition-all cursor-pointer text-xs"
                          title="Award 3 Points"
                        >
                          +3
                        </button>
                        <button
                          id={`pts-btn-${student.id}-plus5`}
                          onClick={() => handleAddPoints(student, 5)}
                          className="w-8 h-8 rounded-lg border-2 border-slate-900 bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 font-extrabold transition-all cursor-pointer text-xs shadow-bento-sm"
                          title="Award 5 Points"
                        >
                          +5
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[460px] overflow-y-auto pr-1 animate-fadeIn">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    id={`student-card-${student.id}`}
                    className="flex flex-col justify-between p-4 rounded-xl border-2 border-slate-900 bg-white transition-all gap-4 shadow-bento-sm hover:translate-x-[1px] hover:translate-y-[1px]"
                  >
                    {/* Top: Avatar, Name & Points */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-100 overflow-hidden flex-shrink-0">
                          <div
                            className="w-full h-full"
                            dangerouslySetInnerHTML={{ __html: generateAvatarSvg(student.avatarSeed) }}
                          />
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 text-sm truncate max-w-[110px] sm:max-w-none">{student.name}</div>
                          {student.streak > 0 ? (
                            <span className="inline-flex mt-0.5 text-[9px] bg-amber-100 text-amber-800 border border-amber-400 px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider items-center gap-0.5 animate-pulse">
                              🔥 Streak {student.streak}
                            </span>
                          ) : (
                            <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">No Streak</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total</div>
                        <div className="font-black text-slate-900 text-xs sm:text-sm uppercase whitespace-nowrap">{student.points} PTS</div>
                      </div>
                    </div>

                    {/* Middle: Attendance Badge buttons */}
                    <div className="border-t border-b border-dashed border-slate-200 py-3">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Roll Call</div>
                      <div className="flex flex-wrap gap-1">
                        {(['present', 'absent', 'late', 'excused'] as AttendanceStatus[]).map((st) => {
                          let colorClasses = 'border-slate-200 text-slate-450 hover:bg-slate-50 text-[9px]';
                          if (student.attendance === st) {
                            if (st === 'present') colorClasses = 'bg-emerald-50 border-emerald-500 text-emerald-850 font-black text-[9px]';
                            if (st === 'absent') colorClasses = 'bg-rose-50 border-rose-500 text-rose-850 font-black text-[9px]';
                            if (st === 'late') colorClasses = 'bg-amber-50 border-amber-500 text-amber-850 font-black text-[9px]';
                            if (st === 'excused') colorClasses = 'bg-sky-50 border-sky-500 text-sky-850 font-black text-[9px]';
                          }

                          return (
                            <button
                              key={st}
                              id={`attendance-set-card-${student.id}-${st}`}
                              onClick={() => handleSetAttendance(student.id, st)}
                              className={`px-1.5 py-0.5 uppercase tracking-wider rounded border transition-all cursor-pointer ${colorClasses}`}
                            >
                              {st}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bottom: Grade actions */}
                    <div className="flex items-center justify-between gap-1 bg-slate-50 border border-slate-200 p-2 rounded-lg">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Recite Points:</span>
                      <div className="flex items-center gap-1">
                        <button
                          id={`pts-btn-card-${student.id}-minus1`}
                          disabled={student.points === 0}
                          onClick={() => handleAddPoints(student, -1)}
                          className="w-7 h-7 rounded border-2 border-slate-900 flex items-center justify-center text-slate-700 bg-white hover:bg-rose-100 hover:text-rose-750 font-black transition-all disabled:opacity-40 cursor-pointer text-[10px]"
                          title="Subtract 1 Point"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <button
                          id={`pts-btn-card-${student.id}-plus1`}
                          onClick={() => handleAddPoints(student, 1)}
                          className="w-7 h-7 rounded border-2 border-slate-900 bg-white flex items-center justify-center text-slate-900 hover:bg-slate-100 font-extrabold transition-all cursor-pointer text-[10px]"
                          title="Award 1 Point"
                        >
                          +1
                        </button>
                        <button
                          id={`pts-btn-card-${student.id}-plus3`}
                          onClick={() => handleAddPoints(student, 3)}
                          className="w-7 h-7 rounded border-2 border-slate-900 bg-amber-100 text-slate-900 hover:bg-amber-200 flex items-center justify-center font-extrabold transition-all cursor-pointer text-[10px]"
                          title="Award 3 Points"
                        >
                          +3
                        </button>
                        <button
                          id={`pts-btn-card-${student.id}-plus5`}
                          onClick={() => handleAddPoints(student, 5)}
                          className="w-7 h-7 rounded border-2 border-slate-900 bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 font-extrabold transition-all cursor-pointer text-[10px] shadow-sm"
                          title="Award 5 Points"
                        >
                          +5
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Side stats & Streak tracker */}
          <div className="space-y-6">
            
            {/* Realtime Attendance donut representation */}
            <div className="bg-white rounded-2xl border-2 border-slate-900 p-6 shadow-bento">
              <h3 className="text-base font-black uppercase tracking-tight font-display text-slate-900 mb-4 flex items-center gap-2">
                <Check className="text-emerald-500 w-5 h-5 block border-2 border-slate-100 rounded-full" /> Roll Call Stats
              </h3>
              
              <div className="space-y-4">
                {[
                  { label: 'Present', count: currentClass.students.filter(s => !s.archived && s.attendance === 'present').length, color: 'bg-emerald-500' },
                  { label: 'Absent', count: currentClass.students.filter(s => !s.archived && s.attendance === 'absent').length, color: 'bg-rose-500' },
                  { label: 'Late', count: currentClass.students.filter(s => !s.archived && s.attendance === 'late').length, color: 'bg-amber-500' },
                  { label: 'Excused', count: currentClass.students.filter(s => !s.archived && s.attendance === 'excused').length, color: 'bg-sky-500' }
                ].map((item) => {
                  const total = currentClass.students.filter(s => !s.archived).length || 1;
                  const pct = Math.round((item.count / total) * 100);
                  
                  return (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                        <span>{item.label} ({item.count})</span>
                        <span className="text-slate-500">{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 border-2 border-slate-900 h-4 rounded-full overflow-hidden">
                        <div className={`${item.color} h-full rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Streak Board widget */}
            <div className="bg-white rounded-2xl border-2 border-slate-900 p-6 shadow-bento">
              <h3 className="text-base font-black uppercase tracking-tight font-display text-slate-900 mb-3 flex items-center gap-2">
                <Flame className="text-orange-500 w-5 h-5 fill-current" /> Hot Streaks
              </h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                Reciting points earned inside consecutive days! Keep the flame alive.
              </p>

              {currentClass.students.filter(s => !s.archived && s.streak > 0).length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs font-bold uppercase tracking-wider italic bg-slate-100 border-2 border-slate-900 rounded-xl">
                  No active recitations yet. Fire up points to initiate a class hot streak!
                </div>
              ) : (
                <div className="space-y-2 max-h-[180px] overflow-y-auto">
                  {currentClass.students
                    .filter(s => !s.archived && s.streak > 0)
                    .sort((a, b) => b.streak - a.streak)
                    .map((s, idx) => (
                      <div key={s.id} className="flex justify-between items-center p-2.5 rounded-lg border border-slate-900 bg-slate-50">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-extrabold">#{idx + 1}</span>
                          <span className="text-xs font-extrabold text-slate-800">{s.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-black text-amber-800 text-[10px] uppercase bg-amber-50 border border-amber-400 px-2.5 py-0.5 rounded-full select-none animate-pulse">
                          🔥 {s.streak} Days
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
