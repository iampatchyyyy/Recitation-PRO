import { useState, useEffect } from 'react';
import { Classroom, Student, RecitationEvent, ClassSession } from './types';
import ClassOverview from './components/ClassOverview';
import SessionManager from './components/SessionManager';
import SpinWheel from './components/SpinWheel';
import GroupMaker from './components/GroupMaker';
import Leaderboard from './components/Leaderboard';
import ClassHistory from './components/ClassHistory';
import { ClassSessionRecapDialog } from './components/ClassSessionRecapDialog';
import { generateClassroomPdf } from './utils/pdfGenerator';
import { generateSessionPdf } from './utils/sessionPdfGenerator';
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
  Square,
  Clock,
  LogIn,
  LogOut,
  Cloud,
  Database,
  RefreshCw,
  AlertTriangle,
  Server,
  Calendar,
  Image,
  UserCheck as UserCircleIcon
} from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  auth, 
  loginWithGoogle, 
  logoutUser, 
  syncClassroomToCloud, 
  fetchClassroomsFromCloud, 
  deleteClassroomFromCloud, 
  fetchClassroomDetailsFromCloud,
  isFirebaseConfigured 
} from './lib/firebase';

const LOCAL_STORAGE_KEY = 'recitation_tracker_classes';

// Format real-time Date and clock time beautifully for header
const formatDateTime = (date: Date): string => {
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

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
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string>('00:00');
  const [activeTab, setActiveTab] = useState<'setup' | 'session' | 'leaderboard' | 'history'>('setup');
  const [activeSessionSubTab, setActiveSessionSubTab] = useState<'live' | 'spin' | 'groups'>('live');
  
  // Real-time date and time state for header clock
  const [currentTime, setCurrentTime] = useState(new Date());

  // Post-session stats popup recap state
  const [showEndSessionRecap, setShowEndSessionRecap] = useState(false);
  const [lastLoggedSession, setLastLoggedSession] = useState<ClassSession | null>(null);
  
  // Backup synchronization log state
  const [syncMessage, setSyncMessage] = useState<string>('All changes synced locally');

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);

  // Helper functions to prefix storage keys per user profile to prevent cross-account leaks
  const getStorageKey = (uid?: string | null) => {
    const currentUid = uid !== undefined ? uid : (currentUser ? currentUser.uid : 'offline');
    return `${LOCAL_STORAGE_KEY}_${currentUid || 'offline'}`;
  };

  const getSessionKey = (keyName: string, uid?: string | null) => {
    const currentUid = uid !== undefined ? uid : (currentUser ? currentUser.uid : 'offline');
    return `${keyName}_${currentUid || 'offline'}`;
  };

  // Active session timer sync states
  const [sessionSaveState, setSessionSaveState] = useState<'synced' | 'pending' | 'resolving' | 'saving'>('synced');
  const [secondsUntilSave, setSecondsUntilSave] = useState<number>(30);
  const [compareModalOpen, setCompareModalOpen] = useState<boolean>(false);
  const [originalSessionData, setOriginalSessionData] = useState<{
    sessionActive: boolean;
    sessionStartTime: string | null;
    sessionElapsedTime: string;
    updatedAt?: string;
  } | null>(null);
  const [newSessionData, setNewSessionData] = useState<{
    sessionActive: boolean;
    sessionStartTime: string | null;
    sessionElapsedTime: string;
  } | null>(null);
  const [selectedSaveOption, setSelectedSaveOption] = useState<'original' | 'new' | null>(null);

  // Tick real-time clock every one second for header display
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Subscribe to Firebase Auth and dual-sync classrooms
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoadingAuth(false);

      if (user) {
        setSyncMessage('Checking Cloud Backup...');
        setIsCloudSyncing(true);
        try {
          const cloudClasses = await fetchClassroomsFromCloud(user.uid);
          if (cloudClasses && cloudClasses.length > 0) {
            setClasses(cloudClasses);
            setSyncMessage('Classes loaded from Cloud');
            localStorage.setItem(getStorageKey(user.uid), JSON.stringify(cloudClasses));
            
            // Restore current class selection
            const cachedClassId = localStorage.getItem(getSessionKey('recitation_current_class_id', user.uid));
            let activeClassId = cachedClassId;
            if (cachedClassId && cloudClasses.some(c => c.id === cachedClassId)) {
              setCurrentClassId(cachedClassId);
            } else {
              activeClassId = cloudClasses[0].id;
              setCurrentClassId(cloudClasses[0].id);
            }

            // Check if there's a cloud-saved active session to restore on startup
            if (activeClassId) {
              const matchedCloudClass = cloudClasses.find(c => c.id === activeClassId);
              if (matchedCloudClass?.sessionActive && matchedCloudClass.sessionStartTime) {
                const localActive = localStorage.getItem(getSessionKey('recitation_session_active', user.uid)) === 'true';
                const localStartTime = localStorage.getItem(getSessionKey('recitation_session_start_time', user.uid));
                if (!localActive || localStartTime !== matchedCloudClass.sessionStartTime) {
                  // Mismatch found! Trigger beautiful side-by-side verification dialog
                  setOriginalSessionData({
                    sessionActive: true,
                    sessionStartTime: matchedCloudClass.sessionStartTime,
                    sessionElapsedTime: matchedCloudClass.sessionElapsedTime || '00:00'
                  });
                  setNewSessionData({
                    sessionActive: localActive,
                    sessionStartTime: localStartTime,
                    sessionElapsedTime: localStorage.getItem(getSessionKey('recitation_session_elapsed', user.uid)) || '00:00'
                  });
                  setSelectedSaveOption('original'); // Highlight the Cloud copy by default for crash recovery
                  setCompareModalOpen(true);
                  setSessionSaveState('resolving');
                }
              }
            }
          } else {
            // No cloud data yet - check if there's specific cached data for this user
            const cached = localStorage.getItem(getStorageKey(user.uid));
            if (cached) {
              const localClasses = JSON.parse(cached) as Classroom[];
              if (localClasses && localClasses.length > 0) {
                setSyncMessage('Uploading classrooms...');
                for (const cls of localClasses) {
                  await syncClassroomToCloud(user.uid, cls);
                }
                setClasses(localClasses);
                setSyncMessage('Synched local memory to Cloud');
              }
            } else {
              // Completely fresh dashboard - seed the DEFAULT_CLASSES for their new profile!
              setSyncMessage('Seeding a fresh dashboard...');
              for (const cls of DEFAULT_CLASSES) {
                await syncClassroomToCloud(user.uid, cls);
              }
              setClasses(DEFAULT_CLASSES);
              localStorage.setItem(getStorageKey(user.uid), JSON.stringify(DEFAULT_CLASSES));
              if (DEFAULT_CLASSES.length > 0) {
                setCurrentClassId(DEFAULT_CLASSES[0].id);
              }
              setSyncMessage('Fresh cloud dashboard created!');
            }
          }

          // Restore session states for the logged-in user
          const sessionActive = localStorage.getItem(getSessionKey('recitation_session_active', user.uid)) === 'true';
          const sessionStartTimeVal = localStorage.getItem(getSessionKey('recitation_session_start_time', user.uid));
          const sessionElapsedVal = localStorage.getItem(getSessionKey('recitation_session_elapsed', user.uid)) || '00:00';
          setIsSessionActive(sessionActive);
          setSessionStartTime(sessionStartTimeVal);
          setElapsedTime(sessionElapsedVal);
        } catch (err) {
          console.error("Cloud syncing error during init:", err);
          setSyncMessage('Cloud offline - using local backup');
        } finally {
          setIsCloudSyncing(false);
        }
      } else {
        setSyncMessage('Offline standby mode');
        setIsSessionActive(false);
        setSessionStartTime(null);
        setElapsedTime('00:00');
        // Restore from local storage on logout
        const cached = localStorage.getItem(getStorageKey(null));
        if (cached) {
          const parsed = JSON.parse(cached) as Classroom[];
          setClasses(parsed);
          const cachedClassId = localStorage.getItem(getSessionKey('recitation_current_class_id', null));
          if (cachedClassId && parsed.some(c => c.id === cachedClassId)) {
            setCurrentClassId(cachedClassId);
          } else if (parsed.length > 0) {
            setCurrentClassId(parsed[0].id);
          }
        } else {
          setClasses(DEFAULT_CLASSES);
          if (DEFAULT_CLASSES.length > 0) {
            setCurrentClassId(DEFAULT_CLASSES[0].id);
          }
        }

        // Restore session states for offline mode
        const sessionActive = localStorage.getItem(getSessionKey('recitation_session_active', null)) === 'true';
        const sessionStartTimeVal = localStorage.getItem(getSessionKey('recitation_session_start_time', null));
        const sessionElapsedVal = localStorage.getItem(getSessionKey('recitation_session_elapsed', null)) || '00:00';
        setIsSessionActive(sessionActive);
        setSessionStartTime(sessionStartTimeVal);
        setElapsedTime(sessionElapsedVal);
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync classes both locally & to cloud if logged in
  const syncClasses = async (updatedOrFunc: Classroom[] | ((prev: Classroom[]) => Classroom[])) => {
    if (typeof updatedOrFunc === 'function') {
      setClasses((prev) => {
        const resolved = updatedOrFunc(prev);
        try {
          localStorage.setItem(getStorageKey(currentUser?.uid), JSON.stringify(resolved));
          setSyncMessage('Progress saved locally');
        } catch (e) {
          console.error('Error saving to localStorage', e);
        }

        if (currentUser) {
          setIsCloudSyncing(true);
          setSyncMessage('Syncing changes to Cloud...');
          Promise.all(resolved.map((cls) => syncClassroomToCloud(currentUser.uid, cls)))
            .then(() => {
              setSyncMessage('Cloud Backed Up');
              setTimeout(() => setSyncMessage('Cloud synced'), 3500);
            })
            .catch((err) => {
              console.error("Cloud sync failed on update:", err);
              setSyncMessage('Saved locally (Sync pending)');
            })
            .finally(() => {
              setIsCloudSyncing(false);
            });
        } else {
          setTimeout(() => setSyncMessage('All changes saved offline'), 3000);
        }
        return resolved;
      });
    } else {
      setClasses(updatedOrFunc);
      try {
        localStorage.setItem(getStorageKey(currentUser?.uid), JSON.stringify(updatedOrFunc));
        setSyncMessage('Progress saved locally');
      } catch (e) {
        console.error('Error saving to localStorage', e);
      }

      if (currentUser) {
        setIsCloudSyncing(true);
        setSyncMessage('Syncing changes to Cloud...');
        try {
          await Promise.all(
            updatedOrFunc.map((cls) => syncClassroomToCloud(currentUser.uid, cls))
          );
          setSyncMessage('Cloud Backed Up');
          setTimeout(() => setSyncMessage('Cloud synced'), 3000);
        } catch (err) {
          console.error("Cloud sync failed on update:", err);
          setSyncMessage('Saved locally (Sync pending)');
        } finally {
          setIsCloudSyncing(false);
        }
      } else {
        setTimeout(() => setSyncMessage('All changes saved offline'), 3000);
      }
    }
  };

  // Note: Active session details are dynamically restored per-user in onAuthStateChanged

  // Live session timer logic to maintain timer state across tab unmounts
  useEffect(() => {
    let interval: any = null;
    if (isSessionActive && sessionStartTime) {
      const updateTimer = () => {
        const start = new Date(sessionStartTime).getTime();
        const diff = Date.now() - start;
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        setElapsedTime(formatted);
        localStorage.setItem(getSessionKey('recitation_session_elapsed', currentUser?.uid), formatted);
      };
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else {
      setElapsedTime('00:00');
    }
    return () => clearInterval(interval);
  }, [isSessionActive, sessionStartTime, currentUser]);

  // 30 Seconds Auto-save checking block
  useEffect(() => {
    if (!isSessionActive || !currentUser || !currentClassId) {
      setSecondsUntilSave(30);
      return;
    }

    const timerInt = setInterval(() => {
      setSecondsUntilSave((prev) => {
        if (prev <= 1) {
          // Trigger the comparison modal before saving
          handleInitiateSessionSave();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerInt);
  }, [isSessionActive, currentUser, currentClassId, elapsedTime, sessionStartTime]);

  const handleInitiateSessionSave = async () => {
    if (!currentUser || !currentClassId || !currentClass) return;
    
    setSessionSaveState('saving');
    try {
      const cloudClass = await fetchClassroomDetailsFromCloud(currentUser.uid, currentClassId);
      
      const originalData = cloudClass ? {
        sessionActive: cloudClass.sessionActive || false,
        sessionStartTime: cloudClass.sessionStartTime || null,
        sessionElapsedTime: cloudClass.sessionElapsedTime || '00:00',
        updatedAt: cloudClass.updatedAt || new Date().toISOString()
      } : {
        sessionActive: false,
        sessionStartTime: null,
        sessionElapsedTime: '00:00'
      };
      
      const newData = {
        sessionActive: isSessionActive,
        sessionStartTime: sessionStartTime,
        sessionElapsedTime: elapsedTime
      };
      
      setOriginalSessionData(originalData);
      setNewSessionData(newData);
      setSelectedSaveOption('new'); // Pre-select the local live timer (usual path)
      setCompareModalOpen(true);
      setSessionSaveState('resolving');
    } catch (err) {
      console.error("Error fetching class details for verification:", err);
      setOriginalSessionData({
        sessionActive: false,
        sessionStartTime: null,
        sessionElapsedTime: '00:00'
      });
      setNewSessionData({
        sessionActive: isSessionActive,
        sessionStartTime: sessionStartTime,
        sessionElapsedTime: elapsedTime
      });
      setSelectedSaveOption('new');
      setCompareModalOpen(true);
      setSessionSaveState('resolving');
    }
  };

  const handleResolveAndSave = async () => {
    if (!selectedSaveOption || !currentUser || !currentClassId || !currentClass) return;
    
    setSessionSaveState('saving');
    try {
      if (selectedSaveOption === 'original' && originalSessionData) {
        // Option "Original": Keep Cloud database and replace local state
        setIsSessionActive(originalSessionData.sessionActive);
        setSessionStartTime(originalSessionData.sessionStartTime);
        setElapsedTime(originalSessionData.sessionElapsedTime);
        
        if (originalSessionData.sessionActive) {
          localStorage.setItem(getSessionKey('recitation_session_active', currentUser.uid), 'true');
          if (originalSessionData.sessionStartTime) {
            localStorage.setItem(getSessionKey('recitation_session_start_time', currentUser.uid), originalSessionData.sessionStartTime);
          }
          localStorage.setItem(getSessionKey('recitation_session_elapsed', currentUser.uid), originalSessionData.sessionElapsedTime);
        } else {
          localStorage.removeItem(getSessionKey('recitation_session_active', currentUser.uid));
          localStorage.removeItem(getSessionKey('recitation_session_start_time', currentUser.uid));
          localStorage.removeItem(getSessionKey('recitation_session_elapsed', currentUser.uid));
        }
        
        const updatedClasses = classes.map(c => {
          if (c.id === currentClassId) {
            return {
              ...c,
              sessionActive: originalSessionData.sessionActive,
              sessionStartTime: originalSessionData.sessionStartTime,
              sessionElapsedTime: originalSessionData.sessionElapsedTime
            };
          }
          return c;
        });
        setClasses(updatedClasses);
        localStorage.setItem(getStorageKey(currentUser.uid), JSON.stringify(updatedClasses));
        setSyncMessage("Restored Cloud active timer state!");
      } else if (selectedSaveOption === 'new' && newSessionData) {
        // Option "New": Overwrite cloud database with our local details
        const updatedClass = {
          ...currentClass,
          sessionActive: isSessionActive,
          sessionStartTime: sessionStartTime,
          sessionElapsedTime: elapsedTime,
          updatedAt: new Date().toISOString()
        };
        
        const updatedClasses = classes.map(c => {
          if (c.id === currentClassId) {
            return updatedClass;
          }
          return c;
        });
        setClasses(updatedClasses);
        localStorage.setItem(getStorageKey(currentUser.uid), JSON.stringify(updatedClasses));
        
        await syncClassroomToCloud(currentUser.uid, updatedClass);
        setSyncMessage("Auto-saved live timer to Cloud!");
      }
      
      setSessionSaveState('synced');
      setCompareModalOpen(false);
      setSecondsUntilSave(30);
    } catch (err) {
      console.error("Conflict resolution sync failed:", err);
      setSyncMessage("Failed to apply save resolution");
      setSessionSaveState('pending');
    }
  };

  const currentClass = classes.find((c) => c.id === currentClassId) || null;

  const handleSelectClassId = (classId: string | null) => {
    setCurrentClassId(classId);
    if (classId) {
      localStorage.setItem(getSessionKey('recitation_current_class_id', currentUser?.uid), classId);
    } else {
      localStorage.removeItem(getSessionKey('recitation_current_class_id', currentUser?.uid));
    }
  };

  const handleStartSession = () => {
    const startTimeNow = new Date().toISOString();
    setIsSessionActive(true);
    setSessionStartTime(startTimeNow);
    localStorage.setItem(getSessionKey('recitation_session_active', currentUser?.uid), 'true');
    localStorage.setItem(getSessionKey('recitation_session_start_time', currentUser?.uid), startTimeNow);
    localStorage.setItem(getSessionKey('recitation_session_elapsed', currentUser?.uid), '00:00');
    setElapsedTime('00:00');
    setSecondsUntilSave(30);

    if (currentClassId) {
      const updated = classes.map((c) => {
        if (c.id === currentClassId) {
          return {
            ...c,
            sessionActive: true,
            sessionStartTime: startTimeNow,
            sessionElapsedTime: '00:00'
          };
        }
        return c;
      });
      syncClasses(updated);
    }
  };

  const handleEndSession = () => {
    setIsSessionActive(false);
    
    // Save session variables temporarily before removing state
    const savedStartTime = sessionStartTime;
    const finalElapsedVal = elapsedTime;

    setSessionStartTime(null);
    setElapsedTime('00:00');
    localStorage.removeItem(getSessionKey('recitation_session_active', currentUser?.uid));
    localStorage.removeItem(getSessionKey('recitation_session_start_time', currentUser?.uid));
    localStorage.removeItem(getSessionKey('recitation_session_elapsed', currentUser?.uid));

    if (currentClassId && currentClass) {
      // 1. Gather all recitation events recorded since session started
      const sessionEvents = currentClass.history.filter((ev) => {
        if (!savedStartTime) return false;
        return new Date(ev.timestamp).getTime() >= new Date(savedStartTime).getTime();
      });

      // 2. Identify the MVP(s) using the advanced tie-breaking hierarchy:
      // Session Score (highest) > Longest Streak (highest) > Average Session Points (highest) > Lowest recorded Session Points (highest)
      const studentMetrics: Record<string, {
        id: string;
        name: string;
        avatarSeed: string;
        score: number;
        streak: number;
        eventCount: number;
        averagePoints: number;
        lowestPoints: number;
      }> = {};

      sessionEvents.forEach((ev) => {
        const sId = ev.studentId;
        const studentObj = currentClass.students.find((s) => s.id === sId);
        const avatarSeed = studentObj?.avatarSeed || 'seed';
        const streakValue = studentObj?.streak || 0;

        if (!studentMetrics[sId]) {
          studentMetrics[sId] = {
            id: sId,
            name: ev.studentName,
            avatarSeed,
            score: 0,
            streak: streakValue,
            eventCount: 0,
            averagePoints: 0,
            lowestPoints: Infinity
          };
        }
        
        const metric = studentMetrics[sId];
        metric.score += ev.pointsAwarded;
        metric.eventCount += 1;
        if (ev.pointsAwarded < metric.lowestPoints) {
          metric.lowestPoints = ev.pointsAwarded;
        }
      });

      // Compute averages and clean infinity values
      const candidatesList = Object.values(studentMetrics).map((metric) => {
        return {
          ...metric,
          averagePoints: metric.eventCount > 0 ? (metric.score / metric.eventCount) : 0,
          lowestPoints: metric.lowestPoints === Infinity ? 0 : metric.lowestPoints
        };
      });

      // Sort candidates using the priority hierarchy:
      // 1. Session Score descending
      // 2. Longest Streak descending
      // 3. Average Session Points descending
      // 4. Lowest recorded Session Points descending
      candidatesList.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        if (b.streak !== a.streak) {
          return b.streak - a.streak;
        }
        if (b.averagePoints !== a.averagePoints) {
          return b.averagePoints - a.averagePoints;
        }
        return b.lowestPoints - a.lowestPoints;
      });

      let mvpStudentName = 'No recitation events';
      let mvpStudentAvatar = 'seed';
      let mvpPointsSum = 0;

      if (candidatesList.length > 0) {
        const topCandidate = candidatesList[0];
        
        // Find all candidates who are tied with the top candidate across all metrics
        const tiedCandidates = candidatesList.filter((c) => 
          c.score === topCandidate.score &&
          c.streak === topCandidate.streak &&
          c.averagePoints === topCandidate.averagePoints &&
          c.lowestPoints === topCandidate.lowestPoints
        );

        if (tiedCandidates.length > 1) {
          mvpStudentName = tiedCandidates.map((c) => c.name).join(' & ');
          mvpStudentAvatar = topCandidate.avatarSeed;
          mvpPointsSum = topCandidate.score;
        } else {
          mvpStudentName = topCandidate.name;
          mvpStudentAvatar = topCandidate.avatarSeed;
          mvpPointsSum = topCandidate.score;
        }
      }

      // 3. Construct duration representation if required
      let durationStr = finalElapsedVal;
      if (durationStr === '00:00' && savedStartTime) {
        const diffMs = Date.now() - new Date(savedStartTime).getTime();
        const mins = Math.floor(diffMs / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);
        durationStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }

      // 4. Form ClassSession log with comprehensive classroom analytics
      const presentCount = currentClass.students.filter((s) => s.attendance === 'present').length;
      const lateCount = currentClass.students.filter((s) => s.attendance === 'late').length;
      const absentCount = currentClass.students.filter((s) => s.attendance === 'absent').length;
      const excusedCount = currentClass.students.filter((s) => s.attendance === 'excused').length;
      const totalPresentCount = presentCount + lateCount;

      const uniqueStudentIds = new Set(sessionEvents.map((ev) => ev.studentId));
      const uniqueParticipantsCount = uniqueStudentIds.size;
      const engagementRate = totalPresentCount > 0
        ? Math.round((uniqueParticipantsCount / totalPresentCount) * 100)
        : 0;

      const positiveEventsCount = sessionEvents.filter((ev) => ev.pointsAwarded > 0).length;
      const negativeEventsCount = sessionEvents.filter((ev) => ev.pointsAwarded < 0).length;

      const spinWheelWinnersCount = sessionEvents.filter((ev) => 
        ev.reason?.toLowerCase().includes('spin') || 
        ev.reason?.toLowerCase().includes('picker') || 
        ev.reason?.toLowerCase().includes('winner')
      ).length;

      const groupGradingsCount = sessionEvents.filter((ev) => 
        ev.reason?.toLowerCase().includes('team') || 
        ev.reason?.toLowerCase().includes('group')
      ).length;

      const classSession: ClassSession = {
        id: `session-${Math.random().toString(36).substring(2, 9)}`,
        className: currentClass.name,
        subject: currentClass.subject || '',
        startTime: savedStartTime || new Date().toISOString(),
        endTime: new Date().toISOString(),
        duration: durationStr,
        eventsCount: sessionEvents.length,
        pointsAwarded: sessionEvents.reduce((acc, ev) => acc + ev.pointsAwarded, 0),
        studentsCount: presentCount,
        lateCount,
        absentCount,
        excusedCount,
        totalPresentCount,
        uniqueParticipantsCount,
        engagementRate,
        positiveEventsCount,
        negativeEventsCount,
        spinWheelWinnersCount,
        groupGradingsCount,
        mvpName: mvpStudentName,
        mvpAvatarSeed: mvpStudentAvatar,
        mvpPointsGained: mvpPointsSum,
        events: sessionEvents
      };

      // 5. Append this to current classroom's sessionHistory
      const updatedHistory = [classSession, ...(currentClass.sessionHistory || [])];

      const updated = classes.map((c) => {
        if (c.id === currentClassId) {
          return {
            ...c,
            sessionActive: false,
            sessionStartTime: null,
            sessionElapsedTime: '00:00',
            sessionHistory: updatedHistory
          };
        }
        return c;
      });

      syncClasses(updated);

      // 6. Present dynamic stats modal dialog immediately
      setLastLoggedSession(classSession);
      setShowEndSessionRecap(true);
    }
  };

  const handleGoogleLogin = async () => {
    if (!isFirebaseConfigured) {
      alert("Firebase cloud storage is currently being provisioned. Please complete the setup using that Firebase action interface and reload.");
      return;
    }
    setSyncMessage('Signing in with Google...');
    try {
      await loginWithGoogle();
      setSyncMessage('Connected securely via Google');
    } catch (err) {
      console.error(err);
      setSyncMessage('Aborted Google connection');
    }
  };

  const handleUserLogout = async () => {
    setSyncMessage('Signing out...');
    try {
      await logoutUser();
      setSyncMessage('Disconnected Google slot');
    } catch (err) {
      console.error(err);
      setSyncMessage('Logout failed');
    }
  };

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
    syncClasses(updated);
    handleSelectClassId(newClass.id);
  };

  // Delete Classroom handler
  const handleDeleteClass = async (id: string) => {
    const updated = classes.filter((c) => c.id !== id);
    await syncClasses(updated);
    if (currentClassId === id) {
      handleSelectClassId(updated.length > 0 ? updated[0].id : null);
    }
    if (currentUser) {
      try {
        await deleteClassroomFromCloud(currentUser.uid, id);
      } catch (err) {
        console.error("Could not delete from cloud", err);
      }
    }
  };

  // Update students inside selected Classroom
  const handleUpdateStudents = (updatedStudents: Student[]) => {
    if (!currentClassId) return;
    syncClasses((prev) => {
      return prev.map((c) => {
        if (c.id === currentClassId) {
          return { ...c, students: updatedStudents };
        }
        return c;
      });
    });
  };

  // Rename a classroom name / subject details
  const handleUpdateClassDetails = (classId: string, name: string, subject: string) => {
    const updated = classes.map((c) => {
      if (c.id === classId) {
        return { ...c, name, subject };
      }
      return c;
    });
    syncClasses(updated);
  };

  // Transfer a student from one classroom to another
  const handleMoveStudent = (studentId: string, fromClassId: string, toClassId: string) => {
    const fromClass = classes.find((c) => c.id === fromClassId);
    const toClass = classes.find((c) => c.id === toClassId);
    if (!fromClass || !toClass) return;

    const studentToMove = fromClass.students.find((s) => s.id === studentId);
    if (!studentToMove) return;

    // Remove from older class
    const updatedFromStudents = fromClass.students.filter((s) => s.id !== studentId);

    // Add into new class
    const updatedToStudents = [...toClass.students, studentToMove];

    const updated = classes.map((c) => {
      if (c.id === fromClassId) {
        return { ...c, students: updatedFromStudents };
      }
      if (c.id === toClassId) {
        return { ...c, students: updatedToStudents };
      }
      return c;
    });

    syncClasses(updated);
    handleSelectClassId(toClassId);
    setSyncMessage(`Moved ${studentToMove.name} to ${toClass.name}!`);
  };

  // Record grading event inside selected Classroom
  const handleRecordEvent = (studentId: string, pointsAwarded: number, reason: string) => {
    if (!currentClassId) return;
    
    syncClasses((prev) => {
      const current = prev.find((c) => c.id === currentClassId);
      if (!current) return prev;
      const student = current.students.find((s) => s.id === studentId);
      if (!student) return prev;

      const newLog: RecitationEvent = {
        id: `ev-${Math.random().toString(36).substring(2, 9)}`,
        studentId,
        studentName: student.name,
        pointsAwarded,
        reason,
        timestamp: new Date().toISOString()
      };

      return prev.map((c) => {
        if (c.id === currentClassId) {
          return {
            ...c,
            history: [newLog, ...c.history]
          };
        }
        return c;
      });
    });
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
      <header className="bg-white border-2 border-slate-900 p-5 rounded-2xl shadow-bento max-w-7xl mx-auto w-full mt-6 sticky top-4 z-30 font-sans">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white border-2 border-slate-900 shadow-bento-sm flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase font-display flex items-center gap-1.5">
                RecitaTrack Pro
              </h1>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                {currentUser ? (
                  <Cloud className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                ) : (
                  <FolderSync className="w-3.5 h-3.5 text-amber-500" />
                )} {syncMessage}
              </p>
            </div>
          </div>

          {/* Centered Date and Time clock */}
          <div className="bg-slate-50 border-2 border-slate-900 rounded-xl px-4 py-2 font-mono text-xs font-black text-slate-900 uppercase tracking-wider text-center shadow-bento-sm whitespace-nowrap">
            {formatDateTime(currentTime)}
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
            
            {/* Header Level START/END SESSION transformation */}
            {classes.length > 0 && (
              isSessionActive ? (
                <button
                  id="header-end-session"
                  onClick={handleEndSession}
                  className="bg-rose-500 hover:bg-rose-600 text-white border-2 border-slate-900 rounded-xl text-xs font-black uppercase tracking-wider px-3.5 py-2 flex items-center gap-1.5 transition-all cursor-pointer shadow-bento-sm hover:translate-x-[1px] hover:translate-y-[1px]"
                >
                  <Square className="w-3.5 h-3.5 fill-current text-white animate-pulse" /> END SESSION
                </button>
              ) : (
                <button
                  id="header-start-session"
                  disabled={!currentClassId}
                  onClick={handleStartSession}
                  className={`border-2 border-slate-900 rounded-xl text-xs font-black uppercase tracking-wider px-3.5 py-2 flex items-center gap-1.5 transition-all shadow-bento-sm hover:translate-x-[1px] hover:translate-y-[1px] ${
                    currentClassId
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 cursor-pointer'
                      : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                  }`}
                  title={currentClassId ? "Initiate class live session timer" : "Pick class first"}
                >
                  <Play className="w-3.5 h-3.5 fill-current text-slate-950" /> START SESSION
                </button>
              )
            )}

            {currentClass && (
              <div className="text-right hidden sm:block border-l-2 border-slate-200 pl-4">
                <div className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">
                  {isSessionActive ? `⏱️ LIVE: ${elapsedTime}` : 'Active Class'}
                </div>
                <div className="text-xs font-black text-slate-900 uppercase font-display">{currentClass.name}</div>
              </div>
            )}

            {/* Google Authentication Accounts block - Rightmost side */}
            {loadingAuth ? (
              <div className="flex items-center gap-2 bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-xl">
                <RefreshCw className="w-3.5 h-3.5 text-slate-500 animate-spin" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verifying...</span>
              </div>
            ) : currentUser ? (
              <div className="flex items-center gap-2 bg-indigo-50 border-2 border-slate-950 px-3 py-1.5 rounded-xl shadow-bento-sm">
                {currentUser.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt={currentUser.displayName || "User"} 
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 rounded-full border border-slate-900"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center border border-slate-900 uppercase">
                    {(currentUser.displayName || "?")[0]}
                  </div>
                )}
                <div className="text-left leading-none max-w-[120px] hidden sm:block">
                  <div className="text-[10px] font-black text-slate-900 truncate uppercase tracking-tight">{currentUser.displayName || 'Teacher'}</div>
                  <div className="text-[8px] font-bold text-indigo-600 truncate">{currentUser.email}</div>
                </div>
                <button
                  id="header-logout-btn"
                  onClick={handleUserLogout}
                  title="Logout"
                  className="ml-1 text-slate-700 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="header-login-btn"
                onClick={handleGoogleLogin}
                className="bg-amber-400 text-slate-950 border-2 border-slate-900 hover:bg-amber-300 rounded-xl text-xs font-black uppercase tracking-wider px-4 py-2 flex items-center gap-2 transition-all cursor-pointer shadow-bento-sm hover:translate-x-[1px] hover:translate-y-[1px]"
              >
                <LogIn className="w-4 h-4" /> Sign In & Sync
              </button>
            )}

            <button
              id="header-pdf-export"
              onClick={handleDownloadPdf}
              className="bg-slate-900 text-white border-2 border-slate-900 hover:bg-slate-800 rounded-xl text-xs font-black uppercase tracking-wider px-4 py-2.5 flex items-center gap-2 transition-all cursor-pointer shadow-bento-sm hover:translate-x-[1px] hover:translate-y-[1px] whitespace-nowrap"
            >
              <FileDown className="w-4 h-4" /> Export PDF
            </button>
          </div>
        </div>
      </header>

      {/* Main Core Body */}
      <main className="max-w-7xl mx-auto px-6 py-6 flex-1 w-full flex flex-col gap-6">

        {/* Warning notification about Firebase Configuration if placeholder scale exists */}
        {!isFirebaseConfigured && (
          <div className="bg-amber-50 border-2 border-amber-600 rounded-2xl p-4 shadow-bento flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn" id="applet-firebase-notice-banner">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800 border border-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Cloud Backup Ready for Configuration</h3>
                <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">
                  Complete Firebase Onboarding in the AI Studio sidebar to link Google accounts and sync rosters.
                </p>
              </div>
            </div>
            <div className="text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-600 rounded px-2 py-1 select-none text-center sm:text-left self-start sm:self-center">
              LOCAL MEMORY MODE
            </div>
          </div>
        )}

        {/* Redefined Navigation Tabs - Bento Style */}
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
            disabled={classes.length === 0}
            onClick={() => setActiveTab('session')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border-2 ${
              classes.length === 0 ? 'opacity-40 cursor-not-allowed' : ''
            } ${
              activeTab === 'session'
                ? 'bg-indigo-600 text-white border-slate-900 shadow-bento-sm'
                : 'bg-white text-slate-700 border-transparent hover:bg-slate-50'
            }`}
          >
            <UserCircleIcon className="w-4 h-4" /> Class Session
          </button>

          <button
            id="tab-leaderboard"
            disabled={classes.length === 0}
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border-2 ${
              classes.length === 0 ? 'opacity-40 cursor-not-allowed' : ''
            } ${
              activeTab === 'leaderboard'
                ? 'bg-indigo-600 text-white border-slate-900 shadow-bento-sm'
                : 'bg-white text-slate-700 border-transparent hover:bg-slate-50'
            }`}
          >
            <Trophy className="w-4 h-4" /> Class Leaderboard
          </button>

          <button
            id="tab-history"
            disabled={classes.length === 0}
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border-2 ${
              classes.length === 0 ? 'opacity-40 cursor-not-allowed' : ''
            } ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white border-slate-900 shadow-bento-sm'
                : 'bg-white text-slate-700 border-transparent hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-4 h-4" /> Class History
          </button>
        </div>

        {/* Subtabs Menu layout under Class Session Parent Group */}
        {activeTab === 'session' && currentClass && (
          <div className="flex flex-wrap rounded-xl bg-slate-100 border border-slate-300 p-1.5 gap-1.5 animate-fadeIn" id="session-subtabs-line">
            <button
              onClick={() => setActiveSessionSubTab('live')}
              className={`flex-1 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all border cursor-pointer ${
                activeSessionSubTab === 'live'
                  ? 'bg-white text-slate-900 border-slate-900 shadow-sm font-sans'
                  : 'bg-transparent text-slate-600 border-transparent hover:bg-indigo-50/50 font-sans'
              }`}
            >
              Live Session
            </button>
            <button
              onClick={() => setActiveSessionSubTab('spin')}
              className={`flex-1 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all border cursor-pointer ${
                activeSessionSubTab === 'spin'
                  ? 'bg-white text-slate-900 border-slate-900 shadow-sm font-sans'
                  : 'bg-transparent text-slate-600 border-transparent hover:bg-indigo-50/50 font-sans'
              }`}
            >
              Spin the Wheel
            </button>
            <button
              onClick={() => setActiveSessionSubTab('groups')}
              className={`flex-1 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all border cursor-pointer ${
                activeSessionSubTab === 'groups'
                  ? 'bg-white text-slate-900 border-slate-900 shadow-sm font-sans'
                  : 'bg-transparent text-slate-600 border-transparent hover:bg-indigo-50/50 font-sans'
              }`}
            >
              Group Maker
            </button>
          </div>
        )}

        {/* Tab Viewport Router render */}
        <div className="flex-1">
          {activeTab === 'setup' && (
            <ClassOverview
              currentClass={currentClass}
              onSelectClass={(cls) => handleSelectClassId(cls.id)}
              classes={classes}
              onAddClass={handleAddClass}
              onDeleteClass={handleDeleteClass}
              onUpdateStudents={handleUpdateStudents}
              onExportBackup={handleExportBackup}
              onMoveStudent={handleMoveStudent}
              onUpdateClassDetails={handleUpdateClassDetails}
            />
          )}

          {activeTab === 'session' && (
            <div>
              {activeSessionSubTab === 'live' && (
                <SessionManager
                  classes={classes}
                  currentClass={currentClass}
                  onSelectClass={(cls) => handleSelectClassId(cls.id)}
                  isSessionActive={isSessionActive}
                  onStartSession={handleStartSession}
                  onEndSession={handleEndSession}
                  onUpdateStudents={handleUpdateStudents}
                  onRecordEvent={handleRecordEvent}
                  elapsedTime={elapsedTime}
                />
              )}

              {activeSessionSubTab === 'spin' && currentClass && (
                <div>
                  {isSessionActive ? (
                    <SpinWheel
                      currentClass={currentClass}
                      onRecordEvent={handleRecordEvent}
                      onUpdateStudents={handleUpdateStudents}
                    />
                  ) : (
                    <div className="bg-white border-2 border-slate-900 rounded-3xl p-12 text-center text-slate-500 max-w-xl mx-auto shadow-bento">
                      <Compass className="w-16 h-16 text-indigo-500 hover:rotate-45 transition-transform duration-500 mx-auto mb-4 animate-bounce" />
                      <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 font-display">Spin Wheel Picker</h3>
                      <p className="text-sm font-bold text-slate-500 mt-2">
                        Let's select students dynamically to gamify answering! First, choose and initiate a Live Session inside the 
                        <strong className="text-indigo-650 font-extrabold ml-1 cursor-pointer underline" onClick={() => setActiveSessionSubTab('live')}>Live Session</strong> tab first.
                      </p>
                      <button
                        onClick={() => setActiveSessionSubTab('live')}
                        className="mt-6 bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-900 rounded-xl text-xs font-black uppercase tracking-wider px-5 py-2.5 flex items-center gap-1.5 mx-auto transition-all cursor-pointer shadow-bento-sm hover:translate-x-[1px] hover:translate-y-[1px]"
                      >
                        <Play className="w-3.5 h-3.5 fill-current text-white" /> Open Live Tab
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeSessionSubTab === 'groups' && currentClass && (
                <div>
                  {isSessionActive ? (
                    <GroupMaker
                      currentClass={currentClass}
                      onRecordEvent={handleRecordEvent}
                      onUpdateStudents={handleUpdateStudents}
                    />
                  ) : (
                    <div className="bg-white border-2 border-slate-900 rounded-3xl p-12 text-center text-slate-500 max-w-xl mx-auto shadow-bento">
                      <Users className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
                      <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 font-display">Dynamic Group Maker</h3>
                      <p className="text-sm font-bold text-slate-500 mt-2">
                        Form fast, random work-teams of various sizes and instantly grade outcomes. First, choose and initiate a Live Session inside the 
                        <strong className="text-indigo-650 font-extrabold ml-1 cursor-pointer underline" onClick={() => setActiveSessionSubTab('live')}>Live Session</strong> tab first.
                      </p>
                      <button
                        onClick={() => setActiveSessionSubTab('live')}
                        className="mt-6 bg-slate-900 hover:bg-slate-850 text-white border-2 border-slate-900 rounded-xl text-xs font-black uppercase tracking-wider px-5 py-2.5 flex items-center gap-1.5 mx-auto transition-all cursor-pointer shadow-bento-sm hover:translate-x-[1px] hover:translate-y-[1px]"
                      >
                        <Play className="w-3.5 h-3.5 fill-current text-white" /> Open Live Tab
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'leaderboard' && currentClass && (
            <Leaderboard currentClass={currentClass} />
          )}

          {activeTab === 'history' && (
            <ClassHistory
              currentClass={currentClass}
              classes={classes}
              onSelectClass={(cls) => handleSelectClassId(cls.id)}
            />
          )}
        </div>

      </main>

      {/* Save Timer Sync & Conflict Resolution Modal */}
      {compareModalOpen && originalSessionData && newSessionData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn" id="compare-modal-backdrop">
          <div className="bg-white border-4 border-slate-900 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] relative flex flex-col gap-6 animate-scaleIn" id="compare-modal-container">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 mb-1">
                <Cloud className="w-5 h-5 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-widest">Data Resolution Needed</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight font-display">
                Session Timer Comparison & Sync
              </h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
                A mismatch or auto-save point requires confirmation. Compare both session snapshots below and select which state to preserve by clicking its card.
              </p>
            </div>

            {/* Side-by-Side Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Card Original: Cloud State */}
              <div 
                id="compare-card-original"
                onClick={() => setSelectedSaveOption('original')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col gap-4 select-none ${
                  selectedSaveOption === 'original'
                    ? 'border-indigo-600 bg-indigo-50 shadow-bento-sm ring-2 ring-indigo-600 ring-offset-2'
                    : 'border-slate-900 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded border border-indigo-300">
                    Original (Cloud Backup)
                  </span>
                  <div className={`w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center ${selectedSaveOption === 'original' ? 'bg-indigo-600' : 'bg-white'}`}>
                    {selectedSaveOption === 'original' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>

                <div className="text-center py-4">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ELAPSED TIME</div>
                  <div className="text-4xl font-black font-mono text-slate-900 mt-1">
                    {originalSessionData.sessionElapsedTime}
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-200 pt-3 text-[10px] font-bold text-slate-600 uppercase space-y-1">
                  <div className="flex justify-between">
                    <span>Active Status:</span>
                    <span className={originalSessionData.sessionActive ? 'text-emerald-600 font-extrabold' : 'text-slate-400 font-extrabold'}>
                      {originalSessionData.sessionActive ? '● ON (LIVE)' : '○ STANDBY'}
                    </span>
                  </div>
                  <div className="flex justify-between truncate">
                    <span>Start:</span>
                    <span className="text-slate-500 font-mono">
                      {originalSessionData.sessionStartTime 
                        ? new Date(originalSessionData.sessionStartTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})
                        : 'No Start Time'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card New: Local Live State */}
              <div 
                id="compare-card-new"
                onClick={() => setSelectedSaveOption('new')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col gap-4 select-none ${
                  selectedSaveOption === 'new'
                    ? 'border-amber-500 bg-amber-50 shadow-bento-sm ring-2 ring-amber-500 ring-offset-2'
                    : 'border-slate-900 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300">
                    New (Live Local Timer)
                  </span>
                  <div className={`w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center ${selectedSaveOption === 'new' ? 'bg-amber-500' : 'bg-white'}`}>
                    {selectedSaveOption === 'new' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>

                <div className="text-center py-4">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ELAPSED TIME</div>
                  <div className="text-4xl font-black font-mono text-slate-900 mt-1">
                    {newSessionData.sessionElapsedTime}
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-200 pt-3 text-[10px] font-bold text-slate-600 uppercase space-y-1">
                  <div className="flex justify-between">
                    <span>Active Status:</span>
                    <span className={newSessionData.sessionActive ? 'text-emerald-600 font-extrabold' : 'text-slate-400 font-extrabold'}>
                      {newSessionData.sessionActive ? '● ON (LIVE)' : '○ STANDBY'}
                    </span>
                  </div>
                  <div className="flex justify-between truncate">
                    <span>Start:</span>
                    <span className="text-slate-500 font-mono">
                      {newSessionData.sessionStartTime 
                        ? new Date(newSessionData.sessionStartTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})
                        : 'No Start Time'}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 mt-2 border-t-2 border-slate-100 pt-4">
              <button
                id="compare-btn-cancel"
                onClick={() => {
                  setCompareModalOpen(false);
                  setSessionSaveState('synced');
                  setSecondsUntilSave(30);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border-2 border-slate-900 text-slate-700 hover:bg-slate-50 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancel Save
              </button>
              
              <button
                id="compare-btn-resolve"
                onClick={handleResolveAndSave}
                disabled={sessionSaveState === 'saving'}
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-850 text-white border-2 border-slate-900 rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-bento-sm hover:translate-x-[1px] hover:translate-y-[1px] cursor-pointer"
              >
                {sessionSaveState === 'saving' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Resolving State...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Apply & Save Selected Card
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEndSessionRecap && lastLoggedSession && (
        <ClassSessionRecapDialog
          session={lastLoggedSession}
          onClose={() => setShowEndSessionRecap(false)}
        />
      )}

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
