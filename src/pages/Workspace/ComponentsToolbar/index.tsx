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

interface ComponentsToolbarProps {
  onReleaseComponent: (component: ComponentType) => void;
}

const ToolbarShape = () => {
  return (
    <Rect
      x={window.innerWidth - 80}
      y={80}
      width={100}
      height={528}
      fill="rgba(116, 116, 116, 0.1647)"
      cornerRadius={16}
    />
  );
};

export const ComponentsToolbar = ({
  onReleaseComponent,
}: ComponentsToolbarProps) => {
  const itemSize = 20;
  const componentsUseful = [...Array(6)].map(() => ({
    type: "circle",
  }));
  const [draggableComponents, setDraggableComponents] =
    useState(componentsUseful);
  const horizontalToolbarCenter = window.innerWidth - 40;
  const marginTop = 40;
  const toolbarDistanceFromTop = 80 + marginTop;
  const toolbarSize = 528;
  const componentsYFactor = Math.floor(
    toolbarSize / draggableComponents.length
  );

  const handleComponentDragEnd = (componentType: string) => {
    return (component: ComponentType) => {
      onReleaseComponent({
        ...component,
        componentType,
      });
    };
  };

  return (
    <>
      <ToolbarShape />
      {draggableComponents.map(({ type }, i) => (
        <DraggableComponent
          key={i}
          size={itemSize}
          x={horizontalToolbarCenter + i}
          y={toolbarDistanceFromTop + i * componentsYFactor}
          onDragEnd={handleComponentDragEnd("type")}
        />
      ))}
    </>
  );
};
