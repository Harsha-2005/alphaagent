// Simple in-memory store for research results (SSE streaming)
// In production this would be Redis pub/sub

const sessions = new Map<string, any>();
const stepBuffers = new Map<string, any[]>();

export function createSession(id: string, initialData: any) {
  sessions.set(id, { ...initialData, steps: [] });
  stepBuffers.set(id, []);
}

export function updateSession(id: string, data: any) {
  const existing = sessions.get(id) || {};
  sessions.set(id, { ...existing, ...data });
}

export function appendStep(id: string, step: any) {
  const steps = stepBuffers.get(id) || [];
  steps.push(step);
  stepBuffers.set(id, steps);

  const session = sessions.get(id) || {};
  session.steps = [...(session.steps || []), step];
  sessions.set(id, session);
}

export function getSession(id: string) {
  return sessions.get(id);
}

export function getStepBuffer(id: string) {
  return stepBuffers.get(id) || [];
}

export function clearStepBuffer(id: string) {
  stepBuffers.set(id, []);
}

export function deleteSession(id: string) {
  sessions.delete(id);
  stepBuffers.delete(id);
}

// Clean up sessions older than 1 hour
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (session.createdAt && now - new Date(session.createdAt).getTime() > 3600000) {
      sessions.delete(id);
      stepBuffers.delete(id);
    }
  }
}, 300000); // every 5 minutes
