import React, { useState } from 'react';
import { Classroom, Student, Group } from '../types';
import { Users, Shuffle, Award, CheckCircle, RefreshCw, Star, Info } from 'lucide-react';
import { generateAvatarSvg } from '../utils/avatarUtils';

interface GroupMakerProps {
  currentClass: Classroom;
  onRecordEvent: (studentId: string, points: number, reason: string) => void;
  onUpdateStudents: (updatedStudents: Student[]) => void;
}

export default function GroupMaker({
  currentClass,
  onRecordEvent,
  onUpdateStudents
}: GroupMakerProps) {
  // Only students present/late and not archived are grouped
  const activeStudents = currentClass.students.filter(
    (s) => !s.archived && (s.attendance === 'present' || s.attendance === 'late')
  );

  const [groupMode, setGroupMode] = useState<'count' | 'size'>('count');
  const [targetNum, setTargetNum] = useState(3);
  const [generatedGroups, setGeneratedGroups] = useState<Group[]>([]);
  const [gradePoints, setGradePoints] = useState(2);
  const [gradeReason, setGradeReason] = useState('Excellent Group Session');
  
  // Notification logs
  const [notifySuccess, setNotifySuccess] = useState('');

  const handleMakeGroups = () => {
    if (activeStudents.length === 0) return;

    // Shuffle active students (Fisher-Yates)
    const shuffled = [...activeStudents];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const groups: Group[] = [];
    const numToAssign = Math.max(1, targetNum);

    if (groupMode === 'count') {
      // Divide into X groups as equally as possible
      for (let i = 0; i < numToAssign; i++) {
        groups.push({
          id: Math.random().toString(36).substring(2, 9),
          name: `Team ${String.fromCharCode(65 + i)}`, // Team A, B, C...
          studentIds: []
        });
      }

      shuffled.forEach((student, index) => {
        const groupIndex = index % numToAssign;
        groups[groupIndex].studentIds.push(student.id);
      });
    } else {
      // Divide into groups of size Y
      const totalGroups = Math.ceil(shuffled.length / numToAssign);
      for (let i = 0; i < totalGroups; i++) {
        groups.push({
          id: Math.random().toString(36).substring(2, 9),
          name: `Team ${i + 1}`,
          studentIds: []
        });
      }

      shuffled.forEach((student, index) => {
        const groupIndex = Math.floor(index / numToAssign);
        groups[groupIndex].studentIds.push(student.id);
      });
    }

    // Filter empty groups out (if any)
    const nonEmptyGroups = groups.filter((g) => g.studentIds.length > 0);
    setGeneratedGroups(nonEmptyGroups);
    setNotifySuccess('');
  };

  const handleGradeGroup = (group: Group) => {
    if (group.studentIds.length === 0) return;

    const actualAppliedCount: string[] = [];

    // Trigger Point Record & Updates
    const updated = currentClass.students.map((s) => {
      if (group.studentIds.includes(s.id)) {
        // Record log
        onRecordEvent(s.id, gradePoints, `${gradeReason} (${group.name})`);
        
        const today = new Date().toISOString().substring(0, 10);
        let newStreak = s.streak;
        if (gradePoints > 0 && s.lastRecitationDate !== today) {
          newStreak = s.streak + 1;
        }

        actualAppliedCount.push(s.name);

        return {
          ...s,
          points: Math.max(0, s.points + gradePoints),
          streak: newStreak,
          lastRecitationDate: gradePoints > 0 ? today : s.lastRecitationDate
        };
      }
      return s;
    });

    onUpdateStudents(updated);
    setNotifySuccess(`Successfully awarded +${gradePoints} points to all members in ${group.name}!`);
    
    // Clear notification after 4 secs
    setTimeout(() => {
      setNotifySuccess('');
    }, 4500);
  };

  return (
    <div className="space-y-6" id="group-maker-root">
      
      {/* Configuration Widget */}
      <div className="bg-white rounded-2xl border-2 border-slate-900 p-6 shadow-bento">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-violet-100 border-2 border-slate-900 text-violet-850 shadow-bento-sm">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight font-display text-slate-900">Dynamic Group Maker & Grading</h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Form instant study teams from present students and award points collectively.</p>
          </div>
        </div>

        {activeStudents.length === 0 ? (
          <div className="bg-slate-100 border-2 border-slate-900 rounded-2xl p-6 text-center text-slate-500 font-bold uppercase tracking-wider">
            Please make sure students are marked 'Present' or 'Late' in the Live Session tab before building teams.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div>
              <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-2">
                Grouping Strategy
              </label>
              <div className="flex rounded-xl bg-[#f1f5f9] p-1 border-2 border-slate-900 shadow-bento-sm">
                <button
                  type="button"
                  id="group-mode-count-btn"
                  onClick={() => { setGroupMode('count'); setTargetNum(3); }}
                  className={`flex-1 py-1.5 text-xs font-black uppercase rounded-lg cursor-pointer transition-all border ${
                    groupMode === 'count' ? 'bg-white text-slate-900 border-slate-900' : 'text-slate-500 border-transparent hover:text-slate-700'
                  }`}
                >
                  Number of Teams
                </button>
                <button
                  type="button"
                  id="group-mode-size-btn"
                  onClick={() => { setGroupMode('size'); setTargetNum(4); }}
                  className={`flex-1 py-1.5 text-xs font-black uppercase rounded-lg cursor-pointer transition-all border ${
                    groupMode === 'size' ? 'bg-white text-slate-900 border-slate-900' : 'text-slate-500 border-transparent hover:text-slate-700'
                  }`}
                >
                  Students per Team
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-2">
                {groupMode === 'count' ? 'Target Total Teams (A, B, C...)' : 'Target Team Member Capacity'}
              </label>
              <input
                type="number"
                min="1"
                max={activeStudents.length}
                value={targetNum}
                onChange={(e) => setTargetNum(parseInt(e.target.value) || 2)}
                className="w-full text-sm font-bold border-2 border-slate-900 rounded-xl px-3 py-2.5 focus:outline-none bg-white"
              />
            </div>

            <div>
              <button
                type="button"
                id="make-groups-btn"
                onClick={handleMakeGroups}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white border-2 border-slate-900 rounded-xl py-2.5 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-bento-sm hover:translate-x-[1px] hover:translate-y-[1px]"
              >
                <Shuffle className="w-4 h-4" /> Form Teams Now
              </button>
            </div>
          </div>
        )}
      </div>

      {generatedGroups.length > 0 && (
        <div className="space-y-4">
          
          {/* Universal Grading Bar */}
          <div className="bg-amber-100 border-2 border-slate-900 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-bento-sm">
            <div className="flex items-center gap-3">
              <Star className="text-amber-500 fill-current w-5 h-5 flex-shrink-0" />
              <div>
                <span className="font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-wide">Team Challenge Grading Tool</span>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Pick points below then click "Grade Team" on any team to instantly reward them all.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <input
                type="text"
                value={gradeReason}
                onChange={(e) => setGradeReason(e.target.value)}
                placeholder="Grade Reason"
                className="text-xs font-semibold border-2 border-slate-900 bg-white rounded-lg px-2.5 py-1.5 focus:outline-none min-w-[150px]"
              />

              <div className="flex rounded-lg bg-white border-2 border-slate-900 p-0.5 shadow-bento-sm">
                {[1, 2, 3, 5].map((pts) => (
                  <button
                    key={pts}
                    id={`team-grade-sel-${pts}`}
                    onClick={() => setGradePoints(pts)}
                    className={`px-2.5 py-1 text-xs font-bold rounded ${
                      gradePoints === pts ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    +{pts}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {notifySuccess && (
            <div className="bg-emerald-100 text-emerald-800 p-3.5 rounded-xl text-center text-xs font-black border-2 border-emerald-900 uppercase">
              {notifySuccess}
            </div>
          )}

          {/* Group Grid representation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="teams-grid">
            {generatedGroups.map((group) => (
              <div
                key={group.id}
                id={`group-card-${group.id}`}
                className="bg-white rounded-2xl border-2 border-slate-900 p-5 shadow-bento flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center border-b-2 border-slate-100 pb-3 mb-3.5">
                    <span className="text-base font-black font-display uppercase tracking-tight text-slate-900">{group.name}</span>
                    <span className="text-[10px] uppercase font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-md">
                      {group.studentIds.length} Members
                    </span>
                  </div>

                  <div className="space-y-2 mb-6">
                    {group.studentIds.map((sid) => {
                      const studentObj = currentClass.students.find((s) => s.id === sid);
                      if (!studentObj) return null;

                      return (
                        <div key={sid} className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full border-2 border-slate-900 bg-slate-100 flex-shrink-0 overflow-hidden">
                            <div
                              className="w-full h-full"
                              dangerouslySetInnerHTML={{ __html: generateAvatarSvg(studentObj.avatarSeed) }}
                            />
                          </div>
                          <span className="text-xs text-slate-800 font-extrabold truncate">{studentObj.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono ml-auto">({studentObj.points} PTS)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  id={`grade-group-btn-${group.id}`}
                  onClick={() => handleGradeGroup(group)}
                  className="w-full bg-slate-900 hover:bg-slate-850 text-white truncate text-xs font-black uppercase tracking-wider py-2.5 rounded-xl border-2 border-slate-900 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-bento-sm hover:translate-x-[1px] hover:translate-y-[1px]"
                >
                  <Award className="w-3.5 h-3.5 text-amber-300 fill-current" /> Grade {group.name} (+{gradePoints} PTS)
                </button>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
}
