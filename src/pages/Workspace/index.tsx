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

  // useEffect(() => {
  //   if (circuit.length) {
  //     const db = getDatabase();
  //     set(ref(db, "circuits"), { circuit });
  //   }
  // }, [circuit]);

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

    const { wire, wires, setWire, setWires, points } = wireRef.current!;

    if (!wire?.from) {
      createWire(evt);
      return;
    }

    if (wireHasConnectedToComponent(wire)) {
      setWireNodeToEndComponent(wire);
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

  const createWire = (evt: KonvaEventObject<MouseEvent>) => {
    const { x, y } = getPointerPositionByEvent(evt);
    const from = snapPosition(x, y);
    const newWire = { from } as Wire;

    const { setWire, wires } = wireRef.current!;

    setWire(newWire);

    const component = findComponentByWirePosition(from);

    console.log({ component });

    if (!component) {
      return;
    }

    setWireNodeToComponent(from, component);
  };

  const setWireNodeToComponent = (
    wirePoint: Position,
    component: ComponentType
  ) => {
    const terminal = findTerminalConnectedToWire(component, wirePoint);

    if (!terminal) {
      return;
    }

    if (!!component?.nodes?.[terminal]) {
      return;
    }

    updateComponentTerminalNode({
      component,
      terminal,
      node: nodes.toString(),
    });

    setNodes(nodes + 1);
  };

  const findTerminalConnectedToWire = (
    { position }: ComponentType,
    wirePoint: Position
  ) => {
    const isNegative = position?.x === wirePoint.x;
    const isPositive = position?.x + blockSnapSize * 2 === wirePoint.x;
    if (isPositive) {
      return "positive";
    } else if (isNegative) {
      return "negative";
    } else {
      return;
    }
  };

  const updateComponentTerminalNode = ({
    component,
    terminal,
    node,
  }: {
    component: ComponentType;
    terminal: "negative" | "positive";
    node: string;
  }) => {
    setCircuit((circuit) => {
      const circuitCopy = [...circuit];
      const indexOfComponent = circuit.findIndex(
        ({ id }) => id === component.id
      );
      circuitCopy[indexOfComponent] = {
        ...circuitCopy[indexOfComponent],
        nodes: {
          ...circuitCopy[indexOfComponent]?.nodes,
          [terminal]: node,
        },
      };
      console.log(component.name, circuitCopy[indexOfComponent].nodes);
      return circuitCopy;
    });
  };

  const setWireNodeToEndComponent = (wire: Wire) => {
    const [endComponent, endTerminalConnected] =
      findComponentAndTerminalConnectedByWire(wire.to);

    const [initialComponent, initialTerminalConnected] =
      findComponentAndTerminalConnectedByWire(wire.from);

    if (!initialComponent && !initialTerminalConnected) {
      const wires = wireRef.current!.wires;

      const isCurrentWirePosition = (
        point: number,
        i: number,
        arr: number[]
      ) => {
        return point === wire.from.x && arr[i + 1] === wire.from.y;
      };

      const previousWireIndex = wires.findIndex((line) => {
        return line.some(isCurrentWirePosition);
      });

      const previousWireFromX = wires[previousWireIndex].findIndex(
        isCurrentWirePosition
      );

      const previousWireFromY = previousWireFromX + 1;

      setWireNodeToEndComponent({
        ...wire,
        from: {
          x: wires[previousWireIndex][previousWireFromX - 2],
          y: wires[previousWireIndex][previousWireFromY - 2],
        },
      });
    }

    const hasTerminal = !!endComponent?.nodes?.[endTerminalConnected];

    if (!initialComponent) {
      return;
    }

    if (!hasTerminal) {
      console.log("CONECTOU NO END");
      updateComponentTerminalNode({
        component: endComponent!,
        terminal: endTerminalConnected!,
        node: initialComponent!.nodes[initialTerminalConnected!],
      });
      return;
    } else {
      console.log("CONECTOU NO START");
      updateComponentTerminalNode({
        component: initialComponent!,
        terminal: initialTerminalConnected!,
        node: endComponent!.nodes[initialTerminalConnected!],
      });
      setNodes(nodes - 1);
      return;
    }
  };

  const findComponentAndTerminalConnectedByWire = (wirePosition: Position) => {
    const component = findComponentByWirePosition(wirePosition);
    if (!component) {
      return [undefined, undefined];
    }
    const terminal = findTerminalConnectedToWire(component, wirePosition);
    return [component, terminal] as const;
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
