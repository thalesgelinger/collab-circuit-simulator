import { ElementRef, useEffect, useRef, useState } from "react";
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
import { app } from "../../services/firebase";
import { getDatabase, onValue, ref, set } from "firebase/database";
import { Position } from "../../@types/ComponentType";

type WiresHandle = ElementRef<typeof Wires>;

export const Workspace = () => {
  const [circuit, setCircuit] = useState<ComponentType[]>([]);
  const blockSnapSize = 20;
  const snapPosition = useSnapToGrid(blockSnapSize);

  const [currentAction, setCurrentAction] = useState("");

  const wireRef = useRef<WiresHandle>(null);

  const [nodes, setNodes] = useState(0);

  // const { user } = useAuth();

  useEffect(() => {
    if (circuit.length) {
      console.log({ circuit });
      const db = getDatabase();
      set(ref(db, "circuits"), { circuit });
    }
  }, [circuit]);

  useEffect(() => {
    const db = getDatabase(app);
    const starCountRef = ref(db, "circuits");
    onValue(starCountRef, (snapshot) => {
      const { circuit } = snapshot.val();
      setCircuit(circuit);
    });
  }, []);

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

    setCircuit((circuit) => {
      const circuitCopy = [...circuit];
      const indexOfComponent = circuit.findIndex(
        ({ id }) => id === componentId
      );
      circuitCopy[indexOfComponent].position = snapedPosition;
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
      image: event.image,
      componentType: event.componentType,
      value: event.value,
      name: getComponentNameByType(event.componentType),
    } as ComponentType;
    setCircuit([component, ...circuit]);
  };

  const getComponentNameByType = (type: string) => {
    const types = {
      resistor: "R",
      dc_source: "V",
    } as { [key: string]: string };

    const numberOfThisComponentTypeInCircuit =
      circuit.filter((component) => {
        return component.componentType === type;
      }).length + 1;

    return types[type] + numberOfThisComponentTypeInCircuit;
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
      //runs on start
      const { x, y } = getPointerPositionByEvent(evt);
      const from = snapPosition(x, y);
      const newWire = { from } as Wire;
      setWire(newWire);
      return;
    }

    if (wireHasConnectedToComponent(wire)) {
      //runs on end
      const componentConnectedFrom = findComponentByWirePosition(wire.from);
      const componentConnectedTo = findComponentByWirePosition(wire.to);

      const { isNegative, isPositive } = findTerminalConnected(
        componentConnectedTo.position,
        wire.to
      );

      const connectedNode = isPositive ? "positive" : "negative";

      if (!!componentConnectedTo?.nodes?.[connectedNode]) {
        console.log("FOI NO IF");
        addConnectionBetweenComponents(
          componentConnectedFrom,
          componentConnectedTo,
          wire
        );
      } else {
        console.log("FOI NO ELSE");
        addConnectionBetweenComponents(
          componentConnectedTo,
          componentConnectedFrom,
          wire
        );
      }

      setNodes(nodes + 1);
      setWire({} as Wire);
      setWires([...wires, points]);
      return;
    }

    if (wireConnectedToOtherWire(wire.to)) {
      console.log("É UMA JUNÇÃO");
    }

    setWires([...wires, points]);
    setWire({ from: wire.to } as Wire);
  };

  const addConnectionBetweenComponents = (
    componentFrom: ComponentType,
    componentTo: ComponentType,
    wire: Wire
  ) => {
    const componentToWithNode = addNodeToComponent(componentTo, wire.to)!;

    const { isPositive } = findTerminalConnected(
      componentToWithNode.position,
      wire.to
    );

    const nodeConnectedToWireTo = isPositive
      ? componentToWithNode.nodes.positive
      : componentToWithNode.nodes.negative;

    const { isNegative } = findTerminalConnected(
      componentFrom.position,
      wire.from
    );

    const nodeConnectedFrom = isNegative ? "negative" : "positive";

    componentFrom = {
      ...componentFrom,
      nodes: {
        ...componentFrom.nodes,
        [nodeConnectedFrom]: nodeConnectedToWireTo,
      },
    };

    setCircuit((circuit) => {
      const circuitCopy = [...circuit];
      const indexOfComponent = circuit.findIndex(
        ({ id }) => id === componentFrom.id
      );
      circuitCopy[indexOfComponent] = componentFrom;
      return circuitCopy;
    });
  };

  const wireHasConnectedToComponent = (wire: Wire) => {
    const hasArrived = circuit.some((component) => {
      const xMaxRange = component.position.x + blockSnapSize * 2;
      const xMinRange = component.position.x;
      const yRange = component.position.y + blockSnapSize; // Y must be exactly this one when default rotatio
      const isPositiveTerminal = wire.to.x == xMinRange;
      const isNegativeTerinal = xMaxRange == wire.to.x;
      const arrivedX = isNegativeTerinal || isPositiveTerminal;
      const arrivedY = yRange === wire.to.y;
      return arrivedX && arrivedY;
    });
    return hasArrived;
  };

  const addNodeToComponent = (component: ComponentType, wirePos: Position) => {
    if (!component) {
      return;
    }

    component.nodes = getNegativeAndPositiveNodes(component, wirePos);

    setCircuit((circuit) => {
      const circuitCopy = [...circuit];
      const indexOfComponent = circuit.findIndex(
        ({ id }) => id === component.id
      );
      circuitCopy[indexOfComponent] = component;
      return circuitCopy;
    });
    return component;
  };

  const getNegativeAndPositiveNodes = (
    component: ComponentType,
    wirePos: Position
  ) => {
    const { isNegative, isPositive } = findTerminalConnected(
      component.position,
      wirePos
    );

    const negative = !!component?.nodes?.negative
      ? component?.nodes?.negative
      : isNegative
      ? nodes.toString()
      : "";

    const positive = !!component?.nodes?.positive
      ? component?.nodes?.positive
      : isPositive
      ? nodes.toString()
      : "";

    return { negative, positive };
  };

  const wireConnectedToOtherWire = (wirePosition: Position) => {
    console.log("ENTROU  PRA VERIFICAR");

    const isWireConnectedToOtherWire = wireRef.current?.wires.some((line) => {
      return line.some((v, i) => {
        return v === wirePosition.x && line[i + 1] === wirePosition.y;
      });
    });
    return isWireConnectedToOtherWire;
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

  const findComponentByWirePosition = (wirePosition: Position) => {
    return circuit.find(({ position }) => isConnected(position, wirePosition));
  };

  const isConnected = (componentPos: Position, wirePos: Position) => {
    const { isNegative, isPositive } = findTerminalConnected(
      componentPos,
      wirePos
    );

    const isConnectedOnX = isPositive || isNegative;
    const isConnectedOnY = componentPos.y + blockSnapSize === wirePos.y;

    return isConnectedOnX && isConnectedOnY;
  };

  const findTerminalConnected = (componentPos: Position, wirePos: Position) => {
    const isNegative = componentPos.x === wirePos.x;
    const isPositive = componentPos.x + blockSnapSize * 2 === wirePos.x;
    return { isPositive, isNegative };
  };

  return (
    <div className={styles.container}>
      <ActionsToolbar onActionChange={setCurrentAction} circuit={circuit} />
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
          <Wires ref={wireRef} onWireUpdate={() => {}} />
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
