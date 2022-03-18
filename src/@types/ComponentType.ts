import { KonvaEventObject } from "konva/lib/Node";

export interface ComponentType {
  id: number;
  componentType: string;
  position: {
    x: number;
    y: number;
  };
}
