export type ErebrusGlobeNode = {
  id: string;
  lat: number;
  lng: number;
  /** Slot within a stack of co-located nodes (see globe-nodes.ts). */
  groupIndex?: number;
  /** Size of that stack; >1 fans out on screen, >4 renders as a count badge. */
  groupSize?: number;
};

export type GlobeController = {
  setNodes: (arr: ErebrusGlobeNode[]) => void;
  setSelected: (id: string) => void;
  destroy: () => void;
};

export function createNodeGlobe(
  canvas: HTMLCanvasElement,
  opts?: {
    nodes?: ErebrusGlobeNode[];
    selectedId?: string;
    getSelectedId?: () => string | undefined;
    onSelect?: (id: string) => void;
    onHover?: (id: string | null) => void;
    landDots?: Array<[number, number]>;
    aurora?: boolean;
    /** Globe radius as a fraction of the shorter canvas edge (default 0.38). */
    radiusScale?: number;
  }
): GlobeController;