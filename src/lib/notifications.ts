const READ_KEY = "erebrus_notif_read_v1";

function readSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(READ_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.map(String)) : new Set();
  } catch {
    return new Set();
  }
}

function writeSet(ids: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
}

export function inviteNotificationId(orgId: string): string {
  return `org-invite:${orgId}`;
}

export function isNotificationRead(id: string): boolean {
  return readSet().has(id);
}

export function markNotificationRead(id: string) {
  const ids = readSet();
  ids.add(id);
  writeSet(ids);
}

export function markNotificationsRead(ids: string[]) {
  const set = readSet();
  ids.forEach((id) => set.add(id));
  writeSet(set);
}

export function countUnread(ids: string[]): number {
  const set = readSet();
  return ids.filter((id) => !set.has(id)).length;
}