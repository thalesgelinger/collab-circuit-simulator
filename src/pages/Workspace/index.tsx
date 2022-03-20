import { ElementRef, useRef, useState } from "react";
import { Layer, Stage } from "react-konva";
import { KonvaEventObject } from "konva/lib/Node";
import { Vector2d } from "konva/lib/types";
import { ComponentType } from "../../@types";
import { ActionsToolbar } from "../../components";
import { ComponentsToolbar, DraggableComponentType } from "./ComponentsToolbar";
import styles from "./styles.module.scss";
import { Grid } from "./Grid";
import { useSnapToGrid } from "../../hooks";
import { Wire, Wires } from "./Wires";
import { Circuit } from "./Circuit";
import { useAuth } from "../../hooks/useAuth";

type WiresHandle = ElementRef<typeof Wires>;

export const Workspace = () => {
  const [circuit, setCircuit] = useState<ComponentType[]>([]);
  const blockSnapSize = 20;
  const snapPosition = useSnapToGrid(blockSnapSize);

  const [currentAction, setCurrentAction] = useState("");

  const wireRef = useRef<WiresHandle>(null);

  const { user } = useAuth();

  const handleDragMove = (
    e: KonvaEventObject<DragEvent>,
    component = {} as ComponentType
  ) => {
    const componentId = component?.id ?? circuit.length;
    e.currentTarget.moveToTop();

    const snapedPosition = snapPosition(
      e.currentTarget.x(),
      e.currentTarget.y()
    );

    e.currentTarget.position(snapedPosition);

    const newComponent = {
      id: componentId,
      position: snapedPosition,
    } as ComponentType;

    setCircuit((circuit) => {
      const circuitCopy = [...circuit];
      const indexOfComponent = circuit.findIndex(
        ({ id }) => id === componentId
      );
      circuitCopy[indexOfComponent] = newComponent;
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

  const handleDragRelease = (component = {} as ComponentType) => {
    const componentId = component?.id ?? circuit.length;

    return (component: ComponentType) => {
      const setNewComponetId = (circuit: ComponentType[]) => {
        const circuitCopy = [...circuit];
        const indexOfComponent = circuit.findIndex(
          ({ id }) => id === componentId
        );
        circuitCopy[indexOfComponent] = { ...component, id: componentId };
        return circuitCopy;
      };
      setCircuit(setNewComponetId);
    };
  };

  const handleStageClick = (evt: KonvaEventObject<MouseEvent>) => {
    const isDrawEnable = currentAction !== "edit" && !wireRef?.current;

    if (isDrawEnable) {
      return;
    }

    const { wire, wires, setWire, setWires, points } =
      wireRef.current as WiresHandle;

    if (!wire?.from) {
      const { x, y } = getPointerPositionByEvent(evt);
      const from = snapPosition(x, y);
      const newWire = { from } as Wire;

      setWire(newWire);
      return;
    }

    if (wireHasConnectedToComponent(wire)) {
      setWire({} as Wire);
      setWires([...wires, points]);
      return;
    }
    setWires([...wires, points]);
    setWire({ from: wire.to } as Wire);
  };

  const wireHasConnectedToComponent = (wire: Wire) => {
    const hasArrived = circuit.some((component) => {
      const xMaxRange = component.position.x + blockSnapSize;
      const xMinRange = component.position.x - blockSnapSize;
      const yMaxRange = component.position.y + blockSnapSize;
      const yMinRange = component.position.y - blockSnapSize;
      const arrivedX = xMaxRange >= wire.to.x && wire.to.x >= xMinRange;
      const arrivedY = yMaxRange >= wire.to.y && wire.to.y >= yMinRange;
      return arrivedX && arrivedY;
    });
    return hasArrived;
  };

  const handleStageMouseMove = (evt: KonvaEventObject<MouseEvent>) => {
    if (!wireRef.current?.wire?.from) {
      return;
    }
    const { x, y } = getPointerPositionByEvent(evt);
    const to = snapPosition(x, y);
    wireRef.current?.setWire((wire) => ({ ...wire, to }));
  };

  const getPointerPositionByEvent = (evt: KonvaEventObject<MouseEvent>) => {
    const stage = evt.target.getStage();
    const position = stage?.getPointerPosition() as Vector2d;
    return position;
  };

  return (
    <div className={styles.container}>
      <ActionsToolbar onActionChange={setCurrentAction} />
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onClick={handleStageClick}
        onMouseMove={handleStageMouseMove}
      >
        <Layer>
          <Grid blockSnapSize={blockSnapSize} />
        </Layer>
        <Layer>
          <Circuit
            components={circuit}
            onComponentMoving={handleDragMove}
            onComponentDroped={handleDragRelease}
          />
          <Wires ref={wireRef} />
          <ComponentsToolbar
            onComponentDragStart={handleDragStart}
            onComponentDragMove={handleDragMove}
            onComponentDragEnd={handleDragRelease}
          />
        </Layer>
      </Stage>
    </div>
  );
};
