import { KonvaEventObject } from "konva/lib/Node";
import { Rect } from "react-konva";
import { ComponentType } from "../../../@types";
import { useState } from "react";
import { DraggableComponent } from "../../../components";
import { tools } from "../../../assets/simulation/tools";

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

const ToolsShape = () => {
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

export const Tools = ({
  onComponentDragStart,
  onComponentDragMove,
  onComponentDragEnd,
}: ComponentsToolbarProps) => {
  const itemSize = 20;

  const componentsUseful: ComponentType[] = [
    {
      componentType: "voltimeter",
      image: tools.voltimeter,
      value: "0",
      angle: 0,
    } as ComponentType,
    {
      componentType: "currentmeter",
      image: tools.currentmeter,
      value: "0",
      angle: 0,
    } as ComponentType,
    {
      componentType: "ohmmimeter",
      image: tools.ohmmimeter,
      value: "0",
      angle: 0,
    } as ComponentType,
    {
      componentType: "osciloscope",
      image: tools.osciloscope,
      value: "0",
      angle: 0,
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
      <ToolsShape />
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
