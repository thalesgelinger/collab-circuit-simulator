import { KonvaEventObject } from "konva/lib/Node";
import { Rect } from "react-konva";
import { ComponentType } from "../../../@types";
import { useState } from "react";
import { DraggableComponent } from "../../../components";
import { components } from "../../../assets/simulation/components";

export type DraggableComponentType = KonvaEventObject<DragEvent> &
  ComponentType;

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
      image: components.dc_source,
      value: "100",
    } as ComponentType,
    {
      componentType: "dc_source",
      image: components.resistor,
      value: "5",
    } as ComponentType,
    {
      componentType: "resistor",
      image: components.capacitor,
      value: "100",
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
