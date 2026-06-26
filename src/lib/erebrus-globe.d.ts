export type ErebrusGlobeNode = {
  id: string;
  lat: number;
  lng: number;
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
    aurora?: boolean;
  }
): GlobeController;

export function createHeroGlobe(
  canvas: HTMLCanvasElement,
  opts?: {
    nodes?: ErebrusGlobeNode[];
    hubId?: string;
  }
): GlobeController;