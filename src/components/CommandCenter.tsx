import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Send, Sparkles, Volume2, CornerDownLeft, MessageSquareDot } from "lucide-react";
import { Task } from "../types";
import { playBase64Audio } from "../utils";

interface CommandCenterProps {
  tasks: Task[];
  onAddTask: (task: Partial<Task>) => void;
  onBreakdownTask: (taskId: string, subtasks: any[]) => void;
  onCompleteTask: (taskId: string) => void;
  onRefreshPriorities: () => void;
}

export default function CommandCenter({
  tasks,
  onAddTask,
  onBreakdownTask,
  onCompleteTask,
  onRefreshPriorities,
}: CommandCenterProps) {
  const [commandText, setCommandText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chatLog, setChatLog] = useState<Array<{ role: "user" | "assistant"; text: string; actionApplied?: string }>>([
    {
      role: "assistant",
      text: "Welcome back. Enter or speak a deadline (e.g., 'Physics lab due tonight at 9 PM') to analyze priority level, generate tactical subtasks, and schedule visual calendar intervals.",
    },
  ]);

  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog, isLoading]);

  // Set up Speech Recognition if available
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsRecording(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCommandText(transcript);
        submitCommand(transcript);
      };

      rec.onerror = (e: any) => {
        console.error("Speech recognition error:", e);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser session. Please type your command below instead!");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setCommandText("");
      recognitionRef.current.start();
    }
  };

  const submitCommand = async (textToSubmit?: string) => {
    const finalCommand = (textToSubmit || commandText).trim();
    if (!finalCommand) return;

    setCommandText("");
    // Add User Message to Log
    setChatLog((prev) => [...prev, { role: "user", text: finalCommand }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/voice-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: finalCommand,
          tasks: tasks,
          currentDateTime: new Date().toISOString(),
        }),
      });

      const data = await response.json();
      setIsLoading(false);

      if (data.success) {
        let actionApplied = "";

        // Apply structured actions to client state
        if (data.action === "add_task" && data.taskToCreate) {
          onAddTask(data.taskToCreate);
          actionApplied = `Added new ${data.taskToCreate.category} task: "${data.taskToCreate.title}"`;
        } else if (data.action === "breakdown_task" && data.taskId && data.subtasksToCreate) {
          onBreakdownTask(data.taskId, data.subtasksToCreate);
          actionApplied = `Generated detailed checklist breakdown for your task.`;
        } else if (data.action === "complete_task" && data.taskId) {
          onCompleteTask(data.taskId);
          actionApplied = `Marked task as fully completed!`;
        }

        // Add Assistant Response to Log
        setChatLog((prev) => [
          ...prev,
          {
            role: "assistant",
            text: data.textResponse,
            actionApplied: actionApplied,
          },
        ]);

        // Play Synthesized Voice Audio if available
        if (data.audio) {
          playBase64Audio(data.audio);
        }

        // Ask parent to trigger a general prioritization refresh
        setTimeout(() => {
          onRefreshPriorities();
        }, 1000);

      } else {
        setChatLog((prev) => [
          ...prev,
          { role: "assistant", text: "Something went wrong parsing your request. Let me try again." },
        ]);
      }
    } catch (err: any) {
      console.error(err);
      setIsLoading(false);
      setChatLog((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `I'm currently operating in standalone focus mode. ${
            commandText.toLowerCase().includes("essay") || commandText.toLowerCase().includes("paper")
              ? "Let me help you outline steps immediately."
              : "Let's track this item directly!"
          }`,
        },
      ]);
    }
  };

  const presetChips = [
    { label: "Due tonight: Math assignment", query: "I have a math assignment due tonight at 11 PM. Please break it down and schedule it" },
    { label: "Overdue: Utility bill", query: "I forgot to pay my electricity bill. It is due in 1 hour" },
    { label: "Investor pitch presentation", query: "I have a high-stakes slide pitch to investors tomorrow morning at 10 AM" },
    { label: "System Design Interview prep", query: "Help! I have a system design interview prep in 24 hours" },
  ];

  return (
    <div id="command-center-container" className="bg-[#0A0A0A]/95 border border-white/5 rounded-xl flex flex-col h-[480px] overflow-hidden animate-popup">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5 bg-zinc-950/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)] flex-shrink-0 animate-pulse">
            <img 
              src="https://picsum.photos/seed/cybercore/150/150" 
              alt="AI Companion Core" 
              className="w-full h-full object-cover filter brightness-90 contrast-125 saturate-150"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent pointer-events-none" />
          </div>
          <div>
            <h3 className="font-display font-black text-white text-xs tracking-widest uppercase">
              AI SURVIVAL COMPANION
            </h3>
            <p className="font-mono text-[9px] font-bold text-zinc-500 tracking-wider">INTEGRATED TACTICAL ENGINE</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono font-black text-cyan-400 uppercase tracking-widest bg-cyan-500/5 px-2.5 py-1 rounded border border-cyan-400/20">
            NEXUS CORE ACTIVE
          </span>
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800 bg-[#030303]/40">
        {chatLog.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col max-w-[85%] ${
              msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
            }`}
          >
            <div
              className={`px-4 py-3 rounded-lg text-xs leading-relaxed font-sans ${
                msg.role === "user"
                  ? "bg-zinc-800/85 text-white border border-white/10"
                  : "bg-zinc-900/40 text-zinc-200 border border-white/5"
              }`}
            >
              {msg.text}

              {msg.actionApplied && (
                <div className="mt-2 text-[9px] font-mono font-bold text-cyan-300 bg-cyan-950/20 border border-cyan-500/15 px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" />
                  {msg.actionApplied}
                </div>
              )}
            </div>
            <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider mt-1 px-1">
              {msg.role === "user" ? "Alex Chen" : "AI Copilot"}
            </span>
          </div>
        ))}

        {isLoading && (
          <div className="flex flex-col items-start max-w-[85%] mr-auto">
            <div className="bg-zinc-900/30 border border-white/5 px-4 py-3 rounded-lg text-xs text-zinc-400 flex items-center gap-2">
              <span className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
              <span className="font-mono text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Calculating density...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Preset Chips */}
      <div className="px-4 py-2.5 border-t border-white/5 bg-zinc-950">
        <p className="text-[9px] font-mono font-black text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1">
          <MessageSquareDot className="w-3.5 h-3.5 text-cyan-400" /> TACTICAL PRESET INSTRUCTIONS (TAP TO EXECUTE)
        </p>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {presetChips.map((chip, i) => (
            <button
              key={i}
              onClick={() => submitCommand(chip.query)}
              className="whitespace-nowrap px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-400 bg-zinc-900/60 hover:bg-zinc-800 border border-white/5 hover:border-cyan-500/20 rounded-md transition-all duration-200 active:scale-95"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-3 bg-zinc-950 border-t border-white/5 flex items-center gap-2">
        <button
          onClick={toggleRecording}
          className={`p-3 rounded-lg flex items-center justify-center transition-all duration-300 relative ${
            isRecording
              ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white animate-pulse"
              : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/5"
          }`}
          title={isRecording ? "Listening... click to submit" : "Speak command (Speech-to-Text)"}
        >
          {isRecording ? (
            <>
              <MicOff className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
            </>
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </button>

        <div className="flex-1 relative flex items-center">
          <input
            type="text"
            value={commandText}
            onChange={(e) => setCommandText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                submitCommand();
              }
            }}
            placeholder={isRecording ? "Listening..." : "Speak or type deadline parameters..."}
            className="w-full bg-[#030303] hover:bg-zinc-900 focus:bg-[#030303] text-xs text-white placeholder-zinc-500 pl-3.5 pr-10 py-3 rounded-lg border border-white/5 focus:border-zinc-700 outline-none transition-all font-mono"
          />
          <kbd className="absolute right-3 top-3 font-mono text-[9px] font-bold text-zinc-500 hidden sm:flex items-center gap-0.5 bg-zinc-950 px-1.5 py-0.5 rounded border border-white/5">
            <CornerDownLeft className="w-2.5 h-2.5" /> ENTER
          </kbd>
        </div>

        <button
          onClick={() => submitCommand()}
          disabled={!commandText.trim()}
          className={`p-3 rounded-lg transition-all ${
            commandText.trim()
              ? "bg-white text-black font-black hover:bg-zinc-200 cursor-pointer"
              : "bg-zinc-900 text-zinc-600 cursor-not-allowed"
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
