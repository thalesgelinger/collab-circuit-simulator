import { KonvaEventObject } from "konva/lib/Node";

export const pointerShape =
  (shape: string) => (e: KonvaEventObject<MouseEvent>) => {
    const container = e.target.getStage().container();
    container.style.cursor = shape;
  };
