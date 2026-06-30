import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent telemetry
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
  console.log("Gemini client successfully initialized.");
} else {
  console.warn("WARNING: GEMINI_API_KEY is not set or holds a placeholder value. Server-side AI features will run in mock-fallback mode.");
}

// ----------------- Helper: Safe Model Call wrapper -----------------
async function safeGenerateContent(params: any) {
  if (!ai) {
    throw new Error("Gemini API client not initialized. Please set GEMINI_API_KEY.");
  }
  return await ai.models.generateContent(params);
}

// ----------------- Endpoint 1: Analyze & Prioritize -----------------
app.post("/api/ai/analyze-and-prioritize", async (req, res) => {
  const { tasks = [], habits = [], currentDateTime = new Date().toISOString() } = req.body;

  if (!ai) {
    // Fallback Mock Data if API Key is not set
    const mockPriorities = tasks.map((t: any, idx: number) => {
      const remainingHours = (new Date(t.deadline).getTime() - new Date(currentDateTime).getTime()) / (1000 * 60 * 60);
      let urgencyScore = 50;
      let priority = "medium";
      if (remainingHours <= 0) {
        urgencyScore = 100;
        priority = "critical";
      } else if (remainingHours < 4) {
        urgencyScore = 95;
        priority = "critical";
      } else if (remainingHours < 12) {
        urgencyScore = 80;
        priority = "high";
      } else if (remainingHours < 24) {
        urgencyScore = 65;
        priority = "medium";
      } else {
        urgencyScore = 30;
        priority = "low";
      }

      return {
        taskId: t.id,
        priority: priority,
        urgencyScore: Math.round(urgencyScore),
        contextAlert: remainingHours > 0 
          ? `Urgent! You have ${Math.round(remainingHours)} hours remaining. Prepare your environment immediately.`
          : `DEADLINE EXPIRED! Focus on crisis containment and contact stakeholders immediately.`
      };
    });

    const mockRecommendations = [
      {
        id: "rec_1",
        type: "immediate_action" as const,
        title: "Tackle High-Urgency Deadlines",
        content: "You have upcoming deadlines. Focus 100% on the highest urgency task right now and close all social media tabs.",
        actionLabel: "Start Focus Timer"
      },
      {
        id: "rec_2",
        type: "focus_strategy" as const,
        title: "The 25/5 Pomodoro Cycle",
        content: "To combat extreme procrastination, work in high-intensity intervals of 25 minutes followed by a strict 5-minute break.",
        actionLabel: "Learn Pomodoro"
      }
    ];

    return res.json({
      success: true,
      mode: "mock",
      priorities: mockPriorities,
      recommendations: mockRecommendations
    });
  }

  try {
    const prompt = `
      You are the hyper-practical, high-fidelity AI core of "The Last-Minute Life Saver" app.
      Your task is to analyze the user's workload, identify real deadline bottlenecks, calculate exact dynamic urgency scores, generate subtask breakdowns, and give personalized high-impact recommendations.
      
      Current Date and Time: ${currentDateTime}

      Current user tasks:
      ${JSON.stringify(tasks, null, 2)}

      Current user habits:
      ${JSON.stringify(habits, null, 2)}

      Tasks schema constraints:
      - Calculate a dynamic 'urgencyScore' from 0 (no rush) to 100 (due in minutes / past due). Urgency should increase heavily if estimatedDuration exceeds remaining time.
      - Select an appropriate 'priority': 'critical' (extremely high urgency or high value deadline within 4 hours), 'high' (due within 12 hours), 'medium', or 'low'.
      - Generate a custom, single-sentence 'contextAlert' warning that is highly specific, direct, and helpful (e.g., "Due in 3 hours. If you do not start by 2:30 PM, you won't have enough time to finish.").
      - If a task has no subtasks, generate a logical 3-5 subtask breakdown including estimated durations (in minutes) and a direct actionable title.

      Habits analysis:
      - Correlate habits with deadlines. (e.g. if they have an interview and a habit is 'Prepare suit', recommend executing it).

      Recommendations requirements:
      - Return 2 to 3 recommendations of types: 'immediate_action', 'schedule_conflict', 'wellness_tip', or 'focus_strategy'.
      - Keep them short, ultra-scannable, and extremely practical. No corporate jargon.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            priorities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  taskId: { type: Type.STRING },
                  priority: { type: Type.STRING, description: "Must be critical, high, medium, or low" },
                  urgencyScore: { type: Type.INTEGER, description: "0 to 100" },
                  contextAlert: { type: Type.STRING, description: "Direct warning alert context sentence" }
                },
                required: ["taskId", "priority", "urgencyScore", "contextAlert"]
              }
            },
            newSubtasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  taskId: { type: Type.STRING },
                  subtasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        title: { type: Type.STRING },
                        duration: { type: Type.INTEGER, description: "Estimated duration in minutes" },
                        actionItem: { type: Type.STRING, description: "Actionable direct advice for this subtask" }
                      },
                      required: ["id", "title", "duration"]
                    }
                  }
                },
                required: ["taskId", "subtasks"]
              }
            },
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING, description: "Must be immediate_action, schedule_conflict, wellness_tip, or focus_strategy" },
                  title: { type: Type.STRING },
                  content: { type: Type.STRING },
                  associatedTaskId: { type: Type.STRING },
                  actionLabel: { type: Type.STRING }
                },
                required: ["id", "type", "title", "content"]
              }
            }
          },
          required: ["priorities", "recommendations"]
        }
      }
    });

    const responseText = response.text || "{}";
    const parsedData = JSON.parse(responseText.trim());
    return res.json({ success: true, ...parsedData });

  } catch (error: any) {
    console.error("Prioritization API error (falling back to local heuristic analysis):", error);
    const mockPriorities = tasks.map((t: any, idx: number) => {
      const remainingHours = (new Date(t.deadline).getTime() - new Date(currentDateTime).getTime()) / (1000 * 60 * 60);
      let urgencyScore = 50;
      let priority = "medium";
      if (remainingHours <= 0) {
        urgencyScore = 100;
        priority = "critical";
      } else if (remainingHours < 4) {
        urgencyScore = 95;
        priority = "critical";
      } else if (remainingHours < 12) {
        urgencyScore = 80;
        priority = "high";
      } else if (remainingHours < 24) {
        urgencyScore = 65;
        priority = "medium";
      } else {
        urgencyScore = 30;
        priority = "low";
      }

      return {
        taskId: t.id,
        priority: priority,
        urgencyScore: Math.round(urgencyScore),
        contextAlert: remainingHours > 0 
          ? `Urgent! You have ${Math.round(remainingHours)} hours remaining. Prepare your environment immediately.`
          : `DEADLINE EXPIRED! Focus on crisis containment and contact stakeholders immediately.`
      };
    });

    const mockRecommendations = [
      {
        id: "rec_1",
        type: "immediate_action" as const,
        title: "Tackle High-Urgency Deadlines",
        content: "You have upcoming deadlines. Focus 100% on the highest urgency task right now and close all social media tabs.",
        actionLabel: "Start Focus Timer"
      },
      {
        id: "rec_2",
        type: "focus_strategy" as const,
        title: "The 25/5 Pomodoro Cycle",
        content: "To combat extreme procrastination, work in high-intensity intervals of 25 minutes followed by a strict 5-minute break.",
        actionLabel: "Learn Pomodoro"
      }
    ];

    return res.json({
      success: true,
      mode: "local-fallback",
      priorities: mockPriorities,
      recommendations: mockRecommendations,
      fallbackWarning: "Operating in high-speed offline prioritization mode."
    });
  }
});

// ----------------- Endpoint 2: AI Scheduling Assistance -----------------
app.post("/api/ai/schedule-assistance", async (req, res) => {
  const { tasks = [], currentDateTime = new Date().toISOString() } = req.body;

  if (!ai) {
    // Generate simple local schedule if no key
    const mockEvents = tasks.map((t: any, idx: number) => {
      const startObj = new Date(currentDateTime);
      startObj.setHours(startObj.getHours() + idx * 2 + 1);
      const endObj = new Date(startObj);
      endObj.setMinutes(endObj.getMinutes() + (t.estimatedDuration || 60));

      return {
        id: `event_${t.id}`,
        title: `Work: ${t.title}`,
        start: startObj.toISOString(),
        end: endObj.toISOString(),
        category: t.category,
        taskId: t.id
      };
    });

    return res.json({
      success: true,
      mode: "mock",
      events: mockEvents,
      reasoning: "I placed your tasks in succession with 15-minute intervals. Close distractions and start with the earliest deadline!"
    });
  }

  try {
    const prompt = `
      You are the smart Scheduling coordinator for 'The Last-Minute Life Saver' application.
      The user has multiple critical deadlines. Create an optimized calendar layout for the next 48 hours starting from ${currentDateTime}.
      
      Tasks list:
      ${JSON.stringify(tasks, null, 2)}

      Rules for scheduling:
      1. Assign specific realistic time blocks to complete each non-completed task before its deadline.
      2. Keep task duration realistic (based on the estimatedDuration in minutes).
      3. Insert 10-15 minute "buffer" blocks between back-to-back heavy tasks.
      4. Avoid scheduling work during standard sleep hours (11:00 PM to 7:00 AM) unless a critical task is literally due during that time.
      5. Insert standard routine breaks like lunch or brief walk.
      6. Return a JSON structure representing the list of CalendarEvent slots.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            events: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  start: { type: Type.STRING, description: "ISO 8601 timestamp" },
                  end: { type: Type.STRING, description: "ISO 8601 timestamp" },
                  category: { type: Type.STRING, description: "Category of the event or 'buffer', 'routine'" },
                  taskId: { type: Type.STRING, description: "Associated task ID if any" }
                },
                required: ["id", "title", "start", "end", "category"]
              }
            },
            reasoning: {
              type: Type.STRING,
              description: "Brief, powerful description of why this schedule was chosen and how it prevents crisis."
            }
          },
          required: ["events", "reasoning"]
        }
      }
    });

    const parsedData = JSON.parse((response.text || "{}").trim());
    return res.json({ success: true, ...parsedData });

  } catch (error: any) {
    console.error("Scheduling API error (falling back to local schedule builder):", error);
    const mockEvents = tasks.map((t: any, idx: number) => {
      const startObj = new Date(currentDateTime);
      startObj.setHours(startObj.getHours() + idx * 2 + 1);
      const endObj = new Date(startObj);
      endObj.setMinutes(endObj.getMinutes() + (t.estimatedDuration || 60));

      return {
        id: `event_${t.id}`,
        title: `Work: ${t.title}`,
        start: startObj.toISOString(),
        end: endObj.toISOString(),
        category: t.category,
        taskId: t.id
      };
    });

    return res.json({
      success: true,
      mode: "local-fallback",
      events: mockEvents,
      reasoning: "Operating in high-speed offline scheduling mode. We placed your tasks sequentially with healthy rest buffers!"
    });
  }
});

