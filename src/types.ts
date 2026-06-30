export type TaskCategory = 'assignment' | 'meeting' | 'bill' | 'interview' | 'commitment' | 'other';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export interface SubTask {
  id: string;
  title: string;
  duration: number; // in minutes
  completed: boolean;
  actionItem?: string; // AI recommendation on how to do it immediately
}

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string; // ISO format or YYYY-MM-DDTHH:mm
  priority: TaskPriority;
  category: TaskCategory;
  completed: boolean;
  subtasks: SubTask[];
  estimatedDuration: number; // total in minutes
  scheduledStart: string | null; // ISO string or YYYY-MM-DDTHH:mm
  urgencyScore: number; // 0 to 100 calculated dynamically
  contextAlert: string | null; // AI-generated context-aware warning
}

export interface Habit {
  id: string;
  title: string;
  frequency: 'daily' | 'weekly';
  streak: number;
  lastCompleted: string | null; // YYYY-MM-DD
  completedToday: boolean;
  aiRecommendation: string;
}

export interface Recommendation {
  id: string;
  type: 'immediate_action' | 'schedule_conflict' | 'wellness_tip' | 'focus_strategy';
  title: string;
  content: string;
  associatedTaskId?: string;
  actionLabel?: string;
}

export interface AIAnalysisResponse {
  priorities: { taskId: string; priority: TaskPriority; urgencyScore: number; reason: string }[];
  recommendations: Recommendation[];
  updatedTasks?: { id: string; contextAlert: string; subtasks?: SubTask[] }[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO
  end: string; // ISO
  category: TaskCategory | 'buffer' | 'routine';
  taskId?: string;
}
