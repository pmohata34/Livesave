import React, { useState, useEffect } from "react";
import { AlertCircle, Calendar, Zap, Compass, Activity, Brain, ShieldAlert, Sparkles, LogOut, User as UserIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Task, Habit, Recommendation, CalendarEvent } from "./types";
import {
  INITIAL_TASKS,
  INITIAL_HABITS,
  INITIAL_RECOMMENDATIONS,
  calculateLocalUrgency,
} from "./utils";

// Import custom components
import CommandCenter from "./components/CommandCenter";
import TaskBoard from "./components/TaskBoard";
import CalendarPlanner from "./components/CalendarPlanner";
import HabitTracker from "./components/HabitTracker";
import FocusTimer from "./components/FocusTimer";
import RecommendationCard from "./components/RecommendationCard";
import AuthScreen from "./components/AuthScreen";

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(() => {
    const saved = localStorage.getItem("lifesave_current_user");
    return saved ? JSON.parse(saved) : null;
  });

  // Persistence state loaders
  const [tasks, setTasks] = useState<Task[]>(() => {
    const userSaved = localStorage.getItem("lifesave_current_user");
    const user = userSaved ? JSON.parse(userSaved) : null;
    if (user) {
      const saved = localStorage.getItem(`lifesave_tasks_${user.email}`);
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    }
    return [];
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    const userSaved = localStorage.getItem("lifesave_current_user");
    const user = userSaved ? JSON.parse(userSaved) : null;
    if (user) {
      const saved = localStorage.getItem(`lifesave_habits_${user.email}`);
      return saved ? JSON.parse(saved) : INITIAL_HABITS;
    }
    return [];
  });

  const [recommendations, setRecommendations] = useState<Recommendation[]>(() => {
    const userSaved = localStorage.getItem("lifesave_current_user");
    const user = userSaved ? JSON.parse(userSaved) : null;
    if (user) {
      const saved = localStorage.getItem(`lifesave_recs_${user.email}`);
      return saved ? JSON.parse(saved) : INITIAL_RECOMMENDATIONS;
    }
    return [];
  });

  const [scheduleEvents, setScheduleEvents] = useState<CalendarEvent[]>(() => {
    const userSaved = localStorage.getItem("lifesave_current_user");
    const user = userSaved ? JSON.parse(userSaved) : null;
    if (user) {
      const saved = localStorage.getItem(`lifesave_schedule_${user.email}`);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [scheduleReasoning, setScheduleReasoning] = useState<string>(() => {
    const userSaved = localStorage.getItem("lifesave_current_user");
    const user = userSaved ? JSON.parse(userSaved) : null;
    if (user) {
      return localStorage.getItem(`lifesave_reasoning_${user.email}`) || "";
    }
    return "";
  });

  const [activeTab, setActiveTab] = useState<"radar" | "planner" | "habits">("radar");
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);

  // Load user data on login/switch
  useEffect(() => {
    if (currentUser) {
      const email = currentUser.email;
      const savedTasks = localStorage.getItem(`lifesave_tasks_${email}`);
      const savedHabits = localStorage.getItem(`lifesave_habits_${email}`);
      const savedRecs = localStorage.getItem(`lifesave_recs_${email}`);
      const savedSchedule = localStorage.getItem(`lifesave_schedule_${email}`);
      const savedReasoning = localStorage.getItem(`lifesave_reasoning_${email}`);

      setTasks(savedTasks ? JSON.parse(savedTasks) : INITIAL_TASKS);
      setHabits(savedHabits ? JSON.parse(savedHabits) : INITIAL_HABITS);
      setRecommendations(savedRecs ? JSON.parse(savedRecs) : INITIAL_RECOMMENDATIONS);
      setScheduleEvents(savedSchedule ? JSON.parse(savedSchedule) : []);
      setScheduleReasoning(savedReasoning || "");
    } else {
      setTasks([]);
      setHabits([]);
      setRecommendations([]);
      setScheduleEvents([]);
      setScheduleReasoning("");
    }
  }, [currentUser]);

  // Sync to localstorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`lifesave_tasks_${currentUser.email}`, JSON.stringify(tasks));
    }
  }, [tasks, currentUser]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`lifesave_habits_${currentUser.email}`, JSON.stringify(habits));
    }
  }, [habits, currentUser]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`lifesave_recs_${currentUser.email}`, JSON.stringify(recommendations));
    }
  }, [recommendations, currentUser]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`lifesave_schedule_${currentUser.email}`, JSON.stringify(scheduleEvents));
    }
  }, [scheduleEvents, currentUser]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`lifesave_reasoning_${currentUser.email}`, scheduleReasoning);
    }
  }, [scheduleReasoning, currentUser]);

  // Clock Tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Task Mutators
  const handleAddTask = (task: Task | Partial<Task>) => {
    const finalTask: Task = {
      id: task.id || `task_${Date.now()}`,
      title: task.title || "Untitled Task",
      description: task.description || "",
      deadline: task.deadline || new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      priority: task.priority || "high",
      category: task.category || "other",
      completed: !!task.completed,
      subtasks: task.subtasks || [],
      estimatedDuration: task.estimatedDuration || 60,
      scheduledStart: task.scheduledStart || null,
      urgencyScore: task.urgencyScore || 50,
      contextAlert: task.contextAlert || "New task added. Trigger AI Prioritization to map contextual warnings."
    };

    setTasks((prev) => [finalTask, ...prev]);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    // Synchronize schedule events in case of metadata changes
    setScheduleEvents((prev) =>
      prev.map((ev) => {
        if (ev.taskId === updatedTask.id) {
          return {
            ...ev,
            title: `Work: ${updatedTask.title}`,
            category: updatedTask.category,
          };
        }
        return ev;
      })
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    // Clear any calendar event bound to this task
    setScheduleEvents((prev) => prev.filter((ev) => ev.taskId !== taskId));
  };

  // Habit Mutators
  const handleToggleHabit = (id: string) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          const completedToday = !h.completedToday;
          let streak = h.streak;
          if (completedToday) {
            streak += 1;
          } else {
            streak = Math.max(0, streak - 1);
          }
          return {
            ...h,
            completedToday,
            streak,
            lastCompleted: completedToday ? todayStr : h.lastCompleted,
          };
        }
        return h;
      })
    );
  };

  const handleAddHabit = (title: string, frequency: "daily" | "weekly") => {
    const newHabit: Habit = {
      id: `habit_${Date.now()}`,
      title,
      frequency,
      streak: 0,
      lastCompleted: null,
      completedToday: false,
      aiRecommendation: "A custom preventative routine built to protect your future work limits."
    };
    setHabits((prev) => [...prev, newHabit]);
  };

  // Focus Complete callback (from Pomodoro)
  const handleCompleteSubtask = (taskId: string, subtaskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updatedSubtasks = task.subtasks.map((s) => (s.id === subtaskId ? { ...s, completed: true } : s));
    const remainingDuration = updatedSubtasks.filter((s) => !s.completed).reduce((acc, curr) => acc + curr.duration, 0);
    const localUrgency = calculateLocalUrgency(task.deadline, remainingDuration || 5);

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: updatedSubtasks,
              estimatedDuration: remainingDuration,
              urgencyScore: localUrgency.score,
              priority: localUrgency.priority,
            }
          : t
      )
    );
  };

  // AI Orchestration: Run server-side Prioritization and Alert Generation
  const handleAnalyzePriorities = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/ai/analyze-and-prioritize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: tasks.filter((t) => !t.completed),
          habits: habits,
          currentDateTime: currentTime.toISOString(),
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Update tasks priority, urgency scores, alerts and new subtasks
        const updatedTasks = tasks.map((t) => {
          // Find if there's AI calculated priority
          const matchPriority = data.priorities?.find((p: any) => p.taskId === t.id);
          const matchNewSubtasks = data.newSubtasks?.find((s: any) => s.taskId === t.id);

          return {
            ...t,
            priority: matchPriority ? matchPriority.priority : t.priority,
            urgencyScore: matchPriority ? matchPriority.urgencyScore : t.urgencyScore,
            contextAlert: matchPriority ? matchPriority.contextAlert : t.contextAlert,
            subtasks: matchNewSubtasks && t.subtasks.length === 0 ? matchNewSubtasks.subtasks : t.subtasks,
          };
        });

        setTasks(updatedTasks);

        if (data.recommendations) {
          setRecommendations(data.recommendations);
        }
      }
    } catch (err) {
      console.error("AI Prioritization failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // AI Orchestration: Run server-side scheduling helper
  const handleAutoSchedule = async () => {
    setIsScheduling(true);
    try {
      const response = await fetch("/api/ai/schedule-assistance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: tasks.filter((t) => !t.completed),
          currentDateTime: currentTime.toISOString(),
        }),
      });

      const data = await response.json();
      if (data.success && data.events) {
        setScheduleEvents(data.events);
        setScheduleReasoning(data.reasoning || "");
      }
    } catch (err) {
      console.error("AI Scheduling failed:", err);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleClearSchedule = () => {
    setScheduleEvents([]);
    setScheduleReasoning("");
  };

  // Callback to act on recommendation items
  const handleActionTrigger = (rec: Recommendation) => {
    if (rec.associatedTaskId) {
      // Switch active tab to radar to highlight task
      setActiveTab("radar");
      // Scroll task card into view
      setTimeout(() => {
        const el = document.getElementById(`task-card-${rec.associatedTaskId}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.classList.add("ring-2", "ring-emerald-400");
        setTimeout(() => el?.classList.remove("ring-2", "ring-emerald-400"), 3000);
      }, 300);
    } else {
      // Standard recommendation is Focus Timer launching
      const timerSection = document.getElementById("focus-timer-section");
      timerSection?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Handle callback additions from Voice Command
  const handleVoiceAddTask = (taskData: Partial<Task>) => {
    handleAddTask(taskData);
  };

  const handleVoiceBreakdownTask = (taskId: string, subtasks: any[]) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId || t.title.toLowerCase().includes(taskId.toLowerCase())) {
          return {
            ...t,
            subtasks: subtasks.map((s, idx) => ({
              id: `sub_${Date.now()}_${idx}`,
              title: s.title,
              duration: s.duration,
              completed: false,
              actionItem: s.actionItem,
            })),
            estimatedDuration: subtasks.reduce((sum, s) => sum + s.duration, 0),
          };
        }
        return t;
      })
    );
  };

  const handleVoiceCompleteTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId || t.title.toLowerCase().includes(taskId.toLowerCase())) {
          return {
            ...t,
            completed: true,
            urgencyScore: 0,
            subtasks: t.subtasks.map((s) => ({ ...s, completed: true })),
          };
        }
        return t;
      })
    );
  };

  if (!currentUser) {
    return (
      <AuthScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          localStorage.setItem("lifesave_current_user", JSON.stringify(user));
        }}
      />
    );
  }

  const incompleteCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="min-h-screen bg-[#030303] text-white flex flex-col font-sans select-none antialiased relative overflow-hidden">
      {/* Premium Slithering Ambient Glow */}
      <div className="ambient-slither-bg" />

      {/* Top Header Grid */}
      <header className="border-b border-white/5 bg-[#030303]/85 backdrop-blur-md px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          {/* Revolving Dynamic Aura Ring */}
          <div className="relative w-6 h-6 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 via-blue-500 to-violet-600 rounded-full animate-revolve opacity-60 blur-[2px]" />
            <div className="absolute w-[18px] h-[18px] bg-[#030303] rounded-full flex items-center justify-center">
              <span className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" />
            </div>
          </div>
          <div>
            <h1 className="text-base font-black tracking-wider text-white font-title uppercase bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              LifeSave AI // Nexus
            </h1>
            <p className="text-[9px] text-cyan-400 font-mono font-bold tracking-widest uppercase mt-0.5">
              THE LAST-MINUTE CRISIS SHIELD
            </p>
          </div>
        </div>

        {/* Real-Time UTC Clock & Status Matrix */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 justify-end">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] font-mono font-bold text-zinc-500 block tracking-widest uppercase">
              {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <span className="text-sm font-mono text-white font-bold tracking-wider">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-900/80 border border-white/5 px-3 py-1.5 rounded-lg">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${incompleteCount > 0 ? "bg-amber-400" : "bg-cyan-400"}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${incompleteCount > 0 ? "bg-amber-500" : "bg-cyan-500"}`} />
            </span>
            <span className="font-mono text-[9px] text-zinc-300 font-black uppercase tracking-widest">
              {incompleteCount} CRITICAL TASKS
            </span>
          </div>

          {/* User Profile Badge & Logout */}
          <div className="flex items-center gap-3 bg-zinc-900/80 border border-white/5 pl-3 pr-1.5 py-1.5 rounded-lg">
            <div className="flex items-center gap-2">
              <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
              <div className="text-left">
                <span className="text-[8px] font-mono text-zinc-500 block leading-none uppercase tracking-widest">PILOT</span>
                <span className="text-[10px] font-mono font-black text-white block leading-none uppercase tracking-wide max-w-[80px] truncate" title={currentUser.name}>
                  {currentUser.name}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setCurrentUser(null);
                localStorage.removeItem("lifesave_current_user");
              }}
              className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
              title="Sign Out Access"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10 animate-popup">
        
        {/* Left Sideboard Column (Control Matrix) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          
          {/* AI Companion Voice interface */}
          <CommandCenter
            tasks={tasks}
            onAddTask={handleVoiceAddTask}
            onBreakdownTask={handleVoiceBreakdownTask}
            onCompleteTask={handleVoiceCompleteTask}
            onRefreshPriorities={handleAnalyzePriorities}
          />

          {/* Pomodoro Focus block */}
          <div id="focus-timer-section">
            <FocusTimer
              tasks={tasks}
              onCompleteSubtask={handleCompleteSubtask}
            />
          </div>
        </div>

        {/* Right Cockpit Column (Dashboard & Tabs views) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Navigation Tab bar */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-md border border-white/5 justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setActiveTab("radar")}
                className={`px-4 py-2 rounded-sm text-[9px] font-mono font-black uppercase tracking-widest flex items-center gap-2 transition-all duration-300 ${
                  activeTab === "radar"
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white border border-cyan-400/20 shadow-sm"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Radar Matrix</span>
              </button>

              <button
                onClick={() => setActiveTab("planner")}
                className={`px-4 py-2 rounded-sm text-[9px] font-mono font-black uppercase tracking-widest flex items-center gap-2 transition-all duration-300 ${
                  activeTab === "planner"
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white border border-cyan-400/20 shadow-sm"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>AI Planner</span>
              </button>

              <button
                onClick={() => setActiveTab("habits")}
                className={`px-4 py-2 rounded-sm text-[9px] font-mono font-black uppercase tracking-widest flex items-center gap-2 transition-all duration-300 ${
                  activeTab === "habits"
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white border border-cyan-400/20 shadow-sm"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Prevention Habits</span>
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 text-[9px] font-mono font-black text-cyan-400 bg-cyan-950/20 border border-cyan-500/25 px-3 py-1.5 rounded mr-0.5 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>COGNITIVE CORE STABLE</span>
            </div>
          </div>

          {/* Core Tab Render */}
          <div className="min-h-[400px]">
            <AnimatePresence mode="wait">
              {activeTab === "radar" && (
                <motion.div
                  key="radar"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <TaskBoard
                    tasks={tasks}
                    onAddTask={handleAddTask}
                    onUpdateTask={handleUpdateTask}
                    onDeleteTask={handleDeleteTask}
                    onAnalyzePriorities={handleAnalyzePriorities}
                    isAnalyzing={isAnalyzing}
                  />
                </motion.div>
              )}

              {activeTab === "planner" && (
                <motion.div
                  key="planner"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <CalendarPlanner
                    tasks={tasks}
                    scheduleEvents={scheduleEvents}
                    scheduleReasoning={scheduleReasoning}
                    onAutoSchedule={handleAutoSchedule}
                    onClearSchedule={handleClearSchedule}
                    isScheduling={isScheduling}
                  />
                </motion.div>
              )}

              {activeTab === "habits" && (
                <motion.div
                  key="habits"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <HabitTracker
                    habits={habits}
                    onToggleHabit={handleToggleHabit}
                    onAddHabit={handleAddHabit}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* AI Coach recommendation board */}
          <div className="border-t border-white/10 pt-6">
            <RecommendationCard
              recommendations={recommendations.filter(
                (rec) => !rec.associatedTaskId || tasks.some((t) => t.id === rec.associatedTaskId && !t.completed)
              )}
              onActionTrigger={handleActionTrigger}
            />
          </div>
        </div>
      </main>

      {/* Footer system details */}
      <footer className="border-t border-white/5 bg-[#030303] py-5 px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-500 relative z-10">
        <div>NEXUS SYSTEM ROOT: ONLINE</div>
        <div className="flex gap-6">
          <span>COGNITIVE FLOW CO-LOGS: SECURE</span>
          <span className="text-cyan-400 font-black">NEXUS SYNC ACTIVE</span>
          <span className="text-white">v3.0-Winning</span>
        </div>
      </footer>
    </div>
  );
}
