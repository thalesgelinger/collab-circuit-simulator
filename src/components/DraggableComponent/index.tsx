import { KonvaEventObject } from "konva/lib/Node";
import { ElementRef, useEffect, useRef } from "react";
import { Image, Text } from "react-konva";
import { ComponentType } from "../../@types";
import useImage from "use-image";
import { Html } from "react-konva-utils";

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

  const editComponentLabel = () => {};

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
      {componentData?.name && (
        <Text
          text={componentData?.name}
          x={x}
          y={y - 5}
          fontSize={14}
          onDblClick={editComponentLabel}
        />
      )}

      {componentData?.name && (
        <Html
          divProps={{
            style: {
              position: "absolute",
              top: 10,
              left: 10,
            },
          }}
        >
          <input type="text" />
        </Html>
      )}
    </>
  );
};
