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

const ITEM_SIZE = 20;

const TOOLBAR_DIMENSIONS = {
  width: 4 * ITEM_SIZE,
  height: window.innerHeight * 0.8,
  marginTop: window.innerHeight * 0.1,
};

export const Toolbar = ({
  onComponentDragEnd,
  onComponentDragMove,
  onComponentDragStart,
  showTools,
}: ToolbarProps) => {
  return (
    <Layer>
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
  );
};
