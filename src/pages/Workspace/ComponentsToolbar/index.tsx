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

const toolbarHeight = window.innerHeight * 0.8275;

const TOOLBAR_DIMENSIONS = {
  width: 3 * ITEM_SIZE,
  height: toolbarHeight,
  marginTop: (window.innerHeight - toolbarHeight) / 2,
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
      componentType: "dc_source",
      image: components.dc_source,
      value: "5",
      angle: 90,
    } as ComponentType,
    // {
    //   componentType: "ac_source",
    //   image: components.ac_source,
    //   value: "0",
    //   angle: 90,
    // } as ComponentType,
    {
      componentType: "pulse_source",
      image: components.pulse_source,
      value: "PULSE (0 0 0 0 0 0 0 0)",
      angle: 90,
    } as ComponentType,
    {
      componentType: "resistor",
      image: components.resistor,
      value: "100",
      angle: 90,
    } as ComponentType,
    {
      componentType: "capacitor",
      image: components.capacitor,
      value: "1u",
      angle: 90,
    } as ComponentType,
    {
      componentType: "inductor",
      image: components.inductor,
      value: "100H",
      angle: 90,
    } as ComponentType,
    // {
    //   componentType: "inductor",
    //   image: components.diode,
    //   value: "100H",
    //   angle: 90,
    // } as ComponentType,
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
          x={horizontalToolbarCenter + i + ITEM_SIZE * 2.5}
          y={toolbarDistanceFromTop + 10 + i * componentsYFactor}
          onDragStart={handleComponentDragEnd(component)}
          onDragMove={handleComponentDragMove(component)}
          onDragEnd={onComponentDragEnd}
        />
      ))}
    </>
  );
};
