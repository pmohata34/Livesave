import { Task, Habit, Recommendation } from "./types";

// Dynamic dates relative to today
export function getRelativeISOString(hoursOffset: number, minutesOffset: number = 0): string {
  const d = new Date();
  d.setHours(d.getHours() + hoursOffset);
  d.setMinutes(d.getMinutes() + minutesOffset);
  return d.toISOString().slice(0, 16); // format as YYYY-MM-DDTHH:mm
}

export const INITIAL_TASKS: Task[] = [
  {
    id: "task_1",
    title: "Math Assignment 4: Calculus Curves",
    description: "Submit PDF solutions for double integrals and volume bounds. Highly technical, requires formula checks.",
    deadline: getRelativeISOString(3, 15), // due in 3h 15m
    priority: "critical",
    category: "assignment",
    completed: false,
    subtasks: [
      { id: "sub_1_1", title: "Review double integration limits", duration: 30, completed: false, actionItem: "Locate lecture slide 12 for the volume bounds formula" },
      { id: "sub_1_2", title: "Solve problem set 3 and 4", duration: 60, completed: false, actionItem: "Write out intermediate steps cleanly to gain partial credit" },
      { id: "sub_1_3", title: "Scan and upload solutions to portal", duration: 15, completed: false, actionItem: "Use mobile scanner app to convert to PDF immediately" }
    ],
    estimatedDuration: 105,
    scheduledStart: null,
    urgencyScore: 92,
    contextAlert: "CRITICAL: If you do not scan and compile your paper by 2:45 PM, you will miss the portal upload lock!"
  },
  {
    id: "task_2",
    title: "Electricity & Fiber Internet Bill",
    description: "Pay the overdue utility bill to prevent service interruption. Fast payment portal required.",
    deadline: getRelativeISOString(1, 45), // due in 1h 45m
    priority: "critical",
    category: "bill",
    completed: false,
    subtasks: [],
    estimatedDuration: 10,
    scheduledStart: null,
    urgencyScore: 97,
    contextAlert: "URGENT WARNING: Grace period ends in less than 2 hours. Autopay failed, manual override needed!"
  },
  {
    id: "task_3",
    title: "Venture Capital Pitch Deck Edits",
    description: "Incorporate mock-up screenshots and correct slide 5 financial metrics before investor meeting.",
    deadline: getRelativeISOString(14, 0), // tomorrow morning
    priority: "high",
    category: "commitment",
    completed: false,
    subtasks: [
      { id: "sub_3_1", title: "Correct CAC & LTV calculations on slide 5", duration: 40, completed: false },
      { id: "sub_3_2", title: "Insert updated application product mockup", duration: 30, completed: false }
    ],
    estimatedDuration: 70,
    scheduledStart: null,
    urgencyScore: 68,
    contextAlert: "Incorporate investor feedback tonight to allow dry-run testing tomorrow morning."
  },
  {
    id: "task_4",
    title: "NextGen Software Engineer Interview",
    description: "Prepare system design talking points, study architectural diagrams, and check webcam audio.",
    deadline: getRelativeISOString(30, 0), // day after tomorrow
    priority: "medium",
    category: "interview",
    completed: false,
    subtasks: [],
    estimatedDuration: 120,
    scheduledStart: null,
    urgencyScore: 45,
    contextAlert: "Review system design template and log mock practice questions ahead of schedule."
  }
];

export const INITIAL_HABITS: Habit[] = [
  {
    id: "habit_1",
    title: "Daily Calendar Synchronization",
    frequency: "daily",
    streak: 5,
    lastCompleted: null,
    completedToday: false,
    aiRecommendation: "Synchronizing first thing prevents calendar blindspots and overlapping deadlines."
  },
  {
    id: "habit_2",
    title: "Sanity Workstation Cleared",
    frequency: "daily",
    streak: 3,
    lastCompleted: null,
    completedToday: false,
    aiRecommendation: "A tidy workspace reduces adrenaline surges and minimizes cognitive load during deep work."
  },
  {
    id: "habit_3",
    title: "Prepare Zoom Setup Night Before",
    frequency: "weekly",
    streak: 1,
    lastCompleted: null,
    completedToday: false,
    aiRecommendation: "Pre-verifying microphone and camera levels ensures stress-free entries for important calls."
  }
];

export const INITIAL_RECOMMENDATIONS: Recommendation[] = [
  {
    id: "rec_1",
    type: "immediate_action",
    title: "Fast-Track Overland Bills",
    content: "Your electricity bill deadline is dangerously close (under 2 hours). Prioritize this instantly to secure workstation power.",
    associatedTaskId: "task_2",
    actionLabel: "Complete Overdue Payment"
  },
  {
    id: "rec_2",
    type: "focus_strategy",
    title: "Eliminate Sensory Pollution",
    content: "Put your phone in another room or turn on 'DND' mode. Even seeing a phone face-up on the desk lowers focus by 20%.",
    actionLabel: "Activate Focus Timer"
  }
];

// Local calculations fallback
export function calculateLocalUrgency(deadlineStr: string, estimatedDurationMinutes: number): { score: number; priority: 'critical' | 'high' | 'medium' | 'low' } {
  const now = new Date().getTime();
  const deadline = new Date(deadlineStr).getTime();
  const msRemaining = deadline - now;
  const hoursRemaining = msRemaining / (1000 * 60 * 60);

  if (msRemaining <= 0) {
    return { score: 100, priority: "critical" };
  }

  // Calculate work density: ratio of estimated work to time remaining
  const workHours = estimatedDurationMinutes / 60;
  let density = workHours / Math.max(hoursRemaining, 0.1);

  let score = 30;
  let priority: 'critical' | 'high' | 'medium' | 'low' = "low";

  if (hoursRemaining < 2) {
    score = 95 + Math.min(density * 5, 5);
    priority = "critical";
  } else if (hoursRemaining < 6) {
    score = 80 + density * 10;
    priority = "critical";
  } else if (hoursRemaining < 12) {
    score = 65 + density * 8;
    priority = "high";
  } else if (hoursRemaining < 24) {
    score = 45 + density * 5;
    priority = "medium";
  } else {
    score = Math.max(20, Math.min(50, 30 + density * 3));
    priority = "low";
  }

  return {
    score: Math.min(100, Math.max(0, Math.round(score))),
    priority: priority
  };
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

// Function to play base64-encoded audio (Gemini TTS)
export function playBase64Audio(base64Data: string) {
  try {
    // Decode base64 to arraybuffer
    const binaryString = window.atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const blob = new Blob([bytes], { type: "audio/wav" });
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    audio.play();
    return audio;
  } catch (error) {
    console.error("Failed to play synthesized speech audio:", error);
    return null;
  }
}
