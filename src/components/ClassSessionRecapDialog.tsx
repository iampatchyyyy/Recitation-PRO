import React, { useRef } from 'react';
import { ClassSession } from '../types';
import { generateSessionPdf } from '../utils/sessionPdfGenerator';
import { 
  X, 
  Trophy, 
  Calendar, 
  Clock, 
  Sparkles, 
  UserCheck, 
  Users, 
  Activity,
  FileText,
  Image as ImageIcon
} from 'lucide-react';

interface ClassSessionRecapDialogProps {
  session: ClassSession;
  onClose: () => void;
}

export function ClassSessionRecapDialog({ session, onClose }: ClassSessionRecapDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Download PDF
  const handleDownloadPdf = () => {
    generateSessionPdf(session);
  };

  // Export as high-fidelity Image using dynamically rendered HTML Canvas
  const handleExportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-DPI scaling
    canvas.width = 800;
    canvas.height = 480;

    // Base background styling
    ctx.fillStyle = '#F8FAFC'; // slate-50
    ctx.fillRect(0, 0, 800, 480);

    // Dynamic borders
    ctx.strokeStyle = '#0F172A'; // slate-900
    ctx.lineWidth = 6;
    ctx.strokeRect(0, 0, 800, 480);

    // Top Brand Accent
    ctx.fillStyle = '#4F46E5'; // indigo-600
    ctx.fillRect(3, 3, 794, 16);

    // Brand Title watermark
    ctx.font = 'black 10px monospace';
    ctx.fillStyle = '#64748B';
    ctx.fillText('RECITATRACK PRO • SNAPSHOT UTILITY', 30, 45);

    // Class Title
    ctx.font = '900 32px sans-serif';
    ctx.fillStyle = '#0F172A';
    ctx.fillText(session.className.toUpperCase(), 30, 88);

    // Date & Timing
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#475569';
    const dateStr = new Date(session.startTime).toLocaleDateString();
    ctx.fillText(`DATE: ${dateStr}  |  DURATION: ${session.duration}`, 30, 118);

    // Line separator
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(30, 140);
    ctx.lineTo(770, 140);
    ctx.stroke();

    // Stats Grid - Row 1
    // Draw Card 1: Attendance
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 3;
    ctx.fillRect(30, 168, 230, 120);
    ctx.strokeRect(30, 168, 230, 120);

    // Mini icon box
    ctx.fillStyle = '#D1FAE5'; // emerald-100
    ctx.fillRect(45, 190, 42, 42);
    ctx.strokeRect(45, 190, 42, 42);
    
    ctx.fillStyle = '#065F46'; // emerald-800
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✓', 45 + 21, 190 + 28);
    ctx.textAlign = 'left';

    // Text details Card 1
    ctx.fillStyle = '#64748B';
    ctx.font = '900 9px monospace';
    ctx.fillText('ATTENDANCE', 100, 193);

    ctx.fillStyle = '#0F172A';
    ctx.font = '900 18px sans-serif';
    ctx.fillText(`${session.studentsCount} Active`, 100, 218);

    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('Present roster', 100, 238);

    // Draw Card 2: Recitation Total points & count
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(285, 168, 230, 120);
    ctx.strokeRect(285, 168, 230, 120);

    // Mini icon box
    ctx.fillStyle = '#E0E7FF'; // indigo-100
    ctx.fillRect(300, 190, 42, 42);
    ctx.strokeRect(300, 190, 42, 42);
    
    ctx.fillStyle = '#3730A3'; // indigo-800
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚡', 300 + 21, 190 + 27);
    ctx.textAlign = 'left';

    // Text details Card 2
    ctx.fillStyle = '#64748B';
    ctx.font = '900 9px monospace';
    ctx.fillText('RECITATION TOTAL', 355, 193);

    ctx.fillStyle = '#4F46E5';
    ctx.font = '900 18px sans-serif';
    ctx.fillText(`+${session.pointsAwarded} pts`, 355, 218);

    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText(`${session.eventsCount} logged turns`, 355, 238);

    // Draw Card 3: Spectacular Golden MVP highlight
    ctx.fillStyle = '#FEF3C7'; // warm amber bg
    ctx.fillRect(540, 168, 230, 120);
    ctx.strokeRect(540, 168, 230, 120);

    // Mini icon box
    ctx.fillStyle = '#FBBF24'; // amber-400
    ctx.fillRect(555, 190, 42, 42);
    ctx.strokeRect(555, 190, 42, 42);
    
    ctx.fillStyle = '#78350F';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★', 555 + 21, 190 + 28);
    ctx.textAlign = 'left';

    // Text details Card 3
    ctx.fillStyle = '#92400E';
    ctx.font = '900 9px monospace';
    ctx.fillText('SESSION MVP', 610, 193);

    ctx.fillStyle = '#0F172A';
    let cleanMVPName = session.mvpName || 'None';
    if (cleanMVPName.length > 15) {
      ctx.font = '900 12px sans-serif';
      if (cleanMVPName.length > 20) {
        cleanMVPName = cleanMVPName.substring(0, 18) + '..';
      }
    } else {
      ctx.font = '900 15px sans-serif';
    }
    ctx.fillText(cleanMVPName, 610, 218);

    ctx.fillStyle = '#B45309';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText(session.mvpPointsGained > 0 ? `+${session.mvpPointsGained} Recitation pts` : 'No points gained', 610, 238);

    // Stats Grid - Row 2: Comprehensive Details
    // Card 4: Attendance Roll-Call stats
    ctx.fillStyle = '#F8FAFC'; // slate-50
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 3;
    ctx.fillRect(30, 308, 360, 115);
    ctx.strokeRect(30, 308, 360, 115);

    ctx.fillStyle = '#0F172A';
    ctx.font = '900 11px monospace';
    ctx.fillText('✓ ATTENDANCE ROLL-CALL STATS', 45, 330);

    const cellsAttendance = [
      { label: 'PRESENT', value: session.studentsCount, color: '#10B981' },
      { label: 'LATE', value: session.lateCount ?? 0, color: '#F59E0B' },
      { label: 'ABSENT', value: session.absentCount ?? 0, color: '#EF4444' },
      { label: 'EXCUSED', value: session.excusedCount ?? 0, color: '#64748B' }
    ];

    cellsAttendance.forEach((cell, idx) => {
      const cellX = 45 + idx * (72 + 12);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(cellX, 340, 72, 45);
      ctx.strokeRect(cellX, 340, 72, 45);

      ctx.fillStyle = '#64748B';
      ctx.font = '900 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(cell.label, cellX + 36, 353);

      ctx.fillStyle = '#0F172A';
      ctx.font = '900 15px sans-serif';
      ctx.fillText(`${cell.value}`, cellX + 36, 375);
    });
    ctx.textAlign = 'left';

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 9px monospace';
    const totalCap = (session.studentsCount || 0) + (session.lateCount || 0) + (session.absentCount || 0) + (session.excusedCount || 0);
    ctx.fillText(`Total Class Attendance Capacity: ${totalCap} Students`, 45, 407);

    // Card 5: Interaction & Engagement insights
    ctx.fillStyle = '#F8FAFC'; // slate-50
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 3;
    ctx.fillRect(410, 308, 360, 115);
    ctx.strokeRect(410, 308, 360, 115);

    ctx.fillStyle = '#0F172A';
    ctx.font = '900 11px monospace';
    ctx.fillText('⚡ ENGAGEMENT & TOOL USAGE SUMMARY', 425, 330);

    // Cell 1: Engaged
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(425, 340, 100, 45);
    ctx.strokeRect(425, 340, 100, 45);

    ctx.fillStyle = '#64748B';
    ctx.font = '900 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ENGAGED', 425 + 50, 353);

    ctx.fillStyle = '#4F46E5';
    ctx.font = '900 13px sans-serif';
    ctx.fillText(`${session.uniqueParticipantsCount ?? 0} studs`, 425 + 50, 375);

    // Cell 2: Engage %
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(538, 340, 100, 45);
    ctx.strokeRect(538, 340, 100, 45);

    ctx.fillStyle = '#64748B';
    ctx.font = '900 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ENGAGE %', 538 + 50, 353);

    ctx.fillStyle = '#4F46E5';
    ctx.font = '900 15px sans-serif';
    ctx.fillText(`${session.engagementRate ?? 0}%`, 538 + 50, 375);

    // Cell 3: Status Ratio
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(651, 340, 100, 45);
    ctx.strokeRect(651, 340, 100, 45);

    ctx.fillStyle = '#64748B';
    ctx.font = '900 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('STATUS RATIO', 651 + 50, 353);

    ctx.font = '900 12px sans-serif';
    const posVal = `+${session.positiveEventsCount ?? 0}`;
    const negVal = `-${session.negativeEventsCount ?? 0}`;
    ctx.fillStyle = '#10B981'; // Green
    ctx.fillText(posVal, 651 + 32, 375);
    ctx.fillStyle = '#94A3B8'; // Gray separator
    ctx.fillText('/', 651 + 50, 375);
    ctx.fillStyle = '#EF4444'; // Red
    ctx.fillText(negVal, 651 + 68, 375);
    
    ctx.textAlign = 'left';

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(`Spins: ${session.spinWheelWinnersCount ?? 0}   |   Groups: ${session.groupGradingsCount ?? 0}`, 425, 407);

    // Watermark tag
    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('MADE WITH RECITATRACK PRO FOR TEACHERS', 30, 455);

    // Trigger download
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `session_snapshot_${session.className.toLowerCase().replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert('Error rendering image snapshot canvas.');
    }
  };

  const hasEvents = session.events && session.events.length > 0;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" 
      id="session-recap-recap-backdrop"
    >
      {/* Hidden offsite canvas to draw PNG share snapshot */}
      <canvas ref={canvasRef} className="hidden" />

      <div 
        className="bg-white border-4 border-slate-900 rounded-3xl p-6 md:p-8 max-w-3xl w-full shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] relative flex flex-col gap-6 max-h-[90vh] overflow-y-auto animate-scaleIn font-sans text-slate-800" 
        id="session-recap-recap-dialog"
      >
        
        {/* Close Button badge */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 rounded-xl border-2 border-slate-900 transition-colors cursor-pointer"
          title="Dismiss dialog"
        >
          <X className="w-5 h-5 text-slate-900 shadow-sm" />
        </button>

        {/* Header Summary Info */}
        <div className="flex items-start gap-4 pr-10">
          <div className="p-3.5 rounded-2xl bg-amber-400 text-slate-950 border-2 border-slate-900 shadow-bento-sm">
            <Trophy className="w-8 h-8 animate-bounce text-slate-950" />
          </div>
          <div>
            <div className="text-[10px] font-black tracking-widest text-indigo-650 uppercase">Session Finished</div>
            <h2 className="text-2xl font-black text-slate-900 leading-tight uppercase font-display">
              {session.className} Live Session stats
            </h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mt-1">
              <Calendar className="w-3.5 h-3.5" /> 
              {new Date(session.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              <span className="text-slate-350">•</span>
              <Clock className="w-3.5 h-3.5" /> 
              {session.duration} timer runtime
            </p>
          </div>
        </div>

        {/* Premium Bento Stats Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Box 1: Student count */}
          <div className="bg-slate-50 border-2 border-slate-900 p-4 rounded-2xl flex items-center gap-3 shadow-bento-sm">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 border-2 border-slate-900">
              <UserCheck className="w-5 h-5 text-emerald-800" />
            </div>
            <div>
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Attendance</div>
              <div className="text-lg font-black text-slate-900 font-mono leading-none mt-1">
                {session.studentsCount} Active
              </div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Present</p>
            </div>
          </div>

          {/* Box 2: Actions & Recitation totals */}
          <div className="bg-slate-50 border-2 border-slate-900 p-4 rounded-2xl flex items-center gap-3 shadow-bento-sm">
            <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-800 border-2 border-slate-900">
              <Activity className="w-5 h-5 text-indigo-800" />
            </div>
            <div>
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Recitation Total</div>
              <div className="text-lg font-black text-slate-900 leading-none mt-1">
                +{session.pointsAwarded} pts
              </div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{session.eventsCount} logged turns</p>
            </div>
          </div>

          {/* Box 3: Spectacular Golden Session MVP card */}
          <div className="bg-amber-50 border-2 border-slate-900 p-4 rounded-2xl flex items-center gap-3 shadow-bento-sm relative overflow-hidden">
            <div className="absolute -right-2 -bottom-2 opacity-5 scale-150 rotate-12">
              <Sparkles className="w-20 h-20 text-amber-500" />
            </div>
            <div className="p-2.5 rounded-xl bg-amber-400 text-slate-950 border-2 border-slate-900">
              <Sparkles className="w-5 h-5 text-slate-950 animate-pulse" />
            </div>
            <div className="z-10 truncate min-w-0">
              <div className="text-[9px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-1">
                Session MVP <Sparkles className="w-3 h-3 text-amber-600 inline-block animate-spin" />
              </div>
              <div className="text-lg font-black text-slate-900 leading-none mt-1 truncate" title={session.mvpName || 'No recitation'}>
                {session.mvpName || 'None'}
              </div>
              <p className="text-[9px] font-bold text-amber-700 uppercase tracking-widest mt-0.5">
                {session.mvpPointsGained > 0 ? `+${session.mvpPointsGained} Recitation pts` : 'No points gained'}
              </p>
            </div>
          </div>

        </div>

        {/* Additional Comprehensive Session Stats widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Detailed Roll Call breakdown card */}
          <div className="bg-slate-50 border-2 border-slate-900 p-4 rounded-xl shadow-bento-sm">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2.5 flex items-center gap-1.5 font-display">
              <UserCheck className="w-4 h-4 text-emerald-600" /> Attendance Roll-Call stats
            </h4>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-white border-2 border-slate-900 p-1.5 rounded-lg">
                <span className="block text-[8px] text-slate-405 font-extrabold uppercase mb-0.5">PRESENT</span>
                <span className="font-extrabold text-slate-900 text-xs sm:text-sm">{session.studentsCount}</span>
              </div>
              <div className="bg-white border-2 border-slate-900 p-1.5 rounded-lg">
                <span className="block text-[8px] text-slate-405 font-extrabold uppercase mb-0.5">LATE</span>
                <span className="font-extrabold text-slate-900 text-xs sm:text-sm">{session.lateCount ?? 0}</span>
              </div>
              <div className="bg-white border-2 border-slate-900 p-1.5 rounded-lg">
                <span className="block text-[8px] text-slate-405 font-extrabold uppercase mb-0.5">ABSENT</span>
                <span className="font-extrabold text-slate-900 text-xs sm:text-sm">{session.absentCount ?? 0}</span>
              </div>
              <div className="bg-white border-2 border-slate-900 p-1.5 rounded-lg">
                <span className="block text-[8px] text-slate-405 font-extrabold uppercase mb-0.5">EXCUSED</span>
                <span className="font-extrabold text-slate-900 text-xs sm:text-sm">{session.excusedCount ?? 0}</span>
              </div>
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-2 px-1 text-center font-mono">
              Total Class Capacity: {(session.studentsCount || 0) + (session.lateCount || 0) + (session.absentCount || 0) + (session.excusedCount || 0)} Students
            </p>
          </div>

          {/* Session Interaction & Engagement insights card */}
          <div className="bg-slate-50 border-2 border-slate-900 p-4 rounded-xl shadow-bento-sm flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2.5 flex items-center gap-1.5 font-display">
                <Activity className="w-4 h-4 text-indigo-600" /> Engagement & Tool Usage Summary
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white border-2 border-slate-900 px-1.5 py-1 rounded-lg">
                  <span className="block text-[8px] text-slate-405 font-extrabold uppercase leading-tight mb-0.5">ENGAGED</span>
                  <span className="font-black text-indigo-700 text-xs sm:text-sm">{session.uniqueParticipantsCount ?? 0} studs</span>
                </div>
                <div className="bg-white border-2 border-slate-900 px-1.5 py-1 rounded-lg">
                  <span className="block text-[8px] text-slate-405 font-extrabold uppercase leading-tight mb-0.5 font-mono">ENGAGE %</span>
                  <span className="font-black text-indigo-700 text-xs sm:text-sm">{session.engagementRate ?? 0}%</span>
                </div>
                <div className="bg-white border-2 border-slate-900 px-1.5 py-1 rounded-lg flex flex-col justify-center">
                  <span className="block text-[8px] text-slate-405 font-extrabold uppercase leading-tight">STATUS RATIO</span>
                  <span className="font-bold text-slate-800 text-[10px] mt-0.5">
                    <span className="text-emerald-600 font-extrabold">+{session.positiveEventsCount ?? 0}</span>
                    <span className="text-slate-400 font-normal">/</span>
                    <span className="text-rose-600 font-extrabold">-{session.negativeEventsCount ?? 0}</span>
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between border-t border-slate-205 mt-2 pt-1.5 text-[8px] sm:text-[9px] font-bold text-slate-650 uppercase tracking-widest px-1 font-mono">
              <span>Picker Spins: <strong className="text-slate-900">{session.spinWheelWinnersCount ?? 0}</strong></span>
              <span>Team Challenges: <strong className="text-slate-900">{session.groupGradingsCount ?? 0}</strong></span>
            </div>
          </div>
        </div>

        {/* Scrollable list of recitation events generated in this session */}
        <div className="border-2 border-slate-900 rounded-2xl overflow-hidden flex flex-col bg-white shadow-bento-sm flex-1 max-h-[300px]">
          <div className="bg-slate-900 text-white px-4 py-2.5 text-xs font-black uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" /> Session Event Logs ({session.eventsCount})
          </div>
          <div className="p-2 overflow-y-auto space-y-1.5 divide-y divide-slate-100 flex-1">
            {!hasEvents ? (
              <div className="text-center py-10 text-slate-400 italic text-xs uppercase tracking-wider">
                No individual participation was graded during this session.
              </div>
            ) : (
              session.events?.map((el, i) => (
                <div key={el.id || i} className="flex items-center justify-between gap-3 text-xs pt-1.5 first:pt-0">
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <span className="font-mono text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      {new Date(el.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className="font-extrabold text-slate-900 uppercase truncate">{el.studentName}</span>
                    <span className="text-slate-400 truncate hidden sm:inline">— {el.reason || 'Logged answer'}</span>
                  </div>
                  <div className={`font-mono font-black shrink-0 ${el.pointsAwarded >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {el.pointsAwarded >= 0 ? `+${el.pointsAwarded}` : el.pointsAwarded} pts
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Share Snapshot and Export Utilities Buttons section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t-2 border-slate-100 pt-4 mt-2">
          
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center sm:text-left">
            Export for parents, students, or administration reports
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            
            {/* Generate Image png block */}
            <button
              onClick={handleExportImage}
              className="w-full sm:w-auto bg-amber-400 text-slate-950 border-2 border-slate-900 rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:bg-amber-300 cursor-pointer shadow-bento-sm active:translate-x-[1px] active:translate-y-[1px]"
              title="Download snapshot image file (PNG)"
            >
              <ImageIcon className="w-4 h-4 text-slate-950" /> Export Snapshot Image
            </button>

            {/* Generate PDF block */}
            <button
              onClick={handleDownloadPdf}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-900 rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-bento-sm active:translate-x-[1px] active:translate-y-[1px]"
              title="Download official PDF report file"
            >
              <FileText className="w-4 h-4 text-emerald-400 animate-pulse" /> Export PDF Summary
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}
