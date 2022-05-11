import { KonvaEventObject } from "konva/lib/Node";
import { ComponentType } from "../../../@types";
import { DraggableComponent } from "../../../components";

interface CircuitProps {
  components: ComponentType[];
  onComponentMoving: (
    event: KonvaEventObject<DragEvent>,
    component: ComponentType
  ) => void;
  onComponentDroped: (component: ComponentType) => void;
  onClickComponent: (component: ComponentType) => void;
}

export const Circuit = (props: CircuitProps) => {
  const { components, onComponentMoving, onComponentDroped, onClickComponent } =
    props;

  const handleComponentMove =
    (component: ComponentType) => (event: KonvaEventObject<DragEvent>) => {
      onComponentMoving(event, component);
    };
  const handleComponentDrop = (component: ComponentType) => () => {
    onComponentDroped(component);
  };

  return (
    <>
      {components.map((component) => {
        return (
          <DraggableComponent
            key={component.id}
            componentData={component}
            size={20}
            x={component.position.x}
            y={component.position.y}
            onDragMove={handleComponentMove(component)}
            onDragEnd={handleComponentDrop(component)}
            backToOrigin={false}
            onClickComponent={onClickComponent}
          />
        );
      })}
    </>
  );
};
