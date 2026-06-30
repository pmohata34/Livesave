import React, { useState } from "react";
import { CalendarRange, Sparkles, Clock, AlertCircle, Info, Trash2 } from "lucide-react";
import { Task, CalendarEvent } from "../types";

interface CalendarPlannerProps {
  tasks: Task[];
  scheduleEvents: CalendarEvent[];
  scheduleReasoning: string;
  onAutoSchedule: () => void;
  onClearSchedule: () => void;
  isScheduling: boolean;
}

export default function CalendarPlanner({
  tasks,
  scheduleEvents,
  scheduleReasoning,
  onAutoSchedule,
  onClearSchedule,
  isScheduling,
}: CalendarPlannerProps) {
  const [selectedDay, setSelectedDay] = useState<"today" | "tomorrow">("today");

  const getDayDates = () => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    return {
      today: today.toDateString(),
      tomorrow: tomorrow.toDateString()
    };
  };

  const dates = getDayDates();

  const filterEventsByDay = (day: "today" | "tomorrow") => {
    const todayStr = new Date().toDateString();
    const tomorrowStr = new Date();
    tomorrowStr.setDate(new Date().getDate() + 1);
    const tomorrowString = tomorrowStr.toDateString();

    return scheduleEvents.filter((ev) => {
      if (ev.taskId) {
        const associatedTask = tasks.find((t) => t.id === ev.taskId);
        if (associatedTask && associatedTask.completed) {
          return false;
        }
      }
      const evDayStr = new Date(ev.start).toDateString();
      if (day === "today") return evDayStr === todayStr;
      return evDayStr === tomorrowString;
    });
  };

  const dayEvents = filterEventsByDay(selectedDay).sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  const getEventCategoryStyle = (cat: string) => {
    switch (cat) {
      case "buffer":
        return "bg-zinc-900/20 border-white/5 text-zinc-400";
      case "routine":
        return "bg-zinc-900 border-white/5 text-zinc-300";
      case "bill":
        return "bg-orange-500/5 border-orange-500/15 text-orange-400";
      case "assignment":
        return "bg-cyan-500/5 border-cyan-500/10 text-cyan-300";
      case "interview":
        return "bg-amber-500/5 border-amber-500/15 text-amber-400";
      default:
        return "bg-[#030303] border border-white/5 text-white";
    }
  };

  const formatHourString = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-zinc-950/90 border border-white/5 rounded-xl p-5 space-y-5 animate-popup">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <CalendarRange className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="font-display font-black text-white text-xs tracking-widest uppercase">
              AI OPTIMIZED PLANNER
            </h3>
            <p className="font-mono text-[9px] font-bold text-zinc-500 uppercase tracking-wider mt-0.5">
              Calculates task distributions with sanity buffer buffers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {scheduleEvents.length > 0 && (
            <button
              onClick={onClearSchedule}
              className="p-1.5 bg-zinc-900 hover:bg-red-950/20 rounded-md text-zinc-500 hover:text-red-400 border border-white/5 hover:border-red-500/20 transition-all text-[9px] font-mono font-black uppercase tracking-widest flex items-center gap-1.5"
              title="Clear calendar schedule"
            >
              <Trash2 className="w-3.5 h-3.5" /> CLEAR
            </button>
          )}

          <button
            onClick={onAutoSchedule}
            disabled={isScheduling || tasks.length === 0}
            className={`px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[9px] font-mono font-black uppercase tracking-widest rounded-md flex items-center gap-1.5 transition-all hover:from-cyan-400 hover:to-blue-500 active:scale-95 ${
              tasks.length === 0 
                ? "opacity-40 cursor-not-allowed" 
                : "cursor-pointer"
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isScheduling ? "animate-spin" : ""}`} />
            {isScheduling ? "CALCULATING BLOCKS..." : "AI AUTO-SCHEDULE"}
          </button>
        </div>
      </div>

      {/* Days Tabs switcher */}
      <div className="flex items-center gap-1.5 bg-[#030303] p-1 rounded-md w-fit border border-white/5">
        <button
          onClick={() => setSelectedDay("today")}
          className={`px-4 py-1.5 rounded-sm text-[9px] font-mono font-black uppercase tracking-wider transition-all duration-200 ${
            selectedDay === "today"
              ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
              : "text-zinc-500 hover:text-white"
          }`}
        >
          Today ({dates.today.split(' ').slice(0, 3).join(' ')})
        </button>
        <button
          onClick={() => setSelectedDay("tomorrow")}
          className={`px-4 py-1.5 rounded-sm text-[9px] font-mono font-black uppercase tracking-wider transition-all duration-200 ${
            selectedDay === "tomorrow"
              ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
              : "text-zinc-500 hover:text-white"
          }`}
        >
          Tomorrow ({dates.tomorrow.split(' ').slice(0, 3).join(' ')})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline representation */}
        <div className="lg:col-span-2 space-y-3">
          {dayEvents.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-white/5 rounded-lg bg-[#030303]/30 p-6 flex flex-col items-center justify-center space-y-4">
              <div className="relative w-full max-w-xs aspect-[21/9] rounded-md overflow-hidden border border-white/5 opacity-40">
                <img 
                  src="https://picsum.photos/seed/cyberclock/400/170" 
                  alt="Sleek Clock System" 
                  className="w-full h-full object-cover filter brightness-50 contrast-125 saturate-50"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#030303]/80" />
              </div>
              <div>
                <p className="text-zinc-400 text-xs font-mono uppercase tracking-wider">No tasks scheduled for {selectedDay}.</p>
                <p className="text-zinc-500 text-[9px] font-mono uppercase tracking-widest mt-1.5">
                  {tasks.length > 0 
                    ? "Click 'AI AUTO-SCHEDULE' to generate stress-free block timelines!" 
                    : "Add some deadlined tasks first so Gemini can schedule buffers."}
                </p>
              </div>
            </div>
          ) : (
            <div className="relative border-l border-zinc-800 pl-4 space-y-3.5 ml-2">
              {dayEvents.map((ev) => {
                const style = getEventCategoryStyle(ev.category);
                return (
                  <div key={ev.id} className="relative group">
                    {/* Event node */}
                    <div className="absolute -left-[21.5px] top-4 w-2 h-2 rounded-full bg-zinc-800 group-hover:bg-cyan-400 border border-zinc-950 transition-all" />
                    
                    <div className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${style} transition-all`}>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono font-black uppercase tracking-widest bg-black/40 px-1.5 py-0.5 rounded border border-white/5">
                            {ev.category === "buffer" ? "buffer" : ev.category === "routine" ? "routine" : ev.category}
                          </span>
                          <h4 className="text-xs font-bold font-mono uppercase tracking-wide">{ev.title}</h4>
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-1.5 mt-1">
                          <Clock className="w-3.5 h-3.5 text-zinc-600" />
                          {formatHourString(ev.start)} - {formatHourString(ev.end)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* AI Scheduler explanation section */}
        <div className="space-y-4 bg-zinc-900/20 border border-white/5 p-4 rounded-lg">
          <h4 className="text-xs font-display font-black text-white uppercase tracking-widest flex items-center gap-1.5">
            <Info className="w-4 h-4 text-cyan-400" />
            AI SCHEDULING STRATEGY
          </h4>
          
          {scheduleReasoning ? (
            <div className="space-y-4">
              <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                {scheduleReasoning}
              </p>
              <div className="p-3.5 bg-cyan-500/5 border border-cyan-500/10 rounded-lg">
                <p className="text-[9px] font-mono font-black text-cyan-400 uppercase tracking-widest mb-1">
                  Tactical Survival Rule Loaded:
                </p>
                <p className="text-[10px] text-zinc-400 font-sans leading-relaxed uppercase tracking-wider">
                  Never work for more than 90 minutes without a 10-minute mental buffer. It keeps cognitive decay under 5%.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5 text-zinc-500 text-[10px] font-mono uppercase tracking-widest">
              <p className="text-zinc-400">AI instructions activated upon running optimizer:</p>
              <ul className="list-disc pl-4 space-y-1.5">
                <li>Assess cognitive fatigue levels</li>
                <li>Group quick tasks (like payments) together</li>
                <li>Avoid sleep conflict blocks</li>
                <li>Insert mandatory routine hydration windows</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
