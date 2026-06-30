import React, { useState } from "react";
import { Zap, Flame, Plus, Check, PlusCircle, Award } from "lucide-react";
import { Habit } from "../types";

interface HabitTrackerProps {
  habits: Habit[];
  onToggleHabit: (id: string) => void;
  onAddHabit: (title: string, frequency: 'daily' | 'weekly') => void;
}

export default function HabitTracker({
  habits,
  onToggleHabit,
  onAddHabit,
}: HabitTrackerProps) {
  const [newTitle, setNewTitle] = useState("");
  const [newFreq, setNewFreq] = useState<'daily' | 'weekly'>('daily');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddHabit(newTitle, newFreq);
    setNewTitle("");
    setShowAddForm(false);
  };

  return (
    <div className="bg-zinc-950/90 border border-white/5 rounded-xl p-5 space-y-4 animate-popup">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <Zap className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="font-display font-black text-white text-xs tracking-widest uppercase">
              ANTI-PROCRASTINATION HABITS
            </h3>
            <p className="font-mono text-[9px] font-bold text-zinc-500 uppercase tracking-wider mt-0.5">
              Build routines to secure yourself from future crunches.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-1.5 bg-zinc-900 border border-white/5 hover:border-cyan-500/20 text-cyan-400 rounded-md hover:scale-105 active:scale-95 transition-all"
          title="Add habit"
        >
          <PlusCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Form Add Habit */}
      {showAddForm && (
        <form onSubmit={handleCreateHabit} className="p-4 bg-zinc-900/60 border border-white/5 rounded-lg space-y-3 animate-popup">
          <div className="space-y-1.5">
            <label className="text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest">Habit Title</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Check tomorrow's schedule before sleep"
              className="w-full bg-[#030303] border border-white/5 text-xs text-white p-2.5 rounded-md focus:outline-none focus:border-cyan-500/30 font-mono"
            />
          </div>
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest">Frequency:</span>
              <select
                value={newFreq}
                onChange={(e) => setNewFreq(e.target.value as 'daily' | 'weekly')}
                className="bg-[#030303] border border-white/5 text-xs text-white p-1 rounded-md focus:outline-none font-mono"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs font-mono font-black uppercase tracking-wider text-zinc-400 hover:text-white px-2 py-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-white text-black font-mono font-black uppercase tracking-widest text-xs px-3 py-1.5 rounded-md hover:bg-zinc-200"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Habit Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {habits.map((habit) => (
          <div
            key={habit.id}
            className={`p-4 rounded-lg border flex flex-col justify-between gap-4 transition-all duration-300 ${
              habit.completedToday
                ? "bg-cyan-500/5 border-cyan-500/20 opacity-75"
                : "bg-zinc-950 border-white/5 hover:border-zinc-700"
            }`}
          >
            {/* Top row */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 flex-1">
                <span className="text-[9px] font-mono font-black uppercase tracking-widest bg-zinc-900 px-1.5 py-0.5 rounded border border-white/5 text-zinc-400">
                  {habit.frequency}
                </span>
                <h4 className={`text-xs font-bold font-mono uppercase tracking-wide text-white leading-snug ${habit.completedToday ? "line-through text-zinc-500" : ""}`}>
                  {habit.title}
                </h4>
              </div>

              <button
                onClick={() => onToggleHabit(habit.id)}
                className={`w-7 h-7 rounded-md border flex items-center justify-center transition-all ${
                  habit.completedToday
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 border-transparent text-white"
                    : "bg-zinc-900 border-white/5 text-zinc-500 hover:border-white/10 hover:text-white"
                }`}
              >
                <Check className="w-4 h-4 stroke-[3]" />
              </button>
            </div>

            {/* Bottom meta */}
            <div className="pt-2.5 border-t border-white/5 flex items-center justify-between flex-wrap gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wide text-zinc-400 italic">
                {habit.aiRecommendation}
              </span>
              
              <div className="flex items-center gap-1 bg-zinc-900 border border-white/5 px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-widest text-amber-500">
                <Flame className="w-3.5 h-3.5 fill-amber-500/10 animate-pulse" />
                <span>{habit.streak}d streak</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
