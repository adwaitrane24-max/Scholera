import type { Message } from "./types";

const STORAGE_KEY = "scholera:pinned-messages";

function writePinned(messages: Message[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

export function getPinned(): Message[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as Message[];
  } catch (error) {
    console.error("Pinned messages are corrupted in localStorage.", error);
    return [];
  }
}

export function pinMessage(message: Message): Message[] {
  const existing = getPinned();
  if (existing.some((entry) => entry.id === message.id)) {
    return existing;
  }

  const updated = [...existing, message];
  writePinned(updated);
  return updated;
}

export function unpinMessage(messageId: string): Message[] {
  const updated = getPinned().filter((entry) => entry.id !== messageId);
  writePinned(updated);
  return updated;
}

export function isPinned(messageId: string): boolean {
  return getPinned().some((entry) => entry.id === messageId);
}
