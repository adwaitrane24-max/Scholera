import type { Message } from "./types";

const STORAGE_KEY = "tutor-app:pinned-messages";

export function getPinned(): Message[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Message[]) : [];
  } catch {
    return []; // corrupted storage shouldn't crash the app
  }
}

export function pinMessage(message: Message): Message[] {
  const current = getPinned();
  if (current.some((m) => m.id === message.id)) return current; // no duplicates
  const updated = [...current, message];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function unpinMessage(messageId: string): Message[] {
  const updated = getPinned().filter((m) => m.id !== messageId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function isPinned(messageId: string): boolean {
  return getPinned().some((m) => m.id === messageId);
}
