import { KonvaEventObject } from "konva/lib/Node";
import { Component, useEffect, useState } from "react";
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
    setCircuit([component, ...circuit]);
  };

  const handleDragEnd = (index: number) => {
    return (component: ComponentType) => {
      setCircuit((circuit) => {
        const circuitCopy = [...circuit];
        circuitCopy[index] = component;
        return circuitCopy;
      });
    };
  };

  return (
    <div className={styles.container}>
      <ActionsToolbar />
      <Stage width={window.innerWidth} height={window.innerHeight}>
        <Layer>
          {circuit.map((element, i) => {
            return (
              <DraggableComponent
                key={i}
                size={20}
                x={element.position.x}
                y={element.position.y}
                onDragEnd={handleDragEnd(i)}
                backToOrigin={false}
              />
            );
          })}
          <ComponentsToolbar onReleaseComponent={handleReleseComponent} />
        </Layer>
      </Stage>
    </div>
  );
};
