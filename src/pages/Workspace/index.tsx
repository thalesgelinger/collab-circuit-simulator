import { useEffect, useState } from "react";
import { Ellipse, Layer, Stage, Text } from "react-konva";
import { ComponentType } from "../../@types";
import { ActionsToolbar, DraggableComponent } from "../../components";
import { ComponentsToolbar } from "./ComponentsToolbar";
import styles from "./styles.module.scss";

export const Workspace = () => {
  const [circuit, setCircuit] = useState<ComponentType[]>([]);

  useEffect(() => {
    console.log({ circuit });
  }, [circuit]);

  const handleReleseComponent = (component: ComponentType) => {
    console.log({ componentDropped: component });
    setCircuit([component, ...circuit]);
  };

  return (
    <div className={styles.container}>
      <ActionsToolbar />
      <Stage width={window.innerWidth} height={window.innerHeight}>
        <Layer>
          {circuit.map((element, i) => {
            return (
              <Ellipse
                key={i}
                stroke="black"
                strokeWidth={1.5}
                radiusX={20}
                radiusY={20}
                draggable
                x={element.position.x}
                y={element.position.y}
                onDragEnd={console.log}
              />
            );
          })}
          <ComponentsToolbar onReleaseComponent={handleReleseComponent} />
        </Layer>
      </Stage>
    </div>
  );
};
