import { create } from "zustand";

export type CelebrationType =
  | "LEVEL_UP"
  | "RANK_UP"
  | "QUEST_COMPLETE"
  | "ACHIEVEMENT";

export interface CelebrationItem {
  id: string;
  type: CelebrationType;
  title: string;
  description?: string;
  data?: Record<string, unknown>;
}

export interface CelebrationState {
  queue: CelebrationItem[];
  current: CelebrationItem | null;
  enqueue: (item: Omit<CelebrationItem, "id"> | CelebrationItem) => void;
  enqueueMany: (items: (Omit<CelebrationItem, "id"> | CelebrationItem)[]) => void;
  next: () => CelebrationItem | null;
  clear: () => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export const useCelebrationStore = create<CelebrationState>((set, get) => ({
  queue: [],
  current: null,

  enqueue: (item) => {
    const fullItem: CelebrationItem = {
      ...item,
      id: "id" in item && item.id ? item.id : generateId(),
    };

    set((state) => {
      if (!state.current) {
        return {
          current: fullItem,
          queue: state.queue,
        };
      }
      return {
        queue: [...state.queue, fullItem],
      };
    });
  },

  enqueueMany: (items) => {
    if (items.length === 0) return;

    const fullItems: CelebrationItem[] = items.map((item) => ({
      ...item,
      id: "id" in item && item.id ? item.id : generateId(),
    }));

    set((state) => {
      if (!state.current) {
        const [first, ...rest] = fullItems;
        return {
          current: first,
          queue: [...state.queue, ...rest],
        };
      }
      return {
        queue: [...state.queue, ...fullItems],
      };
    });
  },

  next: () => {
    const { queue } = get();
    if (queue.length === 0) {
      set({ current: null });
      return null;
    }

    const [nextItem, ...remaining] = queue;
    set({
      current: nextItem,
      queue: remaining,
    });
    return nextItem;
  },

  clear: () => {
    set({ queue: [], current: null });
  },
}));

