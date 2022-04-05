import { KonvaEventObject } from "konva/lib/Node";
import { ElementRef, useEffect, useRef } from "react";
import { Image } from "react-konva";
import { ComponentType } from "../../@types";
import useImage from "use-image";

interface DraggableComponentProps {
  size: number;
  x: number;
  y: number;
  backToOrigin?: boolean;
  onDragStart?: (event: KonvaEventObject<DragEvent>) => void;
  onDragMove?: (event: KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (event: ComponentType) => void;
  componentData?: ComponentType;
}

export const DraggableComponent = (props: DraggableComponentProps) => {
  const {
    size,
    x,
    y,
    onDragEnd,
    onDragMove,
    onDragStart,
    backToOrigin = true,
    componentData,
  } = props;

  const ref = useRef<any>();

  const [image] = useImage(componentData!.image);

  const handleDragEnd = (event: KonvaEventObject<DragEvent>) => {
    const position = {
      x: event.currentTarget.x(),
      y: event.currentTarget.y(),
    };

    const newComponent = {
      position,
    } as ComponentType;

    if (!!onDragEnd) {
      onDragEnd(componentData ?? newComponent);
    }

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
        <Image image={image} height={size * 2} width={size * 2} x={x} y={y} />
      )}
      <Image
        image={image}
        ref={ref}
        height={size * 2}
        width={size * 2}
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
