import { KonvaEventObject } from "konva/lib/Node";
import { Component, useEffect, useMemo, useState } from "react";
import { Ellipse, Layer, Line, Stage, Text } from "react-konva";
import { ComponentType } from "../../@types";
import { ActionsToolbar, DraggableComponent } from "../../components";
import { ComponentsToolbar, DraggableComponentType } from "./ComponentsToolbar";
import styles from "./styles.module.scss";

export const Workspace = () => {
  const [circuit, setCircuit] = useState<ComponentType[]>([]);
  const { innerHeight: height, innerWidth: width } = window;
  const blockSnapSize = 20;

  const columns = useMemo(() => {
    const points = [];
    for (var i = 0; i < width / blockSnapSize; i++) {
      points.push([
        Math.round(i * blockSnapSize) + 0.5,
        0,
        Math.round(i * blockSnapSize) + 0.5,
        height,
      ]);
    }
    return points;
  }, []);

  const rows = useMemo(() => {
    const points = [];
    for (var i = 0; i < height / blockSnapSize; i++) {
      points.push([
        0,
        Math.round(i * blockSnapSize),
        width,
        Math.round(i * blockSnapSize),
      ]);
    }
    return points;
  }, []);

  const grid = {
    columns,
    rows,
  };

  useEffect(() => {
    console.log({ circuit });
  }, [circuit]);

  const handleDragMove =
    (componentId = circuit.length) =>
    (e: KonvaEventObject<DragEvent>) => {
      e.currentTarget.moveToTop();

      const snapedPosition = {
        x: Math.round(e.currentTarget.x() / blockSnapSize) * blockSnapSize,
        y: Math.round(e.currentTarget.y() / blockSnapSize) * blockSnapSize,
      };

      e.currentTarget.position(snapedPosition);

      const component = {
        id: componentId,
        position: { ...snapedPosition },
      } as ComponentType;

      setCircuit((circuit) => {
        const circuitCopy = [...circuit];
        const indexOfComponent = circuit.findIndex(
          ({ id }) => id === componentId
        );
        console.log({
          olcComponent: circuitCopy[indexOfComponent],
          newComponent: component,
        });
        circuitCopy[indexOfComponent] = component;
        return circuitCopy;
      });
    };

  const handleDragStart = (event: DraggableComponentType) => {
    const component = {
      position: {
        x: event.target.x(),
        y: event.target.y(),
      },
      id: circuit.length + 1,
    } as ComponentType;
    setCircuit([component, ...circuit]);
  };

  const handleDragRelease =
    (componentId = circuit.length) =>
    (component: ComponentType) => {
      console.log({ componentId });

      setCircuit((circuit) => {
        const circuitCopy = [...circuit];
        const indexOfComponent = circuit.findIndex(
          ({ id }) => id === componentId
        );
        console.log({ indexOfComponent, component });
        circuitCopy[indexOfComponent] = { ...component, id: componentId };
        return circuitCopy;
      });
    };

  return (
    <div className={styles.container}>
      <ActionsToolbar />
      <Stage width={window.innerWidth} height={window.innerHeight}>
        <Layer>
          {grid.columns.map((points, index) => (
            <Line key={index} points={points} stroke="#ddd" strokeWidth={0.5} />
          ))}
          {grid.rows.map((points, index) => (
            <Line key={index} points={points} stroke="#ddd" strokeWidth={0.5} />
          ))}
        </Layer>
        <Layer>
          {circuit.map((component, i) => {
            return (
              <DraggableComponent
                key={i}
                componentData={component}
                size={20}
                x={component.position.x}
                y={component.position.y}
                onDragMove={handleDragMove(component.id)}
                onDragEnd={handleDragRelease(component.id)}
                backToOrigin={false}
              />
            );
          })}
          <ComponentsToolbar
            onComponentDragStart={handleDragStart}
            onComponentDragMove={handleDragMove()}
            onComponentDragEnd={handleDragRelease()}
          />
        </Layer>
      </Stage>
    </div>
  );
};
