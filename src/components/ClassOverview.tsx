import React, { useState } from 'react';
import { Classroom, Student } from '../types';
import { 
  Plus, 
  Trash2, 
  Upload, 
  FileJson, 
  Award, 
  RefreshCw, 
  Layers,
  Edit2,
  Archive,
  AlertTriangle,
  X,
  Check,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FolderOpen
} from 'lucide-react';
import { getRandomSeed } from '../utils/avatarUtils';

interface ClassOverviewProps {
  currentClass: Classroom | null;
  onSelectClass: (c: Classroom) => void;
  classes: Classroom[];
  onAddClass: (name: string, subject: string) => void;
  onDeleteClass: (id: string) => void;
  onUpdateStudents: (updatedStudents: Student[]) => void;
  onExportBackup: () => void;
  onMoveStudent: (studentId: string, fromClassId: string, toClassId: string) => void;
  onUpdateClassDetails: (classId: string, name: string, subject: string) => void;
}

export default function ClassOverview({
  currentClass,
  onSelectClass,
  classes,
  onAddClass,
  onDeleteClass,
  onUpdateStudents,
  onExportBackup,
  onMoveStudent,
  onUpdateClassDetails
}: ClassOverviewProps) {
  const [newClassName, setNewClassName] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [singleStudentName, setSingleStudentName] = useState('');
  const [csvText, setCsvText] = useState('');
  const [csvError, setCsvError] = useState('');
  const [csvSuccess, setCsvSuccess] = useState('');

  // States for Class Editing Info
  const [isEditingClass, setIsEditingClass] = useState(false);
  const [editClassName, setEditClassName] = useState('');
  const [editClassSubject, setEditClassSubject] = useState('');

  // Custom Confirmation Modal State (replaces blocking confirm window)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'deleteClass' | 'resetPoints' | 'deleteStudent' | 'archiveStudent' | null;
    studentId?: string;
    studentName?: string;
  }>({
    isOpen: false,
    type: null
  });

  // Edit Student Details Modal State
  const [editStudentDetails, setEditStudentDetails] = useState<{
    isOpen: boolean;
    student: Student | null;
    editName: string;
    editPoints: number;
    editStreak: number;
    editSeed: string;
  }>({
    isOpen: false,
    student: null,
    editName: '',
    editPoints: 0,
    editStreak: 0,
    editSeed: ''
  });

  // Toggle state to collapse or expand archived list view
  const [showArchivedList, setShowArchivedList] = useState(false);

  // States for Student Moving row picker
  const [movingStudentId, setMovingStudentId] = useState<string | null>(null);

  // States for controlling create class and add student modals
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);

  // Form submission
  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    onAddClass(newClassName.trim(), newSubject.trim());
    setNewClassName('');
    setNewSubject('');
    setIsCreateClassOpen(false);
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

  // CSV Import Method
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

  // Custom Modal confirm action triggers
  const triggerConfirmDeleteClass = () => {
    if (!currentClass) return;
    setConfirmModal({
      isOpen: true,
      type: 'deleteClass'
    });
  };

  const triggerConfirmResetPoints = () => {
    if (!currentClass) return;
    setConfirmModal({
      isOpen: true,
      type: 'resetPoints'
    });
  };

  const triggerConfirmDeleteStudent = (studentId: string, studentName: string) => {
    setConfirmModal({
      isOpen: true,
      type: 'deleteStudent',
      studentId,
      studentName
    });
  };

  const executeConfirmedAction = () => {
    if (!currentClass) return;

    if (confirmModal.type === 'deleteClass') {
      onDeleteClass(currentClass.id);
    } else if (confirmModal.type === 'resetPoints') {
      const resetList = currentClass.students.map((s) => ({
        ...s,
        points: 0,
        streak: 0
      }));
      onUpdateStudents(resetList);
    } else if (confirmModal.type === 'deleteStudent' && confirmModal.studentId) {
      onUpdateStudents(currentClass.students.filter((s) => s.id !== confirmModal.studentId));
    }

    // Reset confirmation modal state
    setConfirmModal({
      isOpen: false,
      type: null
    });
  };

  const handleToggleArchiveStudent = (studentId: string) => {
    if (!currentClass) return;
    const updated = currentClass.students.map((s) => {
      if (s.id === studentId) {
        return { ...s, archived: !s.archived };
      }
      return s;
    });
    onUpdateStudents(updated);
  };

  const startEditStudentModal = (student: Student) => {
    setEditStudentDetails({
      isOpen: true,
      student,
      editName: student.name,
      editPoints: student.points,
      editStreak: student.streak,
      editSeed: student.avatarSeed
    });
  };

  const handleSaveStudentDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClass || !editStudentDetails.student || !editStudentDetails.editName.trim()) return;

    const studentId = editStudentDetails.student.id;
    const isDuplicate = currentClass.students.some(
      (s) => s.id !== studentId && s.name.toLowerCase() === editStudentDetails.editName.trim().toLowerCase()
    );

    if (isDuplicate) {
      alert('A student with this name already exists in this class!');
      return;
    }

    const updated = currentClass.students.map((s) => {
      if (s.id === studentId) {
        return {
          ...s,
          name: editStudentDetails.editName.trim(),
          points: Math.max(0, Number(editStudentDetails.editPoints)),
          streak: Math.max(0, Number(editStudentDetails.editStreak)),
          avatarSeed: editStudentDetails.editSeed.trim() || s.avatarSeed
        };
      }
      return s;
    });

    onUpdateStudents(updated);
    setEditStudentDetails({
      isOpen: false,
      student: null,
      editName: '',
      editPoints: 0,
      editStreak: 0,
      editSeed: ''
    });
  };

  const startEditingClass = () => {
    if (!currentClass) return;
    setEditClassName(currentClass.name);
    setEditClassSubject(currentClass.subject || '');
    setIsEditingClass(true);
  };

  const handleSaveClassEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClass || !editClassName.trim()) return;
    onUpdateClassDetails(currentClass.id, editClassName.trim(), editClassSubject.trim());
    setIsEditingClass(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="class-overview-root">
      
      {/* Column 1: Classes switcher sidebar */}
      <div className="lg:col-span-1 space-y-6">
        {/* Class selector */}
        <div className="bg-white rounded-2xl border-2 border-slate-900 p-6 shadow-bento">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight font-display flex items-center gap-2">
              <Layers className="text-indigo-600 w-5 h-5" /> My Classes
            </h2>
            <button
              onClick={() => setIsCreateClassOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white border-2 border-slate-900 rounded-lg px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shadow-bento-sm hover:translate-x-[1px] hover:translate-y-[1px]"
              title="Create a new class session"
            >
              <Plus className="w-3.5 h-3.5" /> Create Class
            </button>
          </div>
          
          {classes.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm font-bold uppercase tracking-wider italic">
              No classes created yet. Click "Create Class" above to quick-start your first class!
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 pb-2">
              {classes.map((cls) => (
                <button
                  key={cls.id}
                  id={`class-select-btn-${cls.id}`}
                  onClick={() => {
                    onSelectClass(cls);
                    setIsEditingClass(false);
                  }}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer ${
                    currentClass?.id === cls.id
                      ? 'border-slate-900 bg-indigo-50 shadow-bento-sm'
                      : 'border-slate-900 bg-white hover:bg-slate-50 shadow-none'
                  }`}
                >
                  <div className="font-black text-slate-900 text-base font-display uppercase tracking-tight">{cls.name}</div>
                  <div className="text-xs text-slate-600 mt-2 flex justify-between items-center font-bold">
                    <span className="uppercase tracking-wider truncate max-w-[120px]">{cls.subject || 'No Subject'}</span>
                    <span className="bg-slate-900 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase">
                      {cls.students.length} students
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Column 2 & 3: Student roster */}
      <div className="lg:col-span-2 space-y-6">
        {/* Student Roster List */}
        {currentClass && (
          <div className="bg-white rounded-2xl border-2 border-slate-900 p-6 shadow-bento">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-slate-200 pb-4 mb-4 gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 font-display uppercase tracking-tight flex items-center gap-2">
                  <Award className="text-amber-500 w-5 h-5" /> Roster — {currentClass.name}
                </h3>
                {currentClass.subject && (
                  <p className="text-[11px] font-black text-indigo-600 uppercase tracking-wider">
                    Subject Area: {currentClass.subject}
                  </p>
                )}
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Manage profiles, edit roster names, transfer classes, or reset standings
                </p>
              </div>              
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(true)}
                  className="bg-emerald-600 text-white border-2 border-slate-900 hover:bg-emerald-700 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-bento-sm hover:translate-x-[1px] hover:translate-y-[1px]"
                  title="Add individual profiles or import roster list"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Student
                </button>
                <button
                  onClick={startEditingClass}
                  className="bg-indigo-50 text-indigo-900 border-2 border-slate-900 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shadow-bento-sm hover:translate-x-[1px] hover:translate-y-[1px]"
                >
                  Rename Class
                </button>
                <button
                  onClick={triggerConfirmDeleteClass}
                  className="bg-rose-50 text-rose-900 border-2 border-slate-900 hover:bg-rose-100 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shadow-bento-sm hover:translate-x-[1px] hover:translate-y-[1px]"
                >
                  Delete Class
                </button>
                <button
                  id="reset-points-btn"
                  onClick={triggerConfirmResetPoints}
                  className="bg-[#f8fafc] text-slate-700 border-2 border-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-bento-sm hover:translate-x-[1px] hover:translate-y-[1px]"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Reset Points
                </button>
              </div>
            </div>

            {/* Editing Classroom Details Block */}
            {isEditingClass && (
              <div className="bg-indigo-50/50 border-2 border-dashed border-indigo-400 p-4 rounded-xl mb-4 animate-scaleIn">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-indigo-950 mb-3">Modify Class Details</h4>
                <form onSubmit={handleSaveClassEdit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Class / Section Name</label>
                    <input 
                      type="text" 
                      value={editClassName} 
                      onChange={(e) => setEditClassName(e.target.value)} 
                      required
                      className="w-full text-xs font-bold border-2 border-slate-900 rounded-lg px-2.5 py-1.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Subject (Optional)</label>
                    <input 
                      type="text" 
                      value={editClassSubject} 
                      onChange={(e) => setEditClassSubject(e.target.value)} 
                      className="w-full text-xs font-bold border-2 border-slate-900 rounded-lg px-2.5 py-1.5 bg-white"
                    />
                  </div>
                  <div className="sm:col-span-2 flex justify-end gap-2 mt-1">
                    <button 
                      type="button" 
                      onClick={() => setIsEditingClass(false)}
                      className="border-2 border-slate-900 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider shadow-bento-sm cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="bg-indigo-600 text-white border-2 border-slate-900 hover:bg-indigo-700 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider shadow-bento-sm cursor-pointer"
                    >
                      Save Details
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Quick stats on the class */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-[#f1f5f9] border-2 border-slate-900 p-3.5 rounded-xl text-center shadow-bento-sm">
                <div className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">Active Class Points</div>
                <div className="text-xl font-black text-slate-900 font-display">
                  {currentClass.students.filter(s => !s.archived).reduce((acc, s) => acc + s.points, 0)}
                </div>
              </div>
              <div className="bg-[#f1f5f9] border-2 border-slate-900 p-3.5 rounded-xl text-center shadow-bento-sm">
                <div className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">Average Points</div>
                <div className="text-xl font-black text-slate-900 font-display">
                  {currentClass.students.filter(s => !s.archived).length > 0
                    ? (currentClass.students.filter(s => !s.archived).reduce((acc, s) => acc + s.points, 0) / currentClass.students.filter(s => !s.archived).length).toFixed(1)
                    : '0'}
                </div>
              </div>
              <div className="bg-[#f1f5f9] border-2 border-slate-900 p-3.5 rounded-xl text-center shadow-bento-sm">
                <div className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 mb-1">Streak Record</div>
                <div className="text-xl font-black text-slate-900 font-display">
                  {currentClass.students.filter(s => !s.archived && s.streak > 0).length > 0
                    ? Math.max(...currentClass.students.filter(s => !s.archived).map((s) => s.streak))
                    : '0'}
                </div>
              </div>
            </div>

            {/* Filter active and archive buckets */}
            {(() => {
              const activeStudentsList = currentClass.students.filter(s => !s.archived);
              const archivedStudentsList = currentClass.students.filter(s => s.archived);

              return (
                <>
                  {activeStudentsList.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm italic font-bold border-2 border-dashed border-slate-200 rounded-2xl">
                      This class has no active students yet. Quick add some names or import a CSV on the side panel!
                    </div>
                  ) : (
                    <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 pr-1 space-y-1">
                      {activeStudentsList.map((student, idx) => (
                        <div key={student.id} className="py-2.5 flex flex-col justify-center">
                          <div className="flex items-center justify-between gap-3 group">
                            
                            {/* Student Details Column */}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span className="text-xs text-slate-400 font-black w-5">{idx + 1}</span>
                              <div className="w-9 h-9 rounded-full border-2 border-slate-950 bg-slate-100 overflow-hidden flex-shrink-0">
                                <div
                                  className="w-full h-full"
                                  dangerouslySetInnerHTML={{
                                    __html: requireAvatar(student.avatarSeed)
                                  }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <div className="font-extrabold text-slate-900 text-sm tracking-tight truncate max-w-[200px]">{student.name}</div>
                                </div>
                                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                  ID: {student.id} | Status: <span className="text-indigo-600 font-extrabold">{student.attendance}</span>
                                </div>
                              </div>
                            </div>

                            {/* Point details and roster actions */}
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className="text-right min-w-[65px]">
                                <div className="text-xs font-black uppercase text-slate-900">{student.points} PTS</div>
                                {student.streak > 0 && (
                                  <div className="text-[10px] font-black tracking-wider text-amber-700 uppercase mt-0.5">
                                    🔥 {student.streak} Streak
                                  </div>
                                )}
                              </div>
                              
                              {/* Roster Row Operations buttons (Always visible to promote ease-of-use) */}
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => startEditStudentModal(student)}
                                  className="p-1 px-2.5 bg-indigo-50 border border-slate-900 hover:bg-indigo-150 text-indigo-900 rounded-lg text-[10px] font-black uppercase tracking-tight flex items-center gap-1 transition-all cursor-pointer shadow-sm hover:translate-y-[1px]"
                                  title="Edit student profile details"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span className="hidden md:inline">Edit</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setMovingStudentId(movingStudentId === student.id ? null : student.id)}
                                  className={`p-1 px-2.5 border border-slate-900 rounded-lg text-[10px] font-black uppercase tracking-tight flex items-center gap-1 transition-all cursor-pointer shadow-sm hover:translate-y-[1px] ${
                                    movingStudentId === student.id
                                      ? 'bg-amber-100 text-amber-900 border-amber-500'
                                      : 'bg-emerald-50 text-emerald-950 hover:bg-emerald-100'
                                  }`}
                                  title="Transfer student to another classroom session"
                                >
                                  <Layers className="w-3 h-3" />
                                  <span className="hidden md:inline">Transfer</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleToggleArchiveStudent(student.id)}
                                  className="p-1 px-2.5 bg-slate-50 border border-slate-900 hover:bg-slate-100 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-tight flex items-center gap-1 transition-all cursor-pointer shadow-sm hover:translate-y-[1px]"
                                  title="Archive student model representation"
                                >
                                  <Archive className="w-3 h-3" />
                                  <span className="hidden md:inline">Archive</span>
                                </button>

                                <button
                                  type="button"
                                  id={`delete-student-btn-${student.id}`}
                                  onClick={() => triggerConfirmDeleteStudent(student.id, student.name)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                                  title="Delete Student from entire profile roster"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                          </div>

                          {/* Moving student selectors overlay below active student row */}
                          {movingStudentId === student.id && (
                            <div className="p-3 bg-indigo-50/50 border-2 border-indigo-200 border-dashed rounded-xl mb-3 ml-8 mt-2 space-y-2 animate-scaleIn">
                              <div className="text-[9px] font-black uppercase text-indigo-900 tracking-wider">Move {student.name} to classroom:</div>
                              <div className="flex flex-wrap gap-1.5 font-sans">
                                {classes.filter((c) => c.id !== currentClass.id).length === 0 ? (
                                  <div className="text-[10px] italic font-bold text-slate-500 uppercase tracking-wide">
                                    Create another class first to enable student transfers! Use "Create New Class" card on the right.
                                  </div>
                                ) : (
                                  classes
                                    .filter((c) => c.id !== currentClass.id)
                                    .map((targetCls) => (
                                      <button
                                        key={targetCls.id}
                                        onClick={() => {
                                          onMoveStudent(student.id, currentClass.id, targetCls.id);
                                          setMovingStudentId(null);
                                        }}
                                        className="bg-white hover:bg-indigo-100 border-2 border-slate-900 text-slate-900 px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all shadow-bento-sm hover:translate-y-[1px] cursor-pointer"
                                      >
                                        Move to {targetCls.name}
                                      </button>
                                    ))
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Class Archived list Collapsing block */}
                  {archivedStudentsList.length > 0 && (
                    <div className="mt-6 border-t-2 border-slate-200 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowArchivedList(!showArchivedList)}
                        className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#f8fafc] border-2 border-slate-900 hover:bg-slate-100 text-left font-black uppercase text-xs text-slate-700 tracking-wider transition-all cursor-pointer shadow-bento-sm"
                      >
                        <span className="flex items-center gap-2">
                          <Archive className="w-4 h-4 text-slate-600" />
                          Archived Student Roster ({archivedStudentsList.length})
                        </span>
                        {showArchivedList ? <ChevronUp className="w-4 h-4 text-slate-800" /> : <ChevronDown className="w-4 h-4 text-slate-800" />}
                      </button>

                      {showArchivedList && (
                        <div className="mt-2 text-xs divide-y divide-slate-150 max-h-[220px] overflow-y-auto pr-1 space-y-1">
                          {archivedStudentsList.map((student, archiveIdx) => (
                            <div key={student.id} className="py-2.5 flex items-center justify-between bg-zinc-50 border border-slate-200 rounded-xl px-3 animate-scaleIn">
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] text-slate-400 font-black">#{archiveIdx + 1}</span>
                                <div className="w-7 h-7 rounded-full border border-slate-950 bg-white overflow-hidden flex-shrink-0">
                                  <div
                                    className="w-full h-full"
                                    dangerouslySetInnerHTML={{
                                      __html: requireAvatar(student.avatarSeed)
                                    }}
                                  />
                                </div>
                                <div>
                                  <span className="font-extrabold text-slate-800 text-sm line-through decoration-slate-400 decoration-1">{student.name}</span>
                                  <div className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider mt-0.5">
                                    Last Points: {student.points} | RecStreak: {student.streak}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleArchiveStudent(student.id)}
                                  className="px-2.5 py-1 bg-indigo-50 border border-slate-900 rounded-lg text-[9px] font-black uppercase text-indigo-900 hover:bg-indigo-100 transition-all cursor-pointer shadow-sm flex items-center gap-1"
                                  title="Restore student to active roster table"
                                >
                                  <RefreshCw className="w-3 h-3" /> Restoration
                                </button>
                                <button
                                  type="button"
                                  onClick={() => triggerConfirmDeleteStudent(student.id, student.name)}
                                  className="p-1 px-1.5 bg-rose-50 border border-slate-900 text-rose-950 hover:bg-rose-100 rounded-lg transition-all cursor-pointer shadow-sm"
                                  title="Permanently Delete student from entire classroom database"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Floating bento overlay modals for Create Class and Add Student */}
      {isCreateClassOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn text-left text-slate-800">
          <div className="bg-white border-4 border-slate-900 rounded-3xl p-6 max-w-md w-full shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] relative animate-scaleIn space-y-4 font-sans">
            <div className="flex items-center justify-between border-b-2 border-slate-150 pb-3">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight font-display flex items-center gap-2">
                <Layers className="text-indigo-600 w-5 h-5" /> Create New Class
              </h3>
              <button 
                onClick={() => setIsCreateClassOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg border border-transparent hover:border-slate-900 transition-all cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-800" />
              </button>
            </div>

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

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateClassOpen(false)}
                  className="px-4 py-2 border-2 border-slate-900 bg-white hover:bg-slate-50 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm h-10 flex items-center justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white border-2 border-slate-900 hover:bg-indigo-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm h-10 flex items-center justify-center"
                >
                  Create Class Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddStudentOpen && currentClass && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn text-left text-slate-800">
          <div className="bg-white border-4 border-slate-900 rounded-3xl p-6 max-w-lg w-full shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] relative animate-scaleIn space-y-4 font-sans">
            <div className="flex items-center justify-between border-b-2 border-slate-150 pb-3">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight font-display flex items-center gap-2">
                <Plus className="text-emerald-600 w-5 h-5" /> Add Student to {currentClass.name}
              </h3>
              <button 
                onClick={() => setIsAddStudentOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg border border-transparent hover:border-slate-900 transition-all cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-800" />
              </button>
            </div>

            {/* Quick Individual Add Form */}
            <div className="bg-slate-50 border-2 border-slate-900 p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Quick Individual Student</h4>
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
                  className="bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-slate-900 rounded-xl px-4 py-2 text-sm font-black transition-all flex items-center justify-center cursor-pointer shadow-bento-sm hover:translate-x-[1px] hover:translate-y-[1px]"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </form>
            </div>

            {/* CSV list-based importer Block */}
            <div className="border-t-2 border-slate-150 pt-4 space-y-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">Bulk Student List Import (CSV/Line Break)</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                Paste student names separated by commas or lines. Duplicates are auto-skipped.
              </p>
              
              <div className="space-y-3">
                <textarea
                  id="csv-textarea"
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="Alice Smith&#10;Bob Jones&#10;Charlie Brown"
                  className="w-full h-28 text-xs font-mono border-2 border-slate-900 rounded-xl p-2.5 focus:outline-none bg-white resize-none font-bold"
                />

                {csvError && (
                  <div className="bg-rose-50 border-2 border-rose-900 text-rose-800 p-2.5 rounded-lg text-[10px] font-extrabold uppercase">
                    🚫 {csvError}
                  </div>
                )}
                
                {csvSuccess && (
                  <div className="bg-emerald-50 border-2 border-emerald-900 text-emerald-800 p-2.5 rounded-lg text-[10px] font-extrabold uppercase animate-pulse">
                    ✅ {csvSuccess}
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

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsAddStudentOpen(false)}
                className="px-5 py-2 border-2 border-slate-900 bg-white hover:bg-slate-50 rounded-xl text-xs font-black uppercase tracking-wider h-10 transition-all cursor-pointer flex items-center justify-center"
              >
                Close / Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer Custom Confirmation Dialog */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border-4 border-slate-900 rounded-3xl p-6 max-w-md w-full shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] relative animate-scaleIn space-y-4 font-sans">
            <div className="flex items-center justify-between border-b-2 border-slate-150 pb-3">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight font-display flex items-center gap-2">
                <AlertTriangle className="text-amber-500 w-5 h-5 animate-bounce" /> Safety Action Notice
              </h3>
              <button 
                onClick={() => setConfirmModal({ isOpen: false, type: null })}
                className="p-1 hover:bg-slate-100 rounded-lg border border-transparent hover:border-slate-900 transition-all cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-800" />
              </button>
            </div>

            {/* Disclaimer Highlight Box */}
            <div className="bg-amber-50 border-2 border-amber-500 p-4 rounded-xl space-y-2">
              <div className="text-[10px] font-extrabold uppercase text-amber-900 tracking-widest flex items-center gap-1">
                ⚠️ ADMINISTRATIVE DISCLAIMER
              </div>
              <p className="text-xs font-bold leading-relaxed text-slate-700 uppercase tracking-tight">
                {confirmModal.type === 'deleteClass' && (
                  `This action will permanently delete "${currentClass?.name}" from connected servers. This purges all student profiles, points standings, attendance histories, and graded items. Once executing, this state is irreversible.`
                )}
                {confirmModal.type === 'resetPoints' && (
                  `This action will instantly wipe all active recitation points and streaks to zero for all students in "${currentClass?.name}". Leaderboard standings for the semester/term will be cleared. Historical session charts remain untouched.`
                )}
                {confirmModal.type === 'deleteStudent' && (
                  `You are about to permanently remove "${confirmModal.studentName}" from the roster. This purges their progress, attendance stats, and event logs. They will no longer qualify for spin wheels or group sessions.`
                )}
              </p>
            </div>

            <div className="bg-slate-50 border-2 border-slate-900 p-3 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
              Clicking below commits other active tabs and cloud databases.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmModal({ isOpen: false, type: null })}
                className="px-4 py-2 border-2 border-slate-900 bg-white hover:bg-slate-50 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm h-10 flex items-center justify-center"
              >
                Cancel / Abort
              </button>
              <button
                onClick={executeConfirmedAction}
                className="px-4 py-2 bg-rose-600 text-white border-2 border-slate-900 hover:bg-rose-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm h-10 flex items-center justify-center"
              >
                {confirmModal.type === 'deleteClass' && "Yes, Purge Classroom"}
                {confirmModal.type === 'resetPoints' && "Yes, Wipe Standings"}
                {confirmModal.type === 'deleteStudent' && "Yes, Remove Student"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Details Modal */}
      {editStudentDetails.isOpen && editStudentDetails.student && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <form 
            onSubmit={handleSaveStudentDetails}
            className="bg-white border-4 border-slate-900 rounded-3xl p-6 max-w-md w-full shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] relative animate-scaleIn space-y-4 font-sans text-left"
          >
            <div className="flex items-center justify-between border-b-2 border-slate-150 pb-3">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight font-display flex items-center gap-2">
                <Sparkles className="text-indigo-500 w-5 h-5" /> Edit Student Profile
              </h3>
              <button 
                type="button"
                onClick={() => setEditStudentDetails({ isOpen: false, student: null, editName: '', editPoints: 0, editStreak: 0, editSeed: '' })}
                className="p-1 hover:bg-slate-100 rounded-lg border border-transparent hover:border-slate-900 transition-all cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-800" />
              </button>
            </div>

            {/* Profile Avatar Live Preview Grid */}
            <div className="flex items-center gap-4 bg-indigo-50 p-4 border-2 border-slate-900 rounded-2xl">
              <div className="w-16 h-16 rounded-full border-2 border-slate-950 bg-white overflow-hidden flex-shrink-0 shadow-sm flex items-center justify-center">
                <div
                  className="w-full h-full"
                  dangerouslySetInnerHTML={{
                    __html: requireAvatar(editStudentDetails.editSeed)
                  }}
                />
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-black uppercase text-indigo-950">Avatar Live Preview</div>
                <button
                  type="button"
                  onClick={() => setEditStudentDetails(prev => ({ ...prev, editSeed: getRandomSeed() }))}
                  className="bg-white text-slate-900 border border-slate-900 hover:bg-indigo-100 text-[10px] font-black uppercase px-2.5 py-1.5 rounded-md flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                >
                  🎲 Roll Random Avatar
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  value={editStudentDetails.editName}
                  onChange={(e) => setEditStudentDetails(prev => ({ ...prev, editName: e.target.value }))}
                  className="w-full text-xs font-bold border-2 border-slate-900 rounded-xl px-3 py-2 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Accumulated Points</label>
                  <input
                    type="number"
                    min="0"
                    value={editStudentDetails.editPoints}
                    onChange={(e) => setEditStudentDetails(prev => ({ ...prev, editPoints: Number(e.target.value) }))}
                    className="w-full text-xs font-bold border-2 border-slate-900 rounded-xl px-3 py-2 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Active Streak Days</label>
                  <input
                    type="number"
                    min="0"
                    value={editStudentDetails.editStreak}
                    onChange={(e) => setEditStudentDetails(prev => ({ ...prev, editStreak: Number(e.target.value) }))}
                    className="w-full text-xs font-bold border-2 border-slate-900 rounded-xl px-3 py-2 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Avatar Graphics Seed</label>
                <input
                  type="text"
                  value={editStudentDetails.editSeed}
                  onChange={(e) => setEditStudentDetails(prev => ({ ...prev, editSeed: e.target.value }))}
                  className="w-full text-xs font-mono font-bold border-2 border-slate-900 rounded-xl px-3 py-2 bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditStudentDetails({ isOpen: false, student: null, editName: '', editPoints: 0, editStreak: 0, editSeed: '' })}
                className="px-4 py-2 border-2 border-slate-900 bg-white hover:bg-slate-50 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm h-10 flex items-center justify-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 text-white border-2 border-slate-900 hover:bg-indigo-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm h-10 flex items-center justify-center"
              >
                Save Profile
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

// Inline loader for custom generated SVGs to avoid complex state callbacks
import { generateAvatarSvg } from '../utils/avatarUtils';
function requireAvatar(seed: string): string {
  return generateAvatarSvg(seed);
}
