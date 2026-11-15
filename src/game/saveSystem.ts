import { CheckpointData } from './rules';

const STORAGE_KEY_SLOTS = 's7_ultra_checkpoints_v1';
const LEGACY_KEY = 's7save';

export interface SaveSlotMeta {
  slotId: string;
  label: string;
  data: CheckpointData | null;
}

export function loadAllCheckpoints(): Record<string, CheckpointData> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SLOTS);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, CheckpointData>;
  } catch {
    return {};
  }
}

export function saveCheckpointToSlot(slotId: string, checkpoint: CheckpointData): void {
  try {
    const all = loadAllCheckpoints();
    all[slotId] = { ...checkpoint, slotId };
    localStorage.setItem(STORAGE_KEY_SLOTS, JSON.stringify(all));
    // Also maintain legacy key for quick Continue
    localStorage.setItem(LEGACY_KEY, JSON.stringify(checkpoint));
  } catch {
    // Ignore storage quota errors
  }
}

export function getLatestCheckpoint(): CheckpointData | null {
  try {
    const all = loadAllCheckpoints();
    const list = Object.values(all);
    if (list.length > 0) {
      list.sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''));
      return list[0];
    }
    const leg = localStorage.getItem(LEGACY_KEY);
    if (leg) {
      const parsed = JSON.parse(leg);
      if (parsed && parsed.inv) return parsed as CheckpointData;
    }
  } catch {
    // ignore
  }
  return null;
}

export function deleteCheckpointSlot(slotId: string): void {
  try {
    const all = loadAllCheckpoints();
    delete all[slotId];
    localStorage.setItem(STORAGE_KEY_SLOTS, JSON.stringify(all));
  } catch {
    // ignore
  }
}

export function getCheckpointSlotsList(): SaveSlotMeta[] {
  const all = loadAllCheckpoints();
  return [
    { slotId: 'auto', label: 'Автосохранение (Ключевая точка)', data: all['auto'] || null },
    { slotId: 'slot1', label: 'Ключевая точка — Слот 1', data: all['slot1'] || null },
    { slotId: 'slot2', label: 'Ключевая точка — Слот 2', data: all['slot2'] || null },
    { slotId: 'slot3', label: 'Ключевая точка — Слот 3', data: all['slot3'] || null },
  ];
}
