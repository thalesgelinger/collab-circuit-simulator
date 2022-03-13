import { KonvaEventObject } from "konva/lib/Node";
import { useRef } from "react";
import { Ellipse, KonvaNodeComponent } from "react-konva";
import { ComponentType } from "../../@types";

interface DraggableComponentProps extends KonvaNodeComponent<any, any> {
  size: number;
  x: number;
  y: number;
  backToOrigin: boolean;
  onDragEnd: (event: ComponentType) => void;
}

export const DraggableComponent = ({
  size,
  x,
  y,
  onDragEnd,
  backToOrigin = true,
  ...rest
}: DraggableComponentProps) => {
  const ref = useRef(null);

  const handleDragEnd = (event: KonvaEventObject<DragEvent>) => {
    const dataToSend = {
      position: {
        x: event.target.x(),
        y: event.target.y(),
      },
    } as ComponentType;
    onDragEnd(dataToSend);
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
        onDragEnd={handleDragEnd}
        {...rest}
      />
    </>
  );
};
