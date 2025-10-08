import { create } from 'zustand';
import type { Backlink, LinkGraph } from '../services/linkService';

interface LinkStore {
  backlinks: Backlink[];
  linkGraph: LinkGraph | null;
  loading: boolean;

  // Actions
  setBacklinks: (backlinks: Backlink[]) => void;
  setLinkGraph: (graph: LinkGraph) => void;
  clearBacklinks: () => void;
}

export const useLinkStore = create<LinkStore>((set) => ({
  backlinks: [],
  linkGraph: null,
  loading: false,

  setBacklinks: (backlinks) => set({ backlinks }),

  setLinkGraph: (graph) => set({ linkGraph: graph }),

  clearBacklinks: () => set({ backlinks: [] }),
}));
