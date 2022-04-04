import { KonvaEventObject } from "konva/lib/Node";

export interface ComponentType {
  id: number;
  componentType: string;
  image: string;
  position: {
    x: number;
    y: number;
  };
}
