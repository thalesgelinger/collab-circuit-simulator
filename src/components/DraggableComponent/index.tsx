import { KonvaEventObject } from "konva/lib/Node";
import { useEffect, useRef } from "react";
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
    x: originX,
    y: originY,
    onDragEnd,
    onDragMove,
    onDragStart,
    backToOrigin = true,
    componentData,
  } = props;

  const ref = useRef(null);

  const x = originX;
  const y = originY;

  useEffect(() => {
    console.log({ componentData });
  }, []);

  const [image] = useImage(
    "https://firebasestorage.googleapis.com/v0/b/collab-circuit-simulator.appspot.com/o/components%2Fresistor.png?alt=media&token=06358d60-8076-4975-b787-22ed1d5491a0"
  );

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
