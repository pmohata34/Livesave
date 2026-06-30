import React, { useState } from "react";
import { AlertTriangle, Clock, Plus, Trash2, CheckCircle2, ChevronDown, ChevronUp, Sparkles, Filter, CheckSquare, RefreshCw } from "lucide-react";
import { Task, TaskCategory, TaskPriority } from "../types";
import { formatDuration, calculateLocalUrgency } from "../utils";

interface TaskBoardProps {
  tasks: Task[];
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onAnalyzePriorities: () => void;
  isAnalyzing: boolean;
}

export default function TaskBoard({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onAnalyzePriorities,
  isAnalyzing,
}: TaskBoardProps) {
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  // Form states
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [newDuration, setNewDuration] = useState("60");
  const [newCategory, setNewCategory] = useState<TaskCategory>("assignment");

  const toggleExpand = (id: string) => {
    setExpandedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDeadline) return;

    const localUrgency = calculateLocalUrgency(newDeadline, parseInt(newDuration));

    const task: Task = {
      id: `task_${Date.now()}`,
      title: newTitle,
      description: newDesc,
      deadline: newDeadline,
      priority: localUrgency.priority,
      category: newCategory,
      completed: false,
      subtasks: [],
      estimatedDuration: parseInt(newDuration),
      scheduledStart: null,
      urgencyScore: localUrgency.score,
      contextAlert: `Task created. Run AI Prioritization to get context-aware alerts and optimized subtask planning.`
    };

    onAddTask(task);
    // Reset Form
    setNewTitle("");
    setNewDesc("");
    setNewDeadline("");
    setNewDuration("60");
    setNewCategory("assignment");
    setShowAddForm(false);
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updatedSubtasks = task.subtasks.map((sub) => {
      if (sub.id === subtaskId) {
        return { ...sub, completed: !sub.completed };
      }
      return sub;
    });

    // Re-calculate estimated duration based on remaining non-completed subtasks
    const remainingDuration = updatedSubtasks
      .filter((s) => !s.completed)
      .reduce((acc, curr) => acc + curr.duration, 0);

    const localUrgency = calculateLocalUrgency(task.deadline, remainingDuration || 5);

    onUpdateTask({
      ...task,
      subtasks: updatedSubtasks,
      estimatedDuration: remainingDuration,
      urgencyScore: localUrgency.score,
      priority: localUrgency.priority
    });
  };

  const handleCompleteTask = (task: Task) => {
    const nextCompleted = !task.completed;
    onUpdateTask({
      ...task,
      completed: nextCompleted,
      urgencyScore: nextCompleted ? 0 : calculateLocalUrgency(task.deadline, task.estimatedDuration).score,
      subtasks: nextCompleted 
        ? task.subtasks.map((s) => ({ ...s, completed: true })) 
        : task.subtasks
    });
  };

  const getUrgencyColor = (score: number) => {
    if (score >= 90) return { border: "border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.1)]", text: "text-orange-400", bg: "bg-orange-500/5", progress: "bg-gradient-to-r from-orange-500 to-rose-500" };
    if (score >= 75) return { border: "border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.05)]", text: "text-amber-400", bg: "bg-amber-500/5", progress: "bg-gradient-to-r from-amber-500 to-orange-500" };
    if (score >= 50) return { border: "border-cyan-500/20", text: "text-cyan-400", bg: "bg-cyan-500/5", progress: "bg-gradient-to-r from-cyan-500 to-blue-500" };
    return { border: "border-white/5", text: "text-zinc-400", bg: "bg-zinc-900/20", progress: "bg-zinc-700" };
  };

  const getTimeRemainingStr = (deadlineStr: string) => {
    const diff = new Date(deadlineStr).getTime() - new Date().getTime();
    if (diff <= 0) return "Overdue";
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h remaining`;
    if (hours > 0) return `${hours}h ${minutes % 60}m remaining`;
    return `${minutes}m remaining`;
  };

  const sortedTasks = [...tasks]
    .filter((t) => !t.completed && (filterCategory === "all" || t.category === filterCategory))
    .sort((a, b) => {
      return b.urgencyScore - a.urgencyScore; // highest urgency first
    });

  // Calculate Average Crisis Index
  const incompleteTasks = tasks.filter((t) => !t.completed);
  const crisisAlertIndex = incompleteTasks.length > 0 
    ? Math.round(incompleteTasks.reduce((acc, curr) => acc + curr.urgencyScore, 0) / incompleteTasks.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Crisis Meter Section */}
      <div className="bg-zinc-950/90 border border-white/5 p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-popup">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="font-display font-black text-white text-xs tracking-widest uppercase">
              CRISIS ALERT INDEX
            </h3>
            <span className={`px-2.5 py-1 rounded font-mono text-[9px] font-black uppercase tracking-widest border ${
              crisisAlertIndex >= 80 
                ? "bg-orange-500/10 text-orange-400 border-orange-500/20 animate-pulse" 
                : crisisAlertIndex >= 50
                  ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                  : "bg-zinc-900 text-zinc-400 border-white/5"
            }`}>
              {crisisAlertIndex >= 80 ? "CRITICAL PRESSURE" : crisisAlertIndex >= 50 ? "MODERATE RISK" : "STABLE STATE"}
            </span>
          </div>
          <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-wide mt-1.5 leading-relaxed">
            Dynamic stress metric computed from imminent deadlines and remaining workload volume.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="w-full md:w-48 bg-[#030303] h-3.5 rounded-full overflow-hidden border border-white/5 p-0.5">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                crisisAlertIndex >= 80 ? "bg-gradient-to-r from-orange-500 to-rose-500" : crisisAlertIndex >= 50 ? "bg-gradient-to-r from-cyan-400 to-blue-500" : "bg-zinc-600"
              }`}
              style={{ width: `${crisisAlertIndex}%` }}
            />
          </div>
          <div className="text-right">
            <span className={`font-mono text-3xl font-black tracking-widest ${
              crisisAlertIndex >= 80 ? "text-orange-400" : crisisAlertIndex >= 50 ? "text-cyan-400" : "text-white"
            }`}>
              {crisisAlertIndex}%
            </span>
          </div>
        </div>
      </div>

      {/* Control Actions & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950/40 p-3 rounded-lg border border-white/5">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilterCategory("all")}
            className={`px-3 py-1.5 rounded-md text-[9px] font-mono font-black uppercase tracking-wider border transition-all duration-200 ${
              filterCategory === "all"
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-transparent"
                : "bg-zinc-900/60 text-zinc-400 border-white/5 hover:text-white"
            }`}
          >
            ALL ({tasks.filter((t) => !t.completed).length})
          </button>
          {(["assignment", "meeting", "bill", "interview", "commitment"] as TaskCategory[]).map((cat) => {
            const count = tasks.filter((t) => t.category === cat && !t.completed).length;
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-md text-[9px] font-mono font-black uppercase tracking-wider border transition-all duration-200 ${
                  filterCategory === cat
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-transparent"
                    : "bg-zinc-900/60 text-zinc-400 border-white/5 hover:text-white"
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={onAnalyzePriorities}
            disabled={isAnalyzing}
            className="px-3.5 py-1.5 bg-zinc-900 border border-white/5 hover:border-cyan-500/20 text-[9px] font-mono font-black uppercase tracking-widest text-cyan-400 hover:text-cyan-300 rounded-md flex items-center gap-1.5 active:scale-95 transition-all duration-300"
            title="Recalculate deadlines, formulate subtask breakdowns, and generate alerts"
          >
            <RefreshCw className={`w-3 h-3 ${isAnalyzing ? "animate-spin text-cyan-400" : ""}`} />
            {isAnalyzing ? "RE-CALCULATING..." : "AI PRIORITIZE"}
          </button>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3.5 py-1.5 bg-white hover:bg-zinc-200 text-black text-[9px] font-mono font-black uppercase tracking-widest rounded-md flex items-center gap-1 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> ADD TASK
          </button>
        </div>
      </div>

      {/* Manual Task Creator Form */}
      {showAddForm && (
        <form onSubmit={handleCreateTask} className="bg-zinc-950/90 border border-white/5 p-5 rounded-xl space-y-4 animate-popup">
          <h4 className="text-xs font-display font-black text-white uppercase tracking-widest bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">ADD EMERGENCY DEADLINE</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest">Task Title</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Final Calculus Solutions Scanning"
                className="w-full bg-[#030303] border border-white/5 text-xs text-white p-2.5 rounded-md focus:outline-none focus:border-cyan-500/30 font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest">Deadline (Date & Time)</label>
              <input
                type="datetime-local"
                required
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                className="w-full bg-[#030303] border border-white/5 text-xs text-white p-2.5 rounded-md focus:outline-none focus:border-cyan-500/30 font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as TaskCategory)}
                className="w-full bg-[#030303] border border-white/5 text-xs text-white p-2.5 rounded-md focus:outline-none focus:border-cyan-500/30 font-mono font-bold uppercase tracking-wide"
              >
                <option value="assignment">Assignment / Study</option>
                <option value="meeting">Meeting / Call</option>
                <option value="bill">Overdue Bill Payment</option>
                <option value="interview">Interview prep / Stage</option>
                <option value="commitment">Other commitment</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest">Estimated Work (Minutes)</label>
              <input
                type="number"
                required
                min="5"
                max="600"
                value={newDuration}
                onChange={(e) => setNewDuration(e.target.value)}
                className="w-full bg-[#030303] border border-white/5 text-xs text-white p-2.5 rounded-md focus:outline-none focus:border-cyan-500/30 font-mono"
              />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest">Description / Special context</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Details of the blocker, required files, web links, or checklist specifics..."
                className="w-full bg-[#030303] border border-white/5 text-xs text-white p-2.5 rounded-md focus:outline-none focus:border-cyan-500/30 h-20 resize-none font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-zinc-500 hover:text-zinc-300 text-xs font-mono font-black uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-white text-black font-mono font-black uppercase tracking-widest rounded-md text-xs hover:bg-zinc-200"
            >
              Add and Calculate Priority
            </button>
          </div>
        </form>
      )}

      {/* Task List Render */}
      <div className="space-y-6">
        {sortedTasks.length === 0 ? (
          <div className="text-center py-12 bg-zinc-950/20 border border-white/5 rounded-xl flex flex-col items-center justify-center p-6 space-y-4">
            <div className="relative w-full max-w-sm aspect-[16/9] rounded-lg overflow-hidden border border-white/5 shadow-inner">
              <img 
                src="https://picsum.photos/seed/cybergrid/640/360" 
                alt="Tactical Grid Complete" 
                className="w-full h-full object-cover opacity-60 filter brightness-75 contrast-125 saturate-50"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-cyan-400/80 animate-pulse drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]" />
              </div>
            </div>
            <div>
              <p className="text-cyan-400 text-xs font-mono uppercase tracking-widest font-black">SYSTEM STATUS: FULLY CLEAR</p>
              <p className="text-zinc-500 text-[9px] font-mono uppercase tracking-widest mt-1.5">Excellent! You are completely clear of last-minute pressure.</p>
            </div>
          </div>
        ) : (
          (() => {
            const targetTask = sortedTasks[0];
            const remainingTasks = sortedTasks.slice(1);
            
            const targetUrgency = getUrgencyColor(targetTask.urgencyScore);
            const targetHasSubtasks = targetTask.subtasks && targetTask.subtasks.length > 0;
            const targetCompletedSubtasks = targetTask.subtasks ? targetTask.subtasks.filter((s) => s.completed).length : 0;
            const targetTotalSubtasks = targetTask.subtasks ? targetTask.subtasks.length : 0;

            return (
              <div className="space-y-8">
                {/* 1. TARGET DEADLINE TASK (THE MOST CRITICAL BLOCKER) */}
                <div 
                  id="target-task-hero"
                  className="relative overflow-hidden bg-gradient-to-br from-zinc-950 to-red-950/30 border-2 border-red-500/40 rounded-2xl p-6 md:p-8 shadow-[0_0_30px_rgba(239,68,68,0.18)] animate-popup"
                >
                  {/* Subtle decorative glow */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none animate-pulse" />
                  
                  {/* Target Deadline Badge header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-500/20 pb-4 mb-5">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                      <span className="text-[10px] font-mono font-black uppercase tracking-widest text-red-400 bg-red-950/40 border border-red-500/30 px-3 py-1 rounded">
                        PRIMARY CRISIS TARGET
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-red-400 font-mono text-xs font-black uppercase tracking-widest bg-red-950/20 border border-red-500/20 px-3 py-1 rounded">
                        URGENCY {targetTask.urgencyScore}%
                      </span>
                    </div>
                  </div>

                  {/* High prominence presentation */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-8 space-y-4">
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => handleCompleteTask(targetTask)}
                          className="mt-1 flex-shrink-0 text-zinc-500 hover:text-green-400 transition-all active:scale-90"
                          title="Complete target task"
                        >
                          <CheckCircle2 className="w-8 h-8 text-zinc-600 hover:text-green-400 transition-colors" />
                        </button>
                        
                        <div className="space-y-2">
                          <span className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest bg-zinc-900 border border-white/5 px-2.5 py-1 rounded">
                            {targetTask.category}
                          </span>
                          <h3 className="font-title font-black text-white text-xl sm:text-2xl lg:text-3xl tracking-tight leading-tight uppercase">
                            {targetTask.title}
                          </h3>
                          <p className="font-sans text-sm md:text-base text-zinc-300 leading-relaxed max-w-2xl">
                            {targetTask.description || "No description provided. Utilize custom cognitive subtask engines to map the solutions path."}
                          </p>
                        </div>
                      </div>

                      {/* Remaining Time & Statistics banner */}
                      <div className="flex flex-wrap items-center gap-3.5 pt-2">
                        <span className="flex items-center gap-1.5 text-xs font-mono font-black uppercase tracking-widest text-red-400 bg-red-950/40 px-3 py-1.5 rounded border border-red-500/20 shadow-inner">
                          <Clock className="w-4 h-4 text-red-400" />
                          {getTimeRemainingStr(targetTask.deadline)}
                        </span>
                        <span className="text-xs font-mono font-black text-zinc-400 bg-zinc-900/80 px-3 py-1.5 rounded border border-white/5 uppercase tracking-widest">
                          DURATION: {formatDuration(targetTask.estimatedDuration)}
                        </span>
                        {targetHasSubtasks && (
                          <span className="text-xs font-mono font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1.5 bg-cyan-950/30 px-3 py-1.5 rounded border border-cyan-500/20">
                            <CheckSquare className="w-4 h-4 text-cyan-400" />
                            SUBTASKS: {targetCompletedSubtasks}/{targetTotalSubtasks}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick actions panel */}
                    <div className="lg:col-span-4 bg-black/40 border border-white/5 p-4 rounded-xl space-y-3.5">
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-black">CRISIS MANAGEMENT</span>
                        <button
                          onClick={() => onDeleteTask(targetTask.id)}
                          className="text-zinc-500 hover:text-red-400 text-[10px] font-mono uppercase tracking-widest font-black transition-colors"
                        >
                          DELETE
                        </button>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest text-center">Calculated priority level</div>
                        <div className="text-xs font-mono font-black text-white uppercase tracking-widest bg-red-500/10 border border-red-500/20 py-2 px-2.5 rounded text-center">
                          {targetTask.priority} LEVEL THREAT
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Checklist & Context Warning for Hero Task */}
                  <div className="mt-6 pt-5 border-t border-white/5 space-y-4">
                    {targetTask.contextAlert && (
                      <div className="bg-orange-500/5 border border-orange-500/30 p-4 rounded-xl flex items-start gap-3.5">
                        <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0 animate-bounce" />
                        <div>
                          <p className="text-[10px] font-mono font-black text-orange-400 uppercase tracking-widest">COGNITIVE TACTICAL ALARM</p>
                          <p className="text-sm text-zinc-200 font-sans mt-1 leading-relaxed">{targetTask.contextAlert}</p>
                        </div>
                      </div>
                    )}

                    {/* Subtask checkbox section for Target Task */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400">
                          AUTONOMOUS ROADMAP STEPS
                        </h4>
                        <span className="text-[10px] font-mono font-black uppercase tracking-widest text-cyan-400">
                          {targetCompletedSubtasks}/{targetTotalSubtasks} STEPS CLEAR
                        </span>
                      </div>

                      {targetHasSubtasks ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {targetTask.subtasks.map((sub) => (
                            <div
                              key={sub.id}
                              className={`p-4 rounded-xl border flex items-start justify-between gap-3 transition-all ${
                                sub.completed
                                  ? "bg-zinc-900/10 border-transparent text-zinc-500"
                                  : "bg-zinc-900/80 border-white/5 hover:border-cyan-500/30 text-zinc-200 shadow-sm"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  checked={sub.completed}
                                  onChange={() => handleToggleSubtask(targetTask.id, sub.id)}
                                  className="mt-1 w-4.5 h-4.5 accent-cyan-400 border-white/5 bg-black cursor-pointer rounded"
                                />
                                <div className="text-xs">
                                  <span className={`font-mono text-xs uppercase tracking-wide block ${sub.completed ? "line-through text-zinc-500" : "font-black text-zinc-100"}`}>
                                    {sub.title}
                                  </span>
                                  {sub.actionItem && !sub.completed && (
                                    <p className="text-[10px] text-cyan-400 mt-1.5 font-sans italic leading-tight">
                                      {sub.actionItem}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <span className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest flex-shrink-0">
                                {sub.duration} MIN
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-zinc-900/40 rounded-xl border border-dashed border-white/5">
                          <Sparkles className="w-6 h-6 text-cyan-400 mx-auto mb-2 animate-pulse" />
                          <p className="text-xs font-mono font-black uppercase tracking-widest text-zinc-400">NO SUBTASK ENGINE FLOW REGISTERED</p>
                          <p className="text-[10px] font-mono text-zinc-500 mt-1 uppercase">Run AI Prioritize to build optimized execution sequences.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. REMAINING TASKS (STANDARD PROTOCOLS) */}
                {remainingTasks.length > 0 && (
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                      <span className="text-[10px] font-mono font-black text-cyan-400 uppercase tracking-widest bg-cyan-950/20 border border-cyan-500/20 px-2.5 py-0.5 rounded">
                        QUEUE STATUS: {remainingTasks.length} PENDING
                      </span>
                      <h4 className="font-display font-black text-xs uppercase tracking-widest text-zinc-400">
                        Remaining Task Queue
                      </h4>
                    </div>

                    <div className="space-y-3">
                      {remainingTasks.map((task) => {
                        const urgency = getUrgencyColor(task.urgencyScore);
                        const isExpanded = !!expandedTasks[task.id];
                        const hasSubtasks = task.subtasks && task.subtasks.length > 0;
                        const completedSubtasks = task.subtasks ? task.subtasks.filter((s) => s.completed).length : 0;
                        const totalSubtasks = task.subtasks ? task.subtasks.length : 0;

                        return (
                          <div
                            key={task.id}
                            id={`task-card-${task.id}`}
                            className={`bg-zinc-950/60 border rounded-xl transition-all duration-300 ${
                              task.completed 
                                ? "opacity-50 border-white/5 bg-[#030303]/40" 
                                : `border-white/5 hover:border-zinc-700 hover:bg-zinc-900/20 ${urgency.border}`
                            }`}
                          >
                            <div className="p-4 flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                              <div className="flex items-start gap-3">
                                <button
                                  onClick={() => handleCompleteTask(task)}
                                  className={`mt-1 flex-shrink-0 transition-all ${
                                    task.completed 
                                      ? "text-cyan-400" 
                                      : "text-zinc-600 hover:text-white"
                                  }`}
                                >
                                  <CheckCircle2 className={`w-5 h-5 ${task.completed ? "fill-cyan-950/20" : ""}`} />
                                </button>

                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[9px] font-mono font-black tracking-widest uppercase px-2.5 py-1 rounded bg-zinc-900/85 text-zinc-300 border border-white/5">
                                      {task.category}
                                    </span>
                                    <h4 className={`font-display text-base md:text-lg font-black uppercase tracking-tight text-white leading-snug ${task.completed ? "line-through text-zinc-500" : ""}`}>
                                      {task.title}
                                    </h4>
                                  </div>
                                  <p className="font-sans text-xs text-zinc-400 mt-1.5 max-w-xl">
                                    {task.description}
                                  </p>

                                  {/* Remaining Time Banner */}
                                  <div className="flex items-center gap-4 mt-3 flex-wrap">
                                    <span className="flex items-center gap-1 text-[9px] font-mono font-black uppercase tracking-widest text-zinc-300 bg-zinc-900 px-2.5 py-1 rounded border border-white/5">
                                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                                      {getTimeRemainingStr(task.deadline)}
                                    </span>
                                    <span className="text-[9px] font-mono font-black text-zinc-500 uppercase tracking-wider">
                                      EST. TIME: {formatDuration(task.estimatedDuration)}
                                    </span>
                                    {hasSubtasks && (
                                      <span className="text-[9px] font-mono font-black uppercase tracking-widest text-zinc-300 flex items-center gap-1 bg-zinc-900 px-2.5 py-1 rounded border border-white/5">
                                        <CheckSquare className="w-3.5 h-3.5 text-zinc-500" />
                                        STEPS: {completedSubtasks}/{totalSubtasks}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Urgency Area */}
                              <div className="flex items-center sm:flex-col sm:items-end gap-3 sm:gap-1.5 ml-auto">
                                <div className="text-right">
                                  <div className={`font-mono text-xs font-black uppercase tracking-widest ${urgency.text}`}>
                                    {task.completed ? "COMPLETED" : `URGENCY: ${task.urgencyScore}%`}
                                  </div>
                                  {!task.completed && (
                                    <div className="text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest mt-0.5">
                                      {task.priority} LEVEL
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => toggleExpand(task.id)}
                                    className="p-1.5 hover:bg-zinc-900 rounded-md text-zinc-400 hover:text-white"
                                    title={isExpanded ? "Collapse details" : "Expand checklist"}
                                  >
                                    {isExpanded ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                                  </button>
                                  <button
                                    onClick={() => onDeleteTask(task.id)}
                                    className="p-1.5 hover:bg-red-950/40 rounded-md text-zinc-500 hover:text-red-500"
                                    title="Delete task"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Expanded Section */}
                            {isExpanded && (
                              <div className="px-10 pb-4 pt-1 border-t border-white/5 bg-zinc-950/40 space-y-4">
                                {task.contextAlert && !task.completed && (
                                  <div className="bg-[#030303]/60 border border-orange-500/20 p-3.5 rounded-lg flex items-start gap-2.5 mt-3">
                                    <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-[9px] font-mono font-black text-orange-400 uppercase tracking-widest">TACTICAL ALARM</p>
                                      <p className="text-xs text-zinc-300 font-sans mt-0.5">{task.contextAlert}</p>
                                    </div>
                                  </div>
                                )}

                                <div className="space-y-2 mt-2">
                                  <div className="flex items-center justify-between">
                                    <h5 className="text-[9px] font-mono font-black uppercase tracking-widest text-zinc-500">
                                      AUTONOMOUS EXECUTION FLOW
                                    </h5>
                                  </div>

                                  {hasSubtasks ? (
                                    <div className="space-y-1.5">
                                      {task.subtasks.map((sub) => (
                                        <div
                                          key={sub.id}
                                          className={`p-3 rounded-lg border flex items-start justify-between gap-3 transition-all ${
                                            sub.completed
                                              ? "bg-zinc-900/10 border-transparent text-zinc-500"
                                              : "bg-zinc-900 border-white/5 hover:border-cyan-500/15 text-zinc-200"
                                          }`}
                                        >
                                          <div className="flex items-start gap-2.5">
                                            <input
                                              type="checkbox"
                                              checked={sub.completed}
                                              onChange={() => handleToggleSubtask(task.id, sub.id)}
                                              className="mt-0.5 w-4 h-4 accent-cyan-400 border-white/5 bg-black cursor-pointer rounded"
                                            />
                                            <div className="text-xs font-sans">
                                              <span className={sub.completed ? "line-through text-zinc-500" : "font-bold text-zinc-200 font-mono text-xs uppercase tracking-wide"}>
                                                {sub.title}
                                              </span>
                                              {sub.actionItem && !sub.completed && (
                                                <p className="text-[10px] text-cyan-400 mt-1 font-mono uppercase tracking-wide">
                                                  TIP: {sub.actionItem}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                          <span className="text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest flex-shrink-0 mt-0.5">
                                            {sub.duration} MIN
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-center py-5 bg-[#030303] rounded-lg border border-dashed border-white/5">
                                      <Sparkles className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                                      <p className="text-[9px] font-mono font-black uppercase tracking-widest text-zinc-500">NO ACTIVE SUBTASKS DETECTED</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}
