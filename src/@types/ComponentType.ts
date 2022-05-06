import { ToolsTypes } from "./ToolsTypes";

export interface Position {
  x: number;
  y: number;
}

type ComponentsKeys = keyof ComponentsTypes | keyof ToolsTypes;
interface ComponentsTypes {
  resistor: ResistorNodes;
  dc_source: VoltageSourceNodes;
  capacitor: CapacitorNodes;
  transistor: TransistorNodes;
}

interface ResistorNodes {
  positive: string;
  negative: string;
}

interface CapacitorNodes {
  positive: string;
  negative: string;
}

interface VoltageSourceNodes {
  positive: string;
  negative: string;
}

interface TransistorNodes {
  base: number;
  coletor: string;
  emisor: string;
}

export type ComponentType = {
  componentType: ComponentsKeys;
  id: number;
  image: string;
  position: Position;
  name: string;
  value: string;
  angle: 0 | 90 | 180 | 270;
  nodes: {
    [key in keyof ResistorNodes]: {
      value: ResistorNodes[key];
      position: Position;
    };
  };
};
