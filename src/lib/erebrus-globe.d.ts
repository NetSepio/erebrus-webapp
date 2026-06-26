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
    onSelect?: (id: string) => void;
    onHover?: (id: string | null) => void;
    landDots?: Array<[number, number]>;
    aurora?: boolean;
  }
): GlobeController;