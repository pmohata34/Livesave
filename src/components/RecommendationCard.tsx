import React from "react";
import { AlertTriangle, ShieldCheck, HelpCircle, Activity } from "lucide-react";
import { Recommendation } from "../types";

interface RecommendationCardProps {
  recommendations: Recommendation[];
  onActionTrigger: (rec: Recommendation) => void;
}

export default function RecommendationCard({
  recommendations,
  onActionTrigger,
}: RecommendationCardProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "immediate_action":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "schedule_conflict":
        return <Activity className="w-4 h-4 text-amber-500" />;
      case "focus_strategy":
        return <ShieldCheck className="w-4 h-4 text-zinc-400" />;
      default:
        return <HelpCircle className="w-4 h-4 text-zinc-600" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case "immediate_action":
        return "border-red-500/20 bg-red-500/5";
      case "schedule_conflict":
        return "border-amber-500/20 bg-amber-500/5";
      case "focus_strategy":
        return "border-white/10 bg-zinc-900/40";
      default:
        return "border-white/5 bg-[#0A0A0A]";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="font-display font-black text-white text-xs tracking-widest uppercase">
          AI SURVIVAL RECOMMENDATIONS
        </h3>
        <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.length === 0 ? (
          <div className="md:col-span-2 text-center py-8 border border-dashed border-white/10 rounded-lg bg-zinc-950/40">
            <ShieldCheck className="w-5 h-5 text-zinc-500 mx-auto mb-1.5 animate-pulse" />
            <p className="text-zinc-400 text-xs font-mono uppercase tracking-wider">No proactive strategies yet. Trigger AI Matrix analysis.</p>
          </div>
        ) : (
          recommendations.map((rec) => {
            const borderStyle = getBorderColor(rec.type);
            const icon = getIcon(rec.type);

            return (
              <div
                key={rec.id}
                className={`p-4 rounded-lg border flex flex-col justify-between gap-4 transition-all hover:border-zinc-700 ${borderStyle}`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    {icon}
                    <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                      {rec.title}
                    </h4>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                    {rec.content}
                  </p>
                </div>

                {rec.actionLabel && (
                  <button
                    onClick={() => onActionTrigger(rec)}
                    className="self-start text-[9px] font-mono font-black uppercase tracking-widest text-black bg-white hover:bg-zinc-200 px-3 py-1.5 rounded-md transition-all active:scale-95"
                  >
                    {rec.actionLabel}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
