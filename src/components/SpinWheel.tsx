import React, { useState, useRef, useEffect } from 'react';
import { Classroom, Student } from '../types';
import { Sparkles, Play, Award, HelpCircle, Flame, Check } from 'lucide-react';
import { generateAvatarSvg } from '../utils/avatarUtils';

interface SpinWheelProps {
  currentClass: Classroom;
  onRecordEvent: (studentId: string, points: number, reason: string) => void;
  onUpdateStudents: (updatedStudents: Student[]) => void;
}

const SECTOR_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
  '#6366F1', '#84CC16', '#06B6D4', '#D946EF'
];

export default function SpinWheel({
  currentClass,
  onRecordEvent,
  onUpdateStudents
}: SpinWheelProps) {
  // Only students marked "present" or "late" should be selectable
  const activeStudents = currentClass.students.filter(
    (s) => s.attendance === 'present' || s.attendance === 'late'
  );

  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [awardPoints, setAwardPoints] = useState(3);
  const [awardReason, setAwardReason] = useState('Recitation Picker Winner');
  const [showWinnerModal, setShowWinnerModal] = useState(false);

  const wheelRef = useRef<SVGSVGElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Math variables for physics spin
  const spinVelocity = useRef(0);
  const currentAngle = useRef(0);

  // Clean animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleStartSpin = () => {
    if (activeStudents.length === 0 || isSpinning) return;

    setIsSpinning(true);
    setSelectedStudent(null);
    setShowWinnerModal(false);

    // Seed variables
    // High initial velocity that randomizes slightly
    spinVelocity.current = 40 + Math.random() * 25; 
    
    const animate = () => {
      // Rotate
      currentAngle.current = (currentAngle.current + spinVelocity.current) % 360;
      setRotationDegrees(currentAngle.current);

      // Decelerate physics
      spinVelocity.current *= 0.982; // damping factor

      if (spinVelocity.current > 0.1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Spin finished! Calculate landed item
        setIsSpinning(false);
        calculateWinner();
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const calculateWinner = () => {
    if (activeStudents.length === 0) return;

    // Needle points at 270 degrees (straight up) on standard SVG wheel or standard 0 degrees
    // With positive rotation, the wheel moves counter-clockwise relative to the indicator at top (270°)
    // Let's deduce mapped angles
    const sectorAngle = 360 / activeStudents.length;
    
    // Normalize current angle
    const normalizedAngle = (360 - (currentAngle.current % 360)) % 360;
    
    // Subtract 90 degrees offset because the arrow pointer is at top (y-axis)
    const landingAngle = (normalizedAngle + 90) % 360;
    
    const winnerIndex = Math.floor(landingAngle / sectorAngle) % activeStudents.length;
    const winner = activeStudents[winnerIndex];
    
    setSelectedStudent(winner);
    setShowWinnerModal(true);
  };

  const submitAwardPoints = () => {
    if (!selectedStudent) return;

    // Record Event
    onRecordEvent(selectedStudent.id, awardPoints, awardReason);

    // Update Students State
    const updated = currentClass.students.map((s) => {
      if (s.id === selectedStudent.id) {
        const today = new Date().toISOString().substring(0, 10);
        let newStreak = s.streak;
        if (awardPoints > 0 && s.lastRecitationDate !== today) {
          newStreak = s.streak + 1;
        }

        return {
          ...s,
          points: Math.max(0, s.points + awardPoints),
          streak: newStreak,
          lastRecitationDate: awardPoints > 0 ? today : s.lastRecitationDate
        };
      }
      return s;
    });

    onUpdateStudents(updated);
    setShowWinnerModal(false);
    setSelectedStudent(null);
  };

  // Generate wheel sectors markup
  const renderSectors = () => {
    const total = activeStudents.length;
    if (total === 0) return null;

    const sectorAngle = 360 / total;

    return activeStudents.map((student, idx) => {
      const color = SECTOR_COLORS[idx % SECTOR_COLORS.length];
      const startAngle = idx * sectorAngle;
      const endAngle = startAngle + sectorAngle;
      
      // Convert to radians to compute coordinates
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const r = 180; // Radius
      const cx = 200; // Center X
      const cy = 200; // Center Y

      // Sector coordinates
      const x1 = cx + r * Math.cos(startRad);
      const y1 = cy + r * Math.sin(startRad);
      const x2 = cx + r * Math.cos(endRad);
      const y2 = cy + r * Math.sin(endRad);

      const largeArcFlag = sectorAngle > 180 ? 1 : 0;

      // Draw path
      const pathData = total === 1 
        ? `M ${cx} ${cy} m -${r} 0 a ${r} ${r} 0 1 0 ${r*2} 0 a ${r} ${r} 0 1 0 -${r*2} 0`
        : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

      // Text rotation and placing
      const midAngle = startAngle + sectorAngle / 2;
      const midRad = (midAngle * Math.PI) / 180;
      const textX = cx + (r * 0.6) * Math.cos(midRad);
      const textY = cy + (r * 0.6) * Math.sin(midRad);

      return (
        <g key={student.id}>
          <path d={pathData} fill={color} stroke="#FFFFFF" strokeWidth="2.5" />
          <text
            x={textX}
            y={textY}
            fill="#FFFFFF"
            fontSize={total > 12 ? '9' : '11'}
            fontWeight="bold"
            textAnchor="middle"
            alignmentBaseline="middle"
            transform={`rotate(${midAngle}, ${textX}, ${textY})`}
          >
            {student.name.substring(0, 10)}
          </text>
        </g>
      );
    });
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-900 p-6 shadow-bento grid grid-cols-1 md:grid-cols-2 gap-8 items-center" id="spin-wheel-root">
      
      {/* Visual Wheel column */}
      <div className="flex flex-col items-center justify-center relative">
        <h3 className="text-lg font-black uppercase tracking-tight font-display text-slate-900 mb-6 flex items-center gap-2">
          <Sparkles className="text-amber-500 fill-current w-5 h-5" /> Interactive Student Picker
        </h3>

        {activeStudents.length === 0 ? (
          <div className="text-center py-16 px-4 shrink-0 bg-slate-100 border-2 border-dashed border-slate-900 rounded-3xl w-full max-w-[320px]">
            <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h4 className="font-black text-slate-700 text-sm uppercase">No Active Students Available</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto font-bold uppercase tracking-wider">
              Please mark at least one student as 'Present' or 'Late' in the Live Session tab first!
            </p>
          </div>
        ) : (
          <div className="relative w-full max-w-[340px] aspect-square flex items-center justify-center">
            
            {/* Top Indicator Arrow */}
            <div className="absolute -top-3 z-20 flex flex-col items-center">
              <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[20px] border-t-amber-500 drop-shadow-sm" />
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border-2 border-slate-900 -mt-1.5" />
            </div>

            {/* SVG Wheel Graphic */}
            <div className="w-full h-full bg-slate-900/5 rounded-full p-2.5 relative shadow-inner">
              <svg
                ref={wheelRef}
                viewBox="0 0 400 400"
                className="w-full h-full transition-shadow duration-300"
                style={{
                  transform: `rotate(${rotationDegrees}deg)`,
                  transformOrigin: '50% 50%'
                }}
              >
                {/* Outer decorative ring */}
                <circle cx="200" cy="200" r="190" fill="none" stroke="#0F172A" strokeWidth="4" />
                <circle cx="200" cy="200" r="185" fill="none" stroke="#1E293B" strokeWidth="2.5" />

                {/* Slices */}
                {renderSectors()}
                
                {/* Center cap core */}
                <circle cx="200" cy="200" r="32" fill="#1E293B" stroke="#0F172A" strokeWidth="4" />
                <circle cx="200" cy="200" r="10" fill="#FBBF24" />
              </svg>
            </div>

            {/* Spin Trigger Center Overlay */}
            <button
              id="spin-center-trigger-btn"
              disabled={isSpinning}
              onClick={handleStartSpin}
              className={`absolute w-16 h-16 rounded-full flex flex-col items-center justify-center font-black text-xs shadow-bento-sm transition-all active:scale-95 cursor-pointer border-2 border-slate-900 z-10 ${
                isSpinning
                  ? 'bg-slate-200 text-slate-400'
                  : 'bg-indigo-600 text-white hover:bg-indigo-750'
              }`}
            >
              <span>{isSpinning ? 'SPIN' : 'GO!'}</span>
            </button>

          </div>
        )}
      </div>

      {/* Control panel and Winner display column */}
      <div className="space-y-6">
        <div className="bg-[#f1f5f9] rounded-2xl p-5 border-2 border-slate-900 shadow-bento-sm">
          <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-xs mb-2">Participant List ({activeStudents.length})</h4>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4">
            Only present/late student names appear on the spin wheel sector.
          </p>

          <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto pr-1">
            {activeStudents.map((st, i) => (
              <span
                key={st.id}
                className="text-[10px] font-black uppercase tracking-wider bg-white border-2 border-slate-900 text-slate-800 px-2.5 py-1 rounded-lg flex items-center gap-1.5"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full border border-slate-900"
                  style={{ backgroundColor: SECTOR_COLORS[i % SECTOR_COLORS.length] }}
                />
                {st.name}
              </span>
            ))}
          </div>
        </div>

        {/* Winner display panel */}
        {showWinnerModal && selectedStudent && (
          <div className="bg-amber-100 border-2 border-slate-900 shadow-bento rounded-3xl p-6 relative overflow-hidden transition-all duration-300">
            {/* Soft decorative flame light */}
            <div className="absolute top-2 right-2 opacity-10">
              <Flame className="w-24 h-24 text-amber-500 fill-current animate-pulse" />
            </div>

            <div className="text-center space-y-4 relative z-10">
              <div className="inline-flex bg-slate-900 text-amber-400 text-[10px] font-black px-3 py-1 rounded-lg border-2 border-slate-900 tracking-wider uppercase mb-1 shadow-bento-sm">
                🎉 SELECTED WINNER
              </div>

              <div className="w-16 h-16 rounded-full border-2 border-slate-900 bg-white shadow-bento-sm mx-auto overflow-hidden">
                <div
                  className="w-full h-full"
                  dangerouslySetInnerHTML={{ __html: generateAvatarSvg(selectedStudent.avatarSeed) }}
                />
              </div>

              <div>
                <h4 className="text-xl font-black font-display uppercase tracking-tight text-slate-900">{selectedStudent.name}</h4>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Current Points: {selectedStudent.points} | Streak: {selectedStudent.streak}</p>
              </div>

              {/* Reward Form */}
              <div className="bg-white border-2 border-slate-900 rounded-2xl p-4 text-left space-y-3.5">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Reason/Activity</label>
                  <input
                    type="text"
                    value={awardReason}
                    onChange={(e) => setAwardReason(e.target.value)}
                    className="w-full text-xs font-semibold border-2 border-slate-900 rounded-lg px-2.5 py-2 focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Points to Award</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 5].map((val) => (
                      <button
                        key={val}
                        id={`award-pt-sel-${val}`}
                        onClick={() => setAwardPoints(val)}
                        className={`flex-1 py-1 text-xs border-2 border-slate-900 font-bold rounded-lg transition-all cursor-pointer ${
                          awardPoints === val
                            ? 'bg-amber-400 text-slate-900 font-black shadow-bento-sm translate-x-[-1px] translate-y-[-1px]'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 shadow-none'
                        }`}
                      >
                        +{val}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  id="submit-winner-award-btn"
                  onClick={submitAwardPoints}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white border-2 border-slate-900 rounded-xl py-2.5 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-bento-sm hover:translate-x-[1px] hover:translate-y-[1px]"
                >
                  <Award className="w-3.5 h-3.5 text-amber-300 fill-current" /> Log Winner Award
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
