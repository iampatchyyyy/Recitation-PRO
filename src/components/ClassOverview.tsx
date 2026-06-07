import React, { useState } from 'react';
import { Classroom, Student } from '../types';
import { Plus, Trash2, Upload, FileJson, Award, RefreshCw, Layers } from 'lucide-react';
import { getRandomSeed } from '../utils/avatarUtils';

interface ClassOverviewProps {
  currentClass: Classroom | null;
  onSelectClass: (c: Classroom) => void;
  classes: Classroom[];
  onAddClass: (name: string, subject: string) => void;
  onDeleteClass: (id: string) => void;
  onUpdateStudents: (updatedStudents: Student[]) => void;
  onExportBackup: () => void;
}

export default function ClassOverview({
  currentClass,
  onSelectClass,
  classes,
  onAddClass,
  onDeleteClass,
  onUpdateStudents,
  onExportBackup
}: ClassOverviewProps) {
  const [newClassName, setNewClassName] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [singleStudentName, setSingleStudentName] = useState('');
  const [csvText, setCsvText] = useState('');
  const [csvError, setCsvError] = useState('');
  const [csvSuccess, setCsvSuccess] = useState('');

  // Form submission
  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    onAddClass(newClassName.trim(), newSubject.trim());
    setNewClassName('');
    setNewSubject('');
  };

  const handleAddSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClass || !singleStudentName.trim()) return;

    // Check duplicate
    const exists = currentClass.students.some(
      (s) => s.name.toLowerCase() === singleStudentName.trim().toLowerCase()
    );

    if (exists) {
      alert('A student with this name already exists!');
      return;
    }

    const newStudent: Student = {
      id: Math.random().toString(36).substring(2, 9),
      name: singleStudentName.trim(),
      avatarSeed: getRandomSeed(),
      points: 0,
      streak: 0,
      attendance: 'present'
    };

    onUpdateStudents([...currentClass.students, newStudent]);
    setSingleStudentName('');
  };

  // CSV Import
  const handleImportCsv = () => {
    if (!currentClass) return;
    if (!csvText.trim()) {
      setCsvError('Please paste some text/CSV first.');
      return;
    }

    setCsvError('');
    setCsvSuccess('');

    // Parse CSV: handles commas, semicolons, or simple newlines
    const rawLines = csvText.split(/[\r\n]+/);
    const parsedStudents: Student[] = [];
    let duplicatesCount = 0;

    rawLines.forEach((line) => {
      const parts = line.split(/[;,]/);
      parts.forEach((part) => {
        const trimmed = part.trim();
        if (trimmed.length > 0) {
          // Check for duplication in existing
          const isDuplicateInClass = currentClass.students.some(
            (s) => s.name.toLowerCase() === trimmed.toLowerCase()
          );
          // Check for duplication in currently parsing
          const isDuplicateInImport = parsedStudents.some(
            (s) => s.name.toLowerCase() === trimmed.toLowerCase()
          );

          if (isDuplicateInClass || isDuplicateInImport) {
            duplicatesCount++;
            return;
          }

          parsedStudents.push({
            id: Math.random().toString(36).substring(2, 9),
            name: trimmed,
            avatarSeed: getRandomSeed(),
            points: 0,
            streak: 0,
            attendance: 'present'
          });
        }
      });
    });

    if (parsedStudents.length === 0) {
      setCsvError('No valid new student names found in this content.');
      return;
    }

    onUpdateStudents([...currentClass.students, ...parsedStudents]);
    setCsvSuccess(`Successfully imported ${parsedStudents.length} new students!${duplicatesCount > 0 ? ` (${duplicatesCount} duplicates skipped)` : ''}`);
    setCsvText('');
  };

  const handleDeleteStudent = (studentId: string) => {
    if (!currentClass) return;
    if (confirm('Are you sure you want to remove this student?')) {
      onUpdateStudents(currentClass.students.filter((s) => s.id !== studentId));
    }
  };

  const handleResetPoints = () => {
    if (!currentClass) return;
    if (confirm('Reset ALL recitation points and streaks to zero for this class? This cannot be undone.')) {
      const resetList = currentClass.students.map((s) => ({
        ...s,
        points: 0,
        streak: 0
      }));
      onUpdateStudents(resetList);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="class-overview-root">
      
      {/* Column 1 & 2: Class switcher and Student roster */}
      <div className="lg:col-span-2 space-y-6">
        {/* Class selector */}
        <div className="bg-white rounded-2xl border-2 border-slate-900 p-6 shadow-bento">
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight font-display mb-4 flex items-center gap-2">
            <Layers className="text-indigo-600 w-5 h-5" /> Select Active Class
          </h2>
          
          {classes.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm font-bold uppercase tracking-wider italic">
              No classes created yet. Use the right panel to quick-start your first class!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
              {classes.map((cls) => (
                <button
                  key={cls.id}
                  id={`class-select-btn-${cls.id}`}
                  onClick={() => onSelectClass(cls)}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer ${
                    currentClass?.id === cls.id
                      ? 'border-slate-900 bg-indigo-50 shadow-bento-sm'
                      : 'border-slate-900 bg-white hover:bg-slate-50 shadow-none'
                  }`}
                >
                  <div className="font-black text-slate-900 text-base font-display uppercase tracking-tight">{cls.name}</div>
                  <div className="text-xs text-slate-600 mt-2 flex justify-between items-center font-bold">
                    <span className="uppercase tracking-wider">{cls.subject || 'No Subject'}</span>
                    <span className="bg-slate-900 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase">
                      {cls.students.length} students
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Student Roster List */}
        {currentClass && (
          <div className="bg-white rounded-2xl border-2 border-slate-900 p-6 shadow-bento">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-slate-200 pb-4 mb-4 gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 font-display uppercase tracking-tight flex items-center gap-2">
                  <Award className="text-amber-500 w-5 h-5" /> Roster — {currentClass.name}
                </h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
                  Update rosters, view seeds, or configure points resets
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="reset-points-btn"
                  onClick={handleResetPoints}
                  className="bg-rose-100 text-rose-800 border-2 border-slate-900 hover:bg-rose-200 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-bento-sm hover:translate-x-[1px] hover:translate-y-[1px]"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Reset Class
                </button>
                <button
                  id="export-backup-btn"
                  onClick={onExportBackup}
                  className="bg-amber-100 text-amber-900 border-2 border-slate-900 hover:bg-amber-200 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-bento-sm hover:translate-x-[1px] hover:translate-y-[1px]"
                >
                  <FileJson className="w-3.5 h-3.5" /> JSON Backup
                </button>
              </div>
            </div>

            {/* Quick stats on the class */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-[#f1f5f9] border-2 border-slate-900 p-3.5 rounded-xl text-center shadow-bento-sm">
                <div className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">Total Class Points</div>
                <div className="text-xl font-black text-slate-900 font-display">
                  {currentClass.students.reduce((acc, s) => acc + s.points, 0)}
                </div>
              </div>
              <div className="bg-[#f1f5f9] border-2 border-slate-900 p-3.5 rounded-xl text-center shadow-bento-sm">
                <div className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">Average Points</div>
                <div className="text-xl font-black text-slate-900 font-display">
                  {currentClass.students.length > 0
                    ? (currentClass.students.reduce((acc, s) => acc + s.points, 0) / currentClass.students.length).toFixed(1)
                    : '0'}
                </div>
              </div>
              <div className="bg-[#f1f5f9] border-2 border-slate-900 p-3.5 rounded-xl text-center shadow-bento-sm">
                <div className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">Streak Record</div>
                <div className="text-xl font-black text-slate-900 font-display">
                  {currentClass.students.length > 0
                    ? Math.max(...currentClass.students.map((s) => s.streak))
                    : '0'}
                </div>
              </div>
            </div>

            {currentClass.students.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm italic font-bold">
                This class has no students yet. Quick add some names or import a CSV on the side panel!
              </div>
            ) : (
              <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 pr-1">
                {currentClass.students.map((student, idx) => (
                  <div key={student.id} className="py-2.5 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 font-black w-5">{idx + 1}</span>
                      <div className="w-9 h-9 rounded-full border-2 border-slate-950 bg-slate-100 overflow-hidden flex-shrink-0">
                        {/* Dynamic Avatar */}
                        <div
                          className="w-full h-full"
                          dangerouslySetInnerHTML={{
                            __html: requireAvatar(student.avatarSeed)
                          }}
                        />
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900 text-sm tracking-tight">{student.name}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          ID: {student.id} | SEED: {student.avatarSeed}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs font-black uppercase text-slate-900">{student.points} PTS</div>
                        {student.streak > 0 && (
                          <div className="text-[11px] font-black tracking-wider text-amber-700 uppercase mt-0.5">
                            🔥 {student.streak} STREAK
                          </div>
                        )}
                      </div>
                      <button
                        id={`delete-student-btn-${student.id}`}
                        onClick={() => handleDeleteStudent(student.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all cursor-pointer border border-transparent hover:border-slate-900"
                        title="Delete Student"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Column 3: Tools & Creators */}
      <div className="space-y-6">
        
        {/* Create Classroom Form */}
        <div className="bg-white rounded-2xl border-2 border-slate-900 p-6 shadow-bento">
          <h2 className="text-base font-black text-slate-900 uppercase tracking-tight font-display mb-4">Create New Class</h2>
          <form onSubmit={handleCreateClass} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
                Class / Section Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Grade 10 A, Physics IV"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                className="w-full text-sm border-2 border-slate-900 rounded-xl px-3 py-2.5 focus:outline-none bg-white font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
                Subject (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Science, Literature, Calculus"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="w-full text-sm border-2 border-slate-900 rounded-xl px-3 py-2.5 focus:outline-none bg-white font-bold"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white border-2 border-slate-900 rounded-xl py-2.5 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-bento-sm hover:translate-x-[1px] hover:translate-y-[1px]"
            >
              <Plus className="w-4 h-4" /> Create Class Session
            </button>
          </form>
        </div>

        {/* Add Students Block */}
        {currentClass && (
          <div className="bg-white rounded-2xl border-2 border-slate-900 p-6 shadow-bento space-y-5">
            <div>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-tight font-display mb-3">Add Student (Individual)</h2>
              <form onSubmit={handleAddSingleStudent} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Student Full Name"
                  value={singleStudentName}
                  onChange={(e) => setSingleStudentName(e.target.value)}
                  className="flex-1 text-sm border-2 border-slate-900 rounded-xl px-3 py-2 focus:outline-none bg-white font-bold"
                />
                <button
                  type="submit"
                  id="add-single-student-btn"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white border-2 border-slate-900 rounded-xl px-4 py-2 text-sm font-black transition-all flex items-center justify-center cursor-pointer shadow-bento-sm hover:translate-x-[1px] hover:translate-y-[1px]"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </form>
            </div>

            <div className="border-t-2 border-slate-150 pt-4">
              <h2 className="text-base font-black text-slate-900 uppercase tracking-tight font-display mb-1">CSV / Student List Import</h2>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                Paste student names separated by commas or lines.
              </p>
              
              <div className="space-y-3">
                <textarea
                  id="csv-textarea"
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="Alice Smith&#10;Bob Jones&#10;Charlie Brown"
                  className="w-full h-24 text-xs font-mono border-2 border-slate-900 rounded-xl p-2.5 focus:outline-none bg-white resize-none font-bold"
                />

                {csvError && (
                  <div className="bg-rose-100 border-2 border-rose-900 text-rose-800 p-2.5 rounded-lg text-xs font-bold">
                    {csvError}
                  </div>
                )}
                
                {csvSuccess && (
                  <div className="bg-emerald-100 border-2 border-emerald-900 text-emerald-800 p-2.5 rounded-lg text-xs font-bold">
                    {csvSuccess}
                  </div>
                )}

                <button
                  type="button"
                  id="csv-import-submit-btn"
                  onClick={handleImportCsv}
                  className="w-full bg-slate-900 text-white hover:bg-slate-800 border-2 border-slate-900 rounded-xl py-2.5 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-bento-sm hover:translate-x-[1px] hover:translate-y-[1px]"
                >
                  <Upload className="w-3.5 h-3.5" /> Parse & Add Students
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// Inline loader for custom generated SVGs to avoid complex state callbacks
import { generateAvatarSvg } from '../utils/avatarUtils';
function requireAvatar(seed: string): string {
  return generateAvatarSvg(seed);
}