// ----------------- Endpoint 3: Voice/Natural Language Command Assistant -----------------
app.post("/api/ai/voice-command", async (req, res) => {
  const { command, tasks = [], currentDateTime = new Date().toISOString() } = req.body;

  if (!command) {
    return res.status(400).json({ success: false, error: "Command string is required." });
  }

  // Define fallback if no API key
  let actionResult: any = {
    action: "general_chat",
    textResponse: `I heard you say: "${command}". (Note: Connect your Gemini API Key in Settings to parse dates, automatically structure tasks, and trigger voice synthesizers!)`,
    data: {}
  };

  if (ai) {
    try {
      const prompt = `
        You are the voice interface of "The Last-Minute Life Saver".
        A user spoke or typed this command: "${command}"
        Current date and time is: ${currentDateTime}
        Current tasks in system: ${JSON.stringify(tasks, null, 2)}

        Parse this command and classify it into one of the following actions:
        - "add_task": User wants to schedule or add a new task, assignment, meeting, bill, or interview. Extract title, deadline (calculate specific ISO string based on currentDateTime), category, and estimatedDuration (default to 60 if unspecified).
        - "breakdown_task": User wants to break a task down or plan steps. Identify the taskId from current tasks if possible, or provide a task title to breakdown.
        - "complete_task": User says they finished something. Match the taskId.
        - "general_chat": User is panicking, asking for tips, or talking about workload. Respond with high empathy, high intensity, and highly-actionable micro-habits.

        Respond with a JSON block.
      `;

      const classificationResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              action: { type: Type.STRING, description: "add_task, breakdown_task, complete_task, or general_chat" },
              taskId: { type: Type.STRING, description: "Matched task ID if applicable" },
              taskToCreate: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  deadline: { type: Type.STRING, description: "Calculate exact ISO timestamp relative to currentDateTime" },
                  category: { type: Type.STRING, description: "assignment, meeting, bill, interview, commitment, other" },
                  priority: { type: Type.STRING, description: "critical, high, medium, low" },
                  estimatedDuration: { type: Type.INTEGER, description: "Duration in minutes" }
                },
                required: ["title", "deadline", "category", "priority"]
              },
              subtasksToCreate: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    duration: { type: Type.INTEGER },
                    actionItem: { type: Type.STRING }
                  },
                  required: ["title", "duration"]
                }
              },
              textResponse: { type: Type.STRING, description: "Empathetic, clear verbal response to say back to the user. Keep it brief (1-2 sentences)." }
            },
            required: ["action", "textResponse"]
          }
        }
      });

      const parsed = JSON.parse((classificationResponse.text || "{}").trim());
      actionResult = parsed;

    } catch (err: any) {
      console.error("Command parsing failed:", err);
      actionResult.textResponse = "I understood your request but ran into an issue parsing it. Let's try again with a clearer deadline.";
    }
  }

  // Step 2: If we have an AI client and a valid text response, synthesize voice audio using Gemini TTS!
  if (ai && actionResult.textResponse) {
    try {
      const speechPrompt = `Say cheerfully but with supportive urgency: ${actionResult.textResponse}`;
      const speechResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: speechPrompt }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Kore" } // Kore is clear and energetic
            }
          }
        }
      });

      const audioPart = speechResponse.candidates?.[0]?.content?.parts?.[0];
      if (audioPart && audioPart.inlineData?.data) {
        actionResult.audio = audioPart.inlineData.data; // Base64 audio stream
      }
    } catch (audioErr: any) {
      console.warn("TTS synthesis failed or was bypassed:", audioErr.message);
    }
  }

  return res.json({ success: true, ...actionResult });
});

// Serve frontend with Vite middleware in development, or compiled files in production
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`The Last-Minute Life Saver full-stack server running on http://localhost:${PORT}`);
});
