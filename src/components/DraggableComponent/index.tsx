import { KonvaEventObject } from "konva/lib/Node";
import {
  Ellipse as ElipseProps,
  EllipseConfig,
} from "konva/lib/shapes/Ellipse";
import { useEffect, useRef } from "react";
import { Ellipse, KonvaNodeComponent } from "react-konva";
import { ComponentType } from "../../@types";

interface DraggableComponentProps {
  size: number;
  x: number;
  y: number;
  backToOrigin: boolean;
  onDragStart?: (event: KonvaEventObject<DragEvent>) => void;
  onDragMove?: (event: KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (event: ComponentType) => void;
  componentData?: ComponentType;
}

export const DraggableComponent = ({
  size,
  x,
  y,
  onDragEnd,
  onDragMove,
  onDragStart,
  backToOrigin = true,
  componentData,
}: DraggableComponentProps) => {
  const ref = useRef(null);

  useEffect(() => {
    console.log({ componentData });
  }, []);

  const handleDragEnd = (event: KonvaEventObject<DragEvent>) => {
    const newComponent = {
      position: {
        x: event.currentTarget.x(),
        y: event.currentTarget.y(),
      },
    } as ComponentType;

    console.log({
      componentData,
      newComponent,
      selectedComponent: componentData ?? newComponent,
    });

    onDragEnd(componentData ?? newComponent);
    if (backToOrigin) {
      ref?.current?.position({
        x,
        y,
      });
    }
  };

  return (
    <>
      {backToOrigin && (
        <Ellipse
          ref={ref}
          radiusX={size}
          radiusY={size}
          stroke="black"
          strokeWidth={1.5}
          x={x}
          y={y}
        />
      )}
      <Ellipse
        ref={ref}
        radiusX={size}
        radiusY={size}
        stroke="black"
        strokeWidth={1.5}
        x={x}
        y={y}
        draggable
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={handleDragEnd}
      />
    </>
  );
};
