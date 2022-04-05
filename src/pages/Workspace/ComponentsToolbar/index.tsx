import { KonvaEventObject } from "konva/lib/Node";
import { Rect, KonvaNodeComponent, Ellipse } from "react-konva";
import { ComponentType } from "../../../@types";
import res from "../../../assets/components/resistor.svg";
import useImage from "use-image";
import { Image as ImageProps, ImageConfig } from "konva/lib/shapes/Image";
import { useEffect, useRef, useState } from "react";
import {
  Ellipse as EllipseProp,
  EllipseConfig,
} from "konva/lib/shapes/Ellipse";
import { DraggableComponent } from "../../../components";

type DraggableComponentType = KonvaEventObject<DragEvent> & ComponentType;

interface ComponentsToolbarProps {
  onComponentDragStart: (event: DraggableComponentType) => void;
  onComponentDragMove: (event: DraggableComponentType) => void;
  onComponentDragEnd: (event: ComponentType) => void;
}

const ITEM_SIZE = 20;

const TOOLBAR_DIMENSIONS = {
  width: 4 * ITEM_SIZE,
  height: window.innerHeight * 0.8,
  marginTop: window.innerHeight * 0.1,
};

const ToolbarShape = () => {
  return (
    <Rect
      x={window.innerWidth - TOOLBAR_DIMENSIONS.width}
      y={TOOLBAR_DIMENSIONS.marginTop}
      width={window.innerWidth}
      height={TOOLBAR_DIMENSIONS.height}
      fill="rgba(116, 116, 116, 0.1647)"
      cornerRadius={16}
    />
  );
};

export const ComponentsToolbar = ({
  onComponentDragStart,
  onComponentDragMove,
  onComponentDragEnd,
}: ComponentsToolbarProps) => {
  const itemSize = 20;

  const componentsUseful: ComponentType[] = [
    {
      componentType: "resistor",
      image:
        "https://firebasestorage.googleapis.com/v0/b/collab-circuit-simulator.appspot.com/o/components%2Fresistor.png?alt=media&token=06358d60-8076-4975-b787-22ed1d5491a0",
    } as ComponentType,
    {
      componentType: "resistor",
      image:
        "https://firebasestorage.googleapis.com/v0/b/collab-circuit-simulator.appspot.com/o/components%2Fcc.png?alt=media&token=9d55d4a3-011c-4613-8a85-62dcf0162a62",
    } as ComponentType,
    {
      componentType: "resistor",
      image:
        "https://firebasestorage.googleapis.com/v0/b/collab-circuit-simulator.appspot.com/o/components%2Fresistor.png?alt=media&token=06358d60-8076-4975-b787-22ed1d5491a0",
    } as ComponentType,
  ];

  const [draggableComponents, setDraggableComponents] =
    useState(componentsUseful);
  const horizontalToolbarCenter = window.innerWidth - itemSize * 3;

  const toolbarDistanceFromTop = TOOLBAR_DIMENSIONS.marginTop + itemSize;
  const componentsYFactor = Math.floor(
    TOOLBAR_DIMENSIONS.height / draggableComponents.length
  );

  const handleComponentDragEnd = (component: ComponentType) => {
    return (event: KonvaEventObject<DragEvent>) => {
      onComponentDragStart({
        ...component,
        ...event,
      });
    };
  };
  const handleComponentDragMove = (component: ComponentType) => {
    return (event: KonvaEventObject<DragEvent>) => {
      onComponentDragMove({
        ...component,
        ...event,
      });
    };
  };

  return (
    <>
      <ToolbarShape />
      {draggableComponents.map((component, i) => (
        <DraggableComponent
          componentData={component}
          key={i}
          size={itemSize}
          x={horizontalToolbarCenter + i}
          y={toolbarDistanceFromTop + i * componentsYFactor}
          onDragStart={handleComponentDragEnd(component)}
          onDragMove={handleComponentDragMove(component)}
          onDragEnd={onComponentDragEnd}
        />
      ))}
    </>
  );
};
