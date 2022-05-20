import { forwardRef, useImperativeHandle, useState } from "react";
import { Layer, Rect } from "react-konva";
import { Html } from "react-konva-utils";
import { ComponentType } from "../../../@types";
import { ComponentsToolbar } from "../ComponentsToolbar";
import { DraggableComponentType, Tools } from "../Tools";

interface ToolbarProps {
  onComponentDragStart: (event: DraggableComponentType) => void;
  onComponentDragMove: (event: DraggableComponentType) => void;
  onComponentDragEnd: (event: ComponentType) => void;
  showTools: boolean;
}

interface ToolbarHandler {
  hide: () => void;
  show: () => void;
}

export const Toolbar = forwardRef<ToolbarHandler, ToolbarProps>(
  (
    {
      onComponentDragEnd,
      onComponentDragMove,
      onComponentDragStart,
      showTools,
    },
    ref
  ) => {
    const [show, setShow] = useState(true);

    useImperativeHandle(ref, () => ({
      hide: () => {
        setShow(false);
      },
      show: () => {
        setShow(true);
      },
    }));

    return show ? (
      <Layer draggable={false}>
        {showTools ? (
          <Tools
            onComponentDragStart={onComponentDragStart}
            onComponentDragMove={onComponentDragMove}
            onComponentDragEnd={onComponentDragEnd}
          />
        ) : (
          <ComponentsToolbar
            onComponentDragStart={onComponentDragStart}
            onComponentDragMove={onComponentDragMove}
            onComponentDragEnd={onComponentDragEnd}
          />
        )}
      </Layer>
    ) : null;
  }
);
