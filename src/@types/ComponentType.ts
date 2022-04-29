import { KonvaEventObject } from "konva/lib/Node";
import { ToolsTypes } from "./ToolsTypes";

export interface Position {
  x: number;
  y: number;
}

type ComponentsKeys = keyof ComponentsTypes | keyof ToolsTypes;
interface ComponentsTypes {
  resistor: ResistorNodes;
  transistor: TransistorNodes;
  dc_source: VoltageSourceNodes;
}

interface ResistorNodes {
  positive: string;
  negative: string;
}

interface VoltageSourceNodes {
  positive: string;
  negative: string;
}

interface TransistorNodes {
  base: string;
  coletor: string;
  emisor: string;
}

export interface ComponentType {
  componentType: ComponentsKeys;
  id: number;
  image: string;
  position: Position;
  name: string;
  value: string;
  nodes: ResistorNodes;
}
