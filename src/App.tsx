import { useState, useEffect } from 'react';
import { Classroom, Student, RecitationEvent } from './types';
import ClassOverview from './components/ClassOverview';
import SessionManager from './components/SessionManager';
import SpinWheel from './components/SpinWheel';
import GroupMaker from './components/GroupMaker';
import Leaderboard from './components/Leaderboard';
import { generateClassroomPdf } from './utils/pdfGenerator';
import { getRandomSeed } from './utils/avatarUtils';
import { 
  Layers, 
  UserCheck, 
  Compass, 
  Users, 
  Trophy, 
  FileDown, 
  FolderSync, 
  Sparkles, 
  GraduationCap, 
  CheckCircle,
  Play,
  Square
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'recitation_tracker_classes';

// Seed data to make the applet beautiful and highly interactive immediately!
const DEFAULT_CLASSES: Classroom[] = [
  {
    id: 'class-cs101',
    name: 'Grade 10 - Computer Science',
    subject: 'Algorithms & Python Programming',
    students: [
      { id: 'st-01', name: 'Alice Vance', avatarSeed: 'alice', points: 34, streak: 8, attendance: 'present' },
      { id: 'st-02', name: 'Bob Chen', avatarSeed: 'bob', points: 28, streak: 5, attendance: 'present' },
      { id: 'st-03', name: 'Clara Oswald', avatarSeed: 'clara', points: 25, streak: 3, attendance: 'late' },
      { id: 'st-04', name: 'Danny Pink', avatarSeed: 'danny', points: 18, streak: 1, attendance: 'present' },
      { id: 'st-05', name: 'Elena Gilbert', avatarSeed: 'elena', points: 15, streak: 0, attendance: 'absent' },
      { id: 'st-06', name: 'Franklin Richards', avatarSeed: 'frank', points: 22, streak: 4, attendance: 'present' },
      { id: 'st-07', name: 'Gwen Stacy', avatarSeed: 'gwen', points: 30, streak: 6, attendance: 'present' },
      { id: 'st-08', name: 'Harry Osborn', avatarSeed: 'harry', points: 12, streak: 0, attendance: 'present' },
      { id: 'st-09', name: 'Iris West', avatarSeed: 'iris', points: 19, streak: 2, attendance: 'excused' },
      { id: 'st-10', name: 'Clark Kent', avatarSeed: 'clark', points: 27, streak: 5, attendance: 'present' }
    ],
    history: [
      { id: 'ev-01', studentId: 'st-01', studentName: 'Alice Vance', pointsAwarded: 5, reason: 'Correct recursion explanation', timestamp: new Date(Date.now() - 3600000).toISOString() },
      { id: 'ev-02', studentId: 'st-07', studentName: 'Gwen Stacy', pointsAwarded: 3, reason: 'Fast answers on binary search', timestamp: new Date(Date.now() - 7200000).toISOString() },
      { id: 'ev-03', studentId: 'st-10', studentName: 'Clark Kent', pointsAwarded: 3, reason: 'Volunteered for complex algorithm demo', timestamp: new Date(Date.now() - 10800000).toISOString() }
    ]
  }
];

export default function App() {
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [currentClassId, setCurrentClassId] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'setup' | 'session' | 'spin' | 'groups' | 'leaderboard'>('setup');
  
  // Backup synchronization log state
  const [syncMessage, setSyncMessage] = useState<string>('All changes synced locally');

  // Load classes from localStorage
  useEffect(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as Classroom[];
        setClasses(parsed);
        if (parsed.length > 0) {
          setCurrentClassId(parsed[0].id);
        }
      } else {
        setClasses(DEFAULT_CLASSES);
        setCurrentClassId(DEFAULT_CLASSES[0].id);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_CLASSES));
      }
    } catch (e) {
      console.error('Error loading localStorage tracker', e);
      setClasses(DEFAULT_CLASSES);
      setCurrentClassId(DEFAULT_CLASSES[0].id);
    }
  }, []);

  // Sync classes to localStorage whenever they change
  const syncToLocalStorage = (updatedClasses: Classroom[]) => {
    setClasses(updatedClasses);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedClasses));
      setSyncMessage('Changes saved to localStorage');
      setTimeout(() => setSyncMessage('All changes synced offline'), 3000);
    } catch (e) {
      console.error('Error saving to localStorage', e);
      setSyncMessage('Error syncing offline');
    }
  };

  const currentClass = classes.find((c) => c.id === currentClassId) || null;

  // Add Classroom handler
  const handleAddClass = (name: string, subject: string) => {
    const newClass: Classroom = {
      id: `class-${Math.random().toString(36).substring(2, 9)}`,
      name,
      subject,
      students: [],
      history: []
    };
    const updated = [...classes, newClass];
    syncToLocalStorage(updated);
    setCurrentClassId(newClass.id);
  };

  // Delete Classroom handler
  const handleDeleteClass = (id: string) => {
    const updated = classes.filter((c) => c.id !== id);
    syncToLocalStorage(updated);
    if (currentClassId === id) {
      setCurrentClassId(updated.length > 0 ? updated[0].id : null);
    }
  };

  // Update students inside selected Classroom
  const handleUpdateStudents = (updatedStudents: Student[]) => {
    if (!currentClassId) return;
    const updated = classes.map((c) => {
      if (c.id === currentClassId) {
        return { ...c, students: updatedStudents };
      }
      return c;
    });
    syncToLocalStorage(updated);
  };

  // Record grading event inside selected Classroom
  const handleRecordEvent = (studentId: string, pointsAwarded: number, reason: string) => {
    if (!currentClassId || !currentClass) return;
    const student = currentClass.students.find((s) => s.id === studentId);
    if (!student) return;

    const newLog: RecitationEvent = {
      id: `ev-${Math.random().toString(36).substring(2, 9)}`,
      studentId,
      studentName: student.name,
      pointsAwarded,
      reason,
      timestamp: new Date().toISOString()
    };

    const updated = classes.map((c) => {
      if (c.id === currentClassId) {
        return {
          ...c,
          history: [newLog, ...c.history]
        };
      }
      return c;
    });
    syncToLocalStorage(updated);
  };

  // CSV/JSON Export Backup trigger
  const handleExportBackup = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(classes, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `recitation_tracker_backup_${new Date().toISOString().substring(0,10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      alert('Failed to generate local backup file.');
    }
  };

  // PDF generation downloader
  const handleDownloadPdf = () => {
    if (!currentClass) {
      alert('Please select or create a class first.');
      return;
    }
    generateClassroomPdf(currentClass);
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col font-sans antialiased text-slate-900" id="main-applet-container">
      
      {/* Premium Header Nav Bar - Bento Style */}
      <header className="bg-white border-2 border-slate-900 p-5 rounded-2xl shadow-bento max-w-7xl mx-auto w-full mt-6 sticky top-4 z-30">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white border-2 border-slate-900 shadow-bento-sm flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase font-display flex items-center gap-1.5">
                RecitaTrack Pro
              </h1>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                <FolderSync className="w-3.5 h-3.5 text-emerald-600 animate-pulse" /> {syncMessage}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {/* Live session status indicator - Bento Style */}
            <div className="flex items-center gap-2 bg-emerald-100 border border-emerald-500 px-3 py-1.5 rounded-full select-none">
              <div className={`w-2 h-2 rounded-full ${isSessionActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
              <span className="text-[11px] font-black tracking-wider text-emerald-800 uppercase">
                {isSessionActive ? 'SESSION LIVE' : 'STANDBY'}
              </span>
            </div>

            {currentClass && (
              <div className="text-right hidden md:block border-l-2 border-slate-200 pl-4">
                <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">ACTIVE CLASS</div>
                <div className="text-xs font-black text-slate-900 uppercase font-display">{currentClass.name}</div>
              </div>
            )}

            <button
              id="header-pdf-export"
              onClick={handleDownloadPdf}
              className="bg-slate-900 text-white border-2 border-slate-900 hover:bg-slate-800 rounded-xl text-xs font-black uppercase tracking-wider px-4 py-2.5 flex items-center gap-2 transition-all cursor-pointer shadow-bento-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] whitespace-nowrap"
            >
              <FileDown className="w-4 h-4" /> Export PDF
            </button>
          </div>
        </div>
      </header>

      {/* Main Core Body */}
      <main className="max-w-7xl mx-auto px-6 py-6 flex-1 w-full flex flex-col gap-6">

        {/* Dynamic Navigation Tabs menu - Bento Style */}
        <div className="flex flex-wrap md:flex-nowrap rounded-2xl bg-white border-2 border-slate-900 p-2 shadow-bento gap-2">
          <button
            id="tab-setup"
            onClick={() => setActiveTab('setup')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border-2 ${
              activeTab === 'setup'
                ? 'bg-indigo-600 text-white border-slate-900 shadow-bento-sm'
                : 'bg-white text-slate-700 border-transparent hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4" /> Class Setup
          </button>

          <button
            id="tab-session"
            disabled={!currentClass}
            onClick={() => setActiveTab('session')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border-2 ${
              !currentClass ? 'opacity-40 cursor-not-allowed' : ''
            } ${
              activeTab === 'session'
                ? 'bg-indigo-600 text-white border-slate-900 shadow-bento-sm'
                : 'bg-white text-slate-700 border-transparent hover:bg-slate-50'
            }`}
          >
            <UserCheck className="w-4 h-4" /> Attendance & Live Log
          </button>

          <button
            id="tab-spin"
            disabled={!currentClass}
            onClick={() => setActiveTab('spin')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border-2 ${
              !currentClass ? 'opacity-40 cursor-not-allowed' : ''
            } ${
              activeTab === 'spin'
                ? 'bg-indigo-600 text-white border-slate-900 shadow-bento-sm'
                : 'bg-white text-slate-700 border-transparent hover:bg-slate-50'
            }`}
          >
            <Compass className="w-4 h-4" /> Spin Wheel
          </button>

          <button
            id="tab-groups"
            disabled={!currentClass}
            onClick={() => setActiveTab('groups')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border-2 ${
              !currentClass ? 'opacity-40 cursor-not-allowed' : ''
            } ${
              activeTab === 'groups'
                ? 'bg-indigo-600 text-white border-slate-900 shadow-bento-sm'
                : 'bg-white text-slate-700 border-transparent hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" /> Form Teams
          </button>

          <button
            id="tab-leaderboard"
            disabled={!currentClass}
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border-2 ${
              !currentClass ? 'opacity-40 cursor-not-allowed' : ''
            } ${
              activeTab === 'leaderboard'
                ? 'bg-indigo-600 text-white border-slate-900 shadow-bento-sm'
                : 'bg-white text-slate-700 border-transparent hover:bg-slate-50'
            }`}
          >
            <Trophy className="w-4 h-4" /> Standings & Logs
          </button>
        </div>

        {/* Tab Viewport Router render */}
        <div className="flex-1">
          {activeTab === 'setup' && (
            <ClassOverview
              currentClass={currentClass}
              onSelectClass={(cls) => setCurrentClassId(cls.id)}
              classes={classes}
              onAddClass={handleAddClass}
              onDeleteClass={handleDeleteClass}
              onUpdateStudents={handleUpdateStudents}
              onExportBackup={handleExportBackup}
            />
          )}

          {activeTab === 'session' && currentClass && (
            <SessionManager
              currentClass={currentClass}
              isSessionActive={isSessionActive}
              onStartSession={() => setIsSessionActive(true)}
              onEndSession={() => setIsSessionActive(false)}
              onUpdateStudents={handleUpdateStudents}
              onRecordEvent={handleRecordEvent}
            />
          )}

          {activeTab === 'spin' && currentClass && (
            <div>
              {isSessionActive ? (
                <SpinWheel
                  currentClass={currentClass}
                  onRecordEvent={handleRecordEvent}
                  onUpdateStudents={handleUpdateStudents}
                />
              ) : (
                <div className="bg-white border-2 border-slate-900 rounded-3xl p-12 text-center text-slate-500 max-w-xl mx-auto mt-6 shadow-bento">
                  <Compass className="w-16 h-16 text-indigo-500 hover:rotate-45 transition-transform duration-500 mx-auto mb-4" />
                  <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 font-display">Spin Wheel Picker</h3>
                  <p className="text-sm font-bold text-slate-500 mt-2">
                    Let's select students dynamically to gamify answering! First, initiate a Live Session inside the 
                    <strong className="text-indigo-600 font-extrabold ml-1 cursor-pointer underline" onClick={() => setActiveTab('session')}>Attendance & Live Log</strong> tab.
                  </p>
                  <button
                    onClick={() => {
                      setIsSessionActive(true);
                      setActiveTab('session');
                    }}
                    className="mt-6 bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-900 rounded-xl text-xs font-black uppercase tracking-wider px-5 py-2.5 flex items-center gap-1.5 mx-auto transition-all cursor-pointer shadow-bento-sm hover:translate-x-[1px] hover:translate-y-[1px]"
                  >
                    <Play className="w-3.5 h-3.5 fill-current text-emerald-400" /> Start Session Now
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'groups' && currentClass && (
            <div>
              {isSessionActive ? (
                <GroupMaker
                  currentClass={currentClass}
                  onRecordEvent={handleRecordEvent}
                  onUpdateStudents={handleUpdateStudents}
                />
              ) : (
                <div className="bg-white border-2 border-slate-900 rounded-3xl p-12 text-center text-slate-500 max-w-xl mx-auto mt-6 shadow-bento">
                  <Users className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
                  <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 font-display">Dynamic Group Maker</h3>
                  <p className="text-sm font-bold text-slate-500 mt-2">
                    Form fast, random work-teams of various sizes and instantly grade outcomes. First, initiate a Live Session inside the 
                    <strong className="text-indigo-600 font-extrabold ml-1 cursor-pointer underline" onClick={() => setActiveTab('session')}>Attendance & Live Log</strong> tab.
                  </p>
                  <button
                    onClick={() => {
                      setIsSessionActive(true);
                      setActiveTab('session');
                    }}
                    className="mt-6 bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-900 rounded-xl text-xs font-black uppercase tracking-wider px-5 py-2.5 flex items-center gap-1.5 mx-auto transition-all cursor-pointer shadow-bento-sm hover:translate-x-[1px] hover:translate-y-[1px]"
                  >
                    <Play className="w-3.5 h-3.5 fill-current text-emerald-400" /> Start Session Now
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'leaderboard' && currentClass && (
            <Leaderboard currentClass={currentClass} />
          )}
        </div>

      </main>

      <footer className="bg-white border-t-2 border-slate-900 py-6 px-6 mt-12 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>Report &copy; {new Date().getFullYear()} AP-HIST-2024 Stable Build</div>
          <div className="flex items-center gap-4 text-slate-900 font-black">
            <span>Offline Saved Sync</span>
            <span>|</span>
            <span>v2.4.1 Stable Build</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
