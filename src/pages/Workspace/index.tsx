import {
  ElementRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Circle, Layer, Stage } from "react-konva";
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
import { Oscilloscope } from "./Oscilloscope";
import { useAuth } from "../../hooks/useAuth";
import { app } from "../../services/firebase";
import { getDatabase, onValue, ref, set } from "firebase/database";
import { ComponentsKeys, Position } from "../../@types/ComponentType";
import { Tools } from "./Tools";
import { Toolbar } from "./Toolbar";
import { Provider, useDispatch, useSelector } from "react-redux";
import { RootState, store } from "../../services/redux/store";
import {
  ActionTypes,
  SimulationState,
  updateCircuit,
  updateIntersection,
} from "../../services/redux/simulationSlice";
import { Html } from "react-konva-utils";
import { ProviderReturn } from "./ProviderReturn";

type WiresHandle = ElementRef<typeof Wires>;

type ActionsType = {
  [key: string]: (evt: KonvaEventObject<MouseEvent>) => void;
};

interface SnapshotType extends SimulationState {
  editedBy: number;
}

export const compareObjects = (obj1: object, obj2: object) => {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
};

export const Workspace = () => {
  const [circuit, setCircuit] = useState<ComponentType[]>([]);
  const [state, setState] = useState<RootState>({} as RootState);

  const blockSnapSize = 20;
  const snapPosition = useSnapToGrid(blockSnapSize);

  const [showTools, setShowTools] = useState(false);

  const wireRef = useRef<WiresHandle>(null);

  const dispatch = useDispatch();

  const [nodes, setNodes] = useState(1);

  const [action, setAction] = useState("");

  const [intersections, setIntersections] = useState<Position[]>([]);

  // const { user } = useAuth();

  const userId = useMemo(() => Math.random(), []);

  const lastEdited = useRef(userId);

  const db = getDatabase(app);

  useEffect(() => {
    console.log({ circuit });
    dispatch(updateCircuit(circuit));
    if (!!state.simulation) {
      const { simulation, ...rest } = state.simulation;

      if (!compareObjects(rest.circuit, circuit)) {
        console.log("SAO DIFERENTES");
        set(ref(db, "circuits"), {
          ...rest,
          circuit,
          editedBy: lastEdited.current,
        });
        lastEdited.current = userId;
      }
    }
  }, [circuit]);

  useEffect(() => {
    dispatch(updateIntersection(intersections));
    if (!!state.simulation) {
      const { simulation, ...rest } = state.simulation;

      if (!compareObjects(rest.intersections, intersections)) {
        set(ref(db, "circuits"), {
          ...rest,
          intersections,
          editedBy: lastEdited.current,
        });
        lastEdited.current = userId;
      }
    }
  }, [intersections]);

  useEffect(() => {
    const circuits = ref(db, "circuits");
    onValue(circuits, (snapshot) => {
      const response = snapshot.val() as SnapshotType;
      const currentUserDidTheLastChange = response?.editedBy === userId;

      const isWiresDifferent = !compareObjects(
        response?.wires,
        wireRef?.current?.wires
      );
      const shouldUpdateWires = !!response?.wires?.length && isWiresDifferent;

      const isIntersectionsDifferent = !compareObjects(
        response?.intersections,
        intersections
      );

      const shouldUpdateIntersections =
        !!response?.intersections && isIntersectionsDifferent;

      const isCooworkerWiresDifferent = !compareObjects(
        response?.cooworkerWires,
        wireRef.current?.cooworkerWires
      );

      const shouldUpdateCooworkerWires =
        !!response?.cooworkerWires?.length && isCooworkerWiresDifferent;

      if (!currentUserDidTheLastChange) {
        if (!!response?.circuit?.length) {
          lastEdited.current = response.editedBy;
          setCircuit(response.circuit);
        }

        if (shouldUpdateWires) {
          lastEdited.current = response.editedBy;
          wireRef.current?.setWires(response.wires);
        }

        if (shouldUpdateCooworkerWires) {
          lastEdited.current = response.editedBy;
          wireRef.current?.setCooworkerWires(response.cooworkerWires);
        }

        if (shouldUpdateIntersections) {
          lastEdited.current = response.editedBy;
          setIntersections(response.intersections);
        }
      }
    });
  }, []);

  const handleDragMove = useCallback(
    (e: KonvaEventObject<DragEvent>, component = {} as ComponentType) => {
      const componentId = component?.id ?? circuit.length;

      e.currentTarget.moveToTop();

      const snapedPosition = snapPosition(
        e.currentTarget.x(),
        e.currentTarget.y()
      );

      e.currentTarget.position(snapedPosition);

      const componentIndex = circuit.findIndex(({ id }) => id === componentId);

      if (componentIndex < 0) {
        return;
      }

      setCircuit((circuit) => {
        const circuitCopy = [...circuit];
        circuitCopy[componentIndex] = {
          ...circuitCopy[componentIndex],
          position: snapedPosition,
          nodes: getNodesByComponentRotation(
            circuitCopy[componentIndex],
            snapedPosition
          ),
        };
        return circuitCopy;
      });
    },
    [circuit]
  );

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
      angle: event.angle,
      nodes: {
        positive: {
          value: "",
          position: {
            x: event.target.x(),
            y: event.target.y() + blockSnapSize,
          },
        },
        negative: {
          value: isSource(event.componentType) ? "0" : "",
          position: {
            x: event.target.x() + blockSnapSize * 2,
            y: event.target.y() + blockSnapSize,
          },
        },
      },
    } as ComponentType;
    console.log({ component });
    setCircuit([component, ...circuit]);
  };

  const isSource = (type: string) => type.endsWith("_source");

  const getComponentNameByType = (type: string) => {
    const types = {
      dc_source: "V",
      ac_source: "V",
      pulse_source: "V",
      resistor: "R",
      capacitor: "C",
      inductor: "L",
      voltimeter: "VOLTMETER_",
      ohmmimeter: "OHMMIMETER",
      currentmeter: "CURRENT_",
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
    const actions = {
      edit,
    } as ActionsType;

    if (!!actions?.[action]) {
      actions[action](evt);
    }
  };

  const edit = (evt: KonvaEventObject<MouseEvent>) => {
    const { wire, wires, setWire, setWires, points } = wireRef.current!;

    if (!hasClickedToComponentTerminal(evt)) {
      console.log("NAO CONECTOU NO COMPONENTE IMBECIL");
    }

    if (!wire?.from) {
      createWire(evt);
      return;
    }

    if (wireHasConnectedToComponent(wire)) {
      console.log("DONE");
      setWireNodeToEndComponent(wire);
      setWire({} as Wire);
      setWires([...wires, points]);
      return;
    }

    if (wireConnectedToOtherWire(wire.to)) {
      console.log("É UMA JUNÇÃO");
      connectNodeToComponent(wire);
      setIntersections([...intersections, wire.to]);
      setWire({} as Wire);
      setWires([...wires, points]);
      return;
    }

    setWires([...wires, points]);
    setWire({ from: wire.to } as Wire);
  };

  const hasClickedToComponentTerminal = (evt: KonvaEventObject<MouseEvent>) => {
    const { x, y } = getPointerPositionByEvent(evt);
    const position = snapPosition(x, y);

    const hasConnected = circuit.some((component) => {
      const connectedToPositive =
        JSON.stringify(component.nodes.positive.position) ===
        JSON.stringify(position);
      const connectedToNegative =
        JSON.stringify(component.nodes.negative.position) ===
        JSON.stringify(position);

      return connectedToNegative || connectedToPositive;
    });

    return hasConnected;
  };

  const connectNodeToComponent = (wire: Wire) => {
    console.log("connectNodeToComponent");
    const [componentEnd, terminalEnd] = findNodeOnPrevWire(wire.to);
    console.log({ componentEnd, terminalEnd });
    const [component, terminal] = findNodeOnPrevWire(wire.from);
    console.log({ component, terminal });

    const newComponent = {
      component: component!,
      terminal: terminal!,
      node: componentEnd!.nodes[terminalEnd!].value,
    };

    console.log({ newComponent });
    updateComponentTerminalNode(newComponent);
  };

  const findNodeOnPrevWire = (
    wirePosition: Position
  ): readonly [ComponentType, "positive" | "negative"] => {
    console.log("findNodeOnPrevWire");
    const [component, terminal] =
      findComponentAndTerminalConnectedByWire(wirePosition)!;
    console.log("findNodeOnPrevWire:", { component, terminal });
    if (!component && !terminal) {
      const position = findInPrevWires(wirePosition, true);
      return findNodeOnPrevWire(position);
    }
    return [component!, terminal!] as const;
  };

  const rotate = (component: ComponentType) => {
    const angles = {
      0: 90,
      90: 180,
      180: 270,
      270: 0,
    } as { [key: number]: 0 | 90 | 180 | 270 };

    console.log({ componentAngle: component.angle });

    updateRotateNodes(component, angles[component.angle]);
  };

  const updateRotateNodes = (
    component: ComponentType,
    angle: 0 | 90 | 180 | 270
  ) => {
    const nodes = getNodesByComponentRotation({ ...component, angle });

    setCircuit((circuit) => {
      const circuitCopy = [...circuit];
      const indexOfComponent = circuit.findIndex(
        ({ id }) => id === component.id
      );
      circuitCopy[indexOfComponent] = {
        ...circuitCopy[indexOfComponent],
        angle,
        nodes,
      };
      return circuitCopy;
    });
  };

  const getNodesByComponentRotation = (
    { nodes, angle, position: componentPosition }: ComponentType,
    snapedPosition?: Position
  ) => {
    const position = snapedPosition ?? componentPosition;

    const rotation = {
      0: {
        positive: {
          value: nodes.positive.value,
          position: {
            x: position.x,
            y: position.y + blockSnapSize,
          },
        },
        negative: {
          value: nodes.negative.value,
          position: {
            x: position.x + blockSnapSize * 2,
            y: position.y + blockSnapSize,
          },
        },
      },
      90: {
        positive: {
          value: nodes.positive.value,
          position: {
            x: position.x - blockSnapSize,
            y: position.y,
          },
        },
        negative: {
          value: nodes.negative.value,
          position: {
            x: position.x - blockSnapSize,
            y: position.y + blockSnapSize * 2,
          },
        },
      },
      180: {
        positive: {
          value: nodes.positive.value,
          position: {
            x: position.x,
            y: position.y - blockSnapSize,
          },
        },
        negative: {
          value: nodes.negative.value,
          position: {
            x: position.x - blockSnapSize * 2,
            y: position.y - blockSnapSize,
          },
        },
      },
      270: {
        positive: {
          value: nodes.positive.value,
          position: {
            x: position.x + blockSnapSize,
            y: position.y,
          },
        },
        negative: {
          value: nodes.negative.value,
          position: {
            x: position.x + blockSnapSize,
            y: position.y - blockSnapSize * 2,
          },
        },
      },
    };

    return rotation[angle];
  };

  const removeComponent = ({ id }: ComponentType) => {
    const circuitWithComponentRemoved = circuit.filter(
      (component) => component.id !== id
    );
    setCircuit(circuitWithComponentRemoved);
  };

  const createWire = (evt: KonvaEventObject<MouseEvent>) => {
    const { x, y } = getPointerPositionByEvent(evt);
    const from = snapPosition(x, y);
    const newWire = { from } as Wire;

    const { setWire } = wireRef.current!;

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

    if (!!component?.nodes?.[terminal]?.value) {
      return;
    }

    console.log({ component, terminal, node: nodes.toString() });

    console.log("setWireNodeToComponent:");
    updateComponentTerminalNode({
      component,
      terminal,
      node: nodes.toString(),
    });

    setNodes(nodes + 1);
  };

  const findTerminalConnectedToWire = (
    { nodes: { negative, positive } }: ComponentType,
    { x, y }: Position
  ) => {
    const isNegative = negative.position?.x === x && negative.position?.y === y;

    const isPositive = positive.position?.x === x && positive.position?.y === y;

    console.log({ negative, positive, x, y });

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
          [terminal]: {
            value: node,
            position: circuitCopy[indexOfComponent]?.nodes[terminal].position,
          },
        },
      };
      console.log(component.name, circuitCopy[indexOfComponent].nodes);
      return circuitCopy;
    });
  };

  const setWireNodeToEndComponent = (wire: Wire) => {
    const [endComponent, endTerminalConnected] =
      findComponentAndTerminalConnectedByWire(wire.to);

    if (!endTerminalConnected) {
      return;
    }

    const [initialComponent, initialTerminalConnected] =
      findComponentAndTerminalConnectedByWire(wire.from);

    console.log({ initialComponent, initialTerminalConnected });

    if (!initialComponent && !initialTerminalConnected) {
      const from = findInPrevWires(wire.from);
      setWireNodeToEndComponent({
        ...wire,
        from,
      });
    }

    const hasTerminal = !!endComponent?.nodes?.[endTerminalConnected]?.value;

    if (!initialComponent) {
      return;
    }

    console.log({ initialComponent, initialTerminalConnected });

    if (!hasTerminal) {
      console.log("CONECTOU NO END");
      updateComponentTerminalNode({
        component: endComponent!,
        terminal: endTerminalConnected!,
        node: initialComponent!.nodes[initialTerminalConnected!].value,
      });
      return;
    } else {
      console.log("CONECTOU NO START");
      updateComponentTerminalNode({
        component: initialComponent!,
        terminal: initialTerminalConnected!,
        node: endComponent!.nodes[initialTerminalConnected!].value,
      });
      setNodes(nodes - 1);
      return;
    }
  };

  const findInPrevWires = (wirePosition: Position, isBetween = false) => {
    const wires = mappedWirePointsArray();

    const findFunction = isBetween
      ? isPointBetweenWires(wirePosition)
      : isCurrentWirePosition(wirePosition);

    const currentWireIndex = wires?.findIndex((line) => {
      return line.some(findFunction);
    });

    console.log("INDICE DO SEGUNDO ARRAY");
    const currentWirePointIndex =
      wires[currentWireIndex]?.findIndex(findFunction);

    console.log({
      currentWireIndex,
      wires,
      wirePosition,
      currentWirePointIndex,
    });

    const prevIndex =
      currentWirePointIndex <= 0 ? 0 : currentWirePointIndex - 1;

    return {
      x: wires[currentWireIndex][prevIndex].x,
      y: wires[currentWireIndex][prevIndex].y,
    };
  };

  const findComponentAndTerminalConnectedByWire = (wirePosition: Position) => {
    const component = findComponentByWirePosition(wirePosition);
    if (!component) {
      return [undefined, undefined];
    }
    const terminal = findTerminalConnectedToWire(component, wirePosition)!;
    return [component, terminal] as const;
  };

  const wireHasConnectedToComponent = (wire: Wire) => {
    const hasConnected = circuit.some((component) => {
      const connectedToPositive =
        JSON.stringify(component.nodes.positive.position) ===
        JSON.stringify(wire.to);
      const connectedToNegative =
        JSON.stringify(component.nodes.negative.position) ===
        JSON.stringify(wire.to);

      return connectedToNegative || connectedToPositive;
    });
    return hasConnected;
  };

  const wireConnectedToOtherWire = ({ x, y }: Position) => {
    console.log("ENTROU  PRA VERIFICAR");
    const isWireConnectedToOtherWire = mappedWirePointsArray()!.some((line) => {
      return line.some(isPointBetweenWires({ x, y }));
    });

    return isWireConnectedToOtherWire;
  };

  const isCurrentWirePosition =
    (wirePosition: Position) => (point: Position) => {
      return compareObjects(point, wirePosition);
    };

  const isPointBetweenWires =
    ({ x, y }: Position) =>
    (prevPoint: Position, index: number, line: Position[]) => {
      const nextPoint = line[index + 1];
      const isConnectedOnX = prevPoint?.x >= x && x >= nextPoint?.x;
      const isConnectedOnY = prevPoint?.y >= y && y >= nextPoint?.y;
      const isConnected = isConnectedOnX && isConnectedOnY;
      console.log("OrdenNomal:", index, { isConnectedOnX, isConnectedOnY });
      if (!isConnected) {
        const isConnectedOnX = prevPoint?.x <= x && x <= nextPoint?.x;
        const isConnectedOnY = prevPoint?.y <= y && y <= nextPoint?.y;
        console.log("OrdenInversa", index, { isConnectedOnX, isConnectedOnY });
        return isConnectedOnX && isConnectedOnY;
      }
      return isConnected;
    };

  const mappedWirePointsArray = () =>
    wireRef.current?.wires.map((line) => {
      let lineMappedToPosition = [];
      for (let i = 0; i < line.length; i += 2) {
        lineMappedToPosition.push({
          x: line[i],
          y: line[i + 1],
        });
      }
      return lineMappedToPosition;
    });

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
    const component = circuit.find((component) => {
      console.log("component inside the finder", { component, wirePosition });

      const connectedToPositive = compareObjects(
        component.nodes.positive.position,
        wirePosition
      );
      const connectedToNegative = compareObjects(
        component.nodes.negative.position,
        wirePosition
      );
      console.log({ connectedToNegative, connectedToPositive });
      return connectedToNegative || connectedToPositive;
    });
    console.log("findComponentByWirePosition:", { component });
    return component;
  };

  const handleComponentClick = (component: ComponentType) => {
    console.log({ component });

    const actions = {
      rotate,
      remove,
    } as {
      [key: string]: (component: ComponentType) => void;
    };

    if (!!actions?.[action]) {
      actions[action](component);
    }
  };

  const remove = (elementClicked: ComponentType | Wire) => {
    if ((elementClicked as ComponentType)?.componentType) {
      removeComponent(elementClicked as ComponentType);
    }
    //TODO: remove wire
  };

  return (
    <div className={styles.container}>
      <ActionsToolbar circuit={circuit} onActionChange={setAction} />
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onClick={handleStageClick}
        onMouseMove={handleStageMouseMove}
      >
        <Provider store={store}>
          <Layer>
            <ProviderReturn returnState={setState} />
          </Layer>
          <Layer>
            <Grid blockSnapSize={blockSnapSize} />
          </Layer>
          <Layer>
            <Circuit
              components={circuit}
              onCircuitUpdate={setCircuit}
              onComponentMoving={handleDragMove}
              onComponentDroped={handleDragRelease}
              onClickComponent={handleComponentClick}
            />
            <Wires
              ref={wireRef}
              userId={userId}
              lastEdited={lastEdited}
              simulation={state.simulation}
            />
            {intersections.map(({ x, y }, i) => (
              <Circle
                key={i}
                radius={5}
                fill="black"
                stroke="black"
                strokeWidth={0}
                x={x}
                y={y}
              />
            ))}
          </Layer>

          <Toolbar
            onComponentDragStart={handleDragStart}
            onComponentDragMove={handleDragMove}
            onComponentDragEnd={handleDragRelease}
            showTools={showTools}
          />
        </Provider>
      </Stage>

      {/* {!!state?.simulation?.simulation && (
        <Oscilloscope simulation={state!.simulation.simulation} />
      )} */}

      <div className={styles.toolsSelector}>
        <button onClick={() => setShowTools(true)} disabled={showTools}>
          tools
        </button>
        <button onClick={() => setShowTools(false)} disabled={!showTools}>
          components
        </button>
      </div>
    </div>
  );
};
