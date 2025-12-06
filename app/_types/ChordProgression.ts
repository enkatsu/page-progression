export interface ChordNode {
  id: string;
}

export interface ChordLink {
  source: string;
  target: string;
  weight: number;
}

export interface ChordProgressionData {
  name: string;
  description: string;
  nodes: ChordNode[];
  links: ChordLink[];
}

export interface NextChordOption {
  chord: string;
  weight: number;
}
