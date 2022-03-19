import { useEffect, useMemo, useState } from "react";
import { Layer, Line, Stage } from "react-konva";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { KonvaEventObject } from "konva/lib/Node";
import { Vector2d } from "konva/lib/types";
import { ComponentType } from "../../@types";
import { ActionsToolbar, DraggableComponent } from "../../components";
import { RootState } from "../../services/redux/store";
import { ComponentsToolbar, DraggableComponentType } from "./ComponentsToolbar";
import styles from "./styles.module.scss";

interface Wire {
  from: Vector2d;
  to: Vector2d;
}

export const Workspace = () => {
  const [circuit, setCircuit] = useState<ComponentType[]>([]);
  const { innerHeight: height, innerWidth: width } = window;
  const blockSnapSize = 20;
  const [wire, setWire] = useState<Wire>({} as Wire);
  const [wires, setWires] = useState<number[][]>([]);
  const [currentAction, setCurrentAction] = useState("");
  const user = useSelector((state: RootState) => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user.isLogged) {
      navigate("/");
    }
  }, [user.isLogged]);

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

  const handleDragMove =
    (componentId = circuit.length) =>
    (e: KonvaEventObject<DragEvent>) => {
      e.currentTarget.moveToTop();

      const snapedPosition = snapPosition(
        e.currentTarget.x(),
        e.currentTarget.y()
      );

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
      setCircuit((circuit) => {
        const circuitCopy = [...circuit];
        const indexOfComponent = circuit.findIndex(
          ({ id }) => id === componentId
        );
        circuitCopy[indexOfComponent] = { ...component, id: componentId };
        return circuitCopy;
      });
    };

  const handleStageClick = (evt: KonvaEventObject<MouseEvent>) => {
    if (currentAction !== "edit") {
      return;
    }

    if (!wire?.from) {
      const stage = evt.target.getStage();
      const { x, y } = stage?.getPointerPosition() as Vector2d;
      const from = snapPosition(x, y);
      const newWire = { from } as Wire;

      setWire(newWire);
      return;
    }

    const hasArrivedComponent = circuit.some((component) => {
      const xMaxRange = component.position.x + blockSnapSize;
      const xMinRange = component.position.x - blockSnapSize;
      const yMaxRange = component.position.y + blockSnapSize;
      const yMinRange = component.position.y - blockSnapSize;
      const arrivedX = xMaxRange >= wire.to.x && wire.to.x >= xMinRange;
      const arrivedY = yMaxRange >= wire.to.y && wire.to.y >= yMinRange;
      return arrivedX && arrivedY;
    });

    if (hasArrivedComponent) {
      setWire({} as Wire);
      setWires([...wires, points]);
      return;
    }
    setWires([...wires, points]);
    setWire({ from: wire.to } as Wire);
  };

  const points = useMemo(() => {
    const from = {
      x: wire.from?.x,
      y: wire.from?.y,
    };

    const to = {
      x: wire.to?.x,
      y: wire.to?.y,
    };

    const dx = Math.abs(from?.x - to?.x);
    const dy = Math.abs(from?.y - to?.y);

    const getBigger = (numA: number, numB: number) =>
      numA > numB ? numA : numB;

    const getSmaller = (numA: number, numB: number) =>
      numA < numB ? numA : numB;

    const curveX = dx > dy ? getSmaller(from.x, to.x) : getBigger(from.x, to.x);
    const curveY = curveX === from.x ? to.y : from.y;

    const curve = {
      x: curveX,
      y: curveY,
    };

    const points = [];

    const hasCurve = curve?.x && curve?.y;

    from?.x && points.push(from.x);
    from?.y && points.push(from.y);
    hasCurve && points.push(curve.x);
    hasCurve && points.push(curve.y);
    to?.x && points.push(to.x);
    to?.y && points.push(to.y);

    return points;
  }, [wire]);

  const isConnectingComponents = !!wire?.from;

  const snapPosition = (x: number, y: number) => {
    const snapedPosition = {
      x: Math.round(x / blockSnapSize) * blockSnapSize,
      y: Math.round(y / blockSnapSize) * blockSnapSize,
    };
    return snapedPosition;
  };

  return (
    <div className={styles.container}>
      <ActionsToolbar onActionChange={setCurrentAction} />
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onClick={handleStageClick}
        onMouseMove={(evt: KonvaEventObject<MouseEvent>) => {
          if (!wire?.from) {
            return;
          }
          const stage = evt.target.getStage();
          const { x, y } = stage?.getPointerPosition() as Vector2d;
          const to = snapPosition(x, y);
          setWire((wire) => ({ ...wire, to }));
        }}
      >
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
          {wires.map((wirePoints, index) => {
            return (
              <Line
                key={index}
                points={wirePoints}
                stroke="#000"
                fill="#000"
                strokeWidth={3}
              />
            );
          })}
          {isConnectingComponents && (
            <Line points={points} stroke="#000" fill="#000" strokeWidth={3} />
          )}
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
