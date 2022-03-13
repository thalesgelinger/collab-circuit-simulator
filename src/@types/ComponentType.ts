import { KonvaEventObject } from "konva/lib/Node";

export interface ComponentType {
  componentType: string;
  position: {
    x: number;
    y: number;
  };
}
