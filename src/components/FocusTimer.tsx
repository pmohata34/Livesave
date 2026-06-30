import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Flame, CheckCircle, Bell, Eye, EyeOff } from "lucide-react";
import { Task } from "../types";

interface FocusTimerProps {
  tasks: Task[];
  onCompleteSubtask: (taskId: string, subtaskId: string) => void;
}

export default function FocusTimer({ tasks, onCompleteSubtask }: FocusTimerProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [timerMode, setTimerMode] = useState<"focus" | "break">("focus");
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60); // 25 minutes default
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const activeTask = tasks.find((t) => t.id === selectedTaskId);
  const activeIncompleteSubtasks = activeTask 
    ? activeTask.subtasks.filter((sub) => !sub.completed)
    : [];

  const timerRef = useRef<any>(null);

  useEffect(() => {
    const activeTask = tasks.find((t) => t.id === selectedTaskId);
    const isCurrentTaskStale = !activeTask || activeTask.completed;

    if (isCurrentTaskStale && tasks.length > 0) {
      const urgentTask = tasks.find((t) => !t.completed && (t.priority === "critical" || t.priority === "high"));
      if (urgentTask) {
        setSelectedTaskId(urgentTask.id);
      } else {
        const anyTask = tasks.find((t) => !t.completed);
        if (anyTask) {
          setSelectedTaskId(anyTask.id);
        } else {
          setSelectedTaskId("");
        }
      }
    }
  }, [tasks, selectedTaskId]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timerMode]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    triggerAlertSound();

    if (timerMode === "focus") {
      alert("🔥 Focus cycle complete! Take a mandatory 5-minute breather to maintain peak cognitive speed.");
      setTimerMode("break");
      setTimeLeft(5 * 60);
    } else {
      alert("⚡ Break complete! Ready for another hyper-focused work interval?");
      setTimerMode("focus");
      setTimeLeft(25 * 60);
    }
  };

  const triggerAlertSound = () => {
    if (isMuted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch (e) {
      console.warn("Audio Context alert failed to play:", e);
    }
  };

  const toggleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(timerMode === "focus" ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-zinc-950/90 border border-white/5 rounded-xl p-5 space-y-5 animate-popup">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <Flame className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="font-display font-black text-white text-xs tracking-widest uppercase">
              FOCUS ENGINE CORE
            </h3>
            <p className="font-mono text-[9px] font-bold text-zinc-500 uppercase tracking-wider mt-0.5">
              Work in ultra-high density block intervals.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-1.5 hover:bg-zinc-900 rounded-md text-zinc-500 hover:text-zinc-300 transition-all"
          title={isMuted ? "Unmute sound alerts" : "Mute focus sound alerts"}
        >
          {isMuted ? <EyeOff className="w-4 h-4 text-zinc-400" /> : <Bell className="w-4 h-4 text-cyan-400" />}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Timer Graphics */}
        <div className="flex flex-col items-center justify-center p-5 bg-zinc-900/20 border border-white/5 rounded-xl relative overflow-hidden">
          {/* Animated pulsing ripple ring */}
          <div
            className={`absolute rounded-full border border-cyan-500/20 transition-all duration-1000 ${
              isRunning ? "w-56 h-56 animate-ping opacity-25" : "w-48 h-48 opacity-0"
            }`}
          />

          <div className="relative z-10 flex flex-col items-center">
            <span className="text-[9px] font-mono font-black uppercase tracking-widest text-zinc-400">
              {timerMode === "focus" ? "DEEP WORK BLOCK" : "RECOVERY WINDOW"}
            </span>

            {/* Huge Clock */}
            <span className="font-mono text-5xl font-black text-white tracking-widest my-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              {formatTime(timeLeft)}
            </span>

            {/* Focus Sub-text */}
            {timerMode === "focus" && isRunning && (
              <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-widest animate-pulse">
                • DEEP FOCUS SYNCHRONIZED •
              </span>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 mt-4 relative z-10">
            <button
              onClick={toggleStartPause}
              className={`px-5 py-2.5 rounded-md text-[10px] font-black font-mono uppercase tracking-widest flex items-center gap-1.5 shadow-md active:scale-95 transition-all duration-300 ${
                isRunning
                  ? "bg-gradient-to-r from-amber-400 to-orange-500 text-black font-black"
                  : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500"
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" /> Pause Block
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Initiate Focus
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              className="p-2.5 bg-zinc-900 border border-white/5 hover:border-white/10 text-zinc-300 hover:text-white rounded-md active:scale-95 transition-all"
              title="Reset Timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Selected Task Breakdown & Context */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest block">
              TARGET DEADLINE TASK:
            </label>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full bg-zinc-900 border border-white/5 text-xs text-zinc-200 p-2.5 rounded-md focus:outline-none font-mono font-bold uppercase tracking-wide"
            >
              <option value="" disabled>Select an active deadline...</option>
              {tasks.filter((t) => !t.completed).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.priority.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {activeTask ? (
            <div className="space-y-2.5">
              <div className="p-4 bg-zinc-900/50 rounded-lg border border-white/5">
                <p className="text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest">ACTIVE BLOCK ACTION STEP:</p>
                {activeIncompleteSubtasks.length > 0 ? (
                  <div className="flex items-start justify-between gap-3 mt-2">
                    <p className="text-xs text-zinc-200 font-sans font-bold leading-snug">
                      {activeIncompleteSubtasks[0].title}
                    </p>
                    <button
                      onClick={() => onCompleteSubtask(activeTask.id, activeIncompleteSubtasks[0].id)}
                      className="text-[9px] font-mono font-black uppercase tracking-wider text-black bg-white hover:bg-zinc-200 px-2.5 py-1.5 rounded-md flex-shrink-0 transition-all duration-200 hover:scale-105"
                    >
                      Complete Step
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 font-sans mt-1.5 italic">
                    No active action steps. Add checklists or mark this task completed!
                  </p>
                )}
              </div>

              {/* Survival Tip */}
              <div className="p-3 bg-zinc-900/20 rounded-lg border border-white/5 flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] font-sans text-zinc-400 leading-relaxed uppercase tracking-wide font-medium">
                  Focus purely on the current step. Close notifications, mute logs, and let adrenaline power your typing. You have this.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 border border-dashed border-white/10 rounded-lg bg-zinc-950/40">
              <p className="text-zinc-600 text-xs font-mono uppercase tracking-wider">No active target task in workstation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
