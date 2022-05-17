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
import { getDatabase, onValue, ref, set, on, get } from "firebase/database";
import { ComponentsKeys, Position } from "../../@types/ComponentType";
import { Tools } from "./Tools";
import { Toolbar } from "./Toolbar";
import {
  Provider,
  ReactReduxContext,
  useDispatch,
  useSelector,
} from "react-redux";
import { RootState } from "../../services/redux/store";
import {
  addCircuit,
  SimulationState,
  updateCircuit,
  updateIntersection,
} from "../../services/redux/simulationSlice";
import { ProviderReturn } from "./ProviderReturn";
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

type WiresHandle = ElementRef<typeof Wires>;

type ActionsType = {
  [key: string]: (evt: KonvaEventObject<MouseEvent>) => void;
};

interface SnapshotType extends SimulationState {
  editedBy: string;
  isRunningSimulation: boolean;
}

export const compareObjects = (obj1: object, obj2: object) => {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
};

const marginTop = (window.innerHeight * (1 - 0.8275)) / 2;

export const Workspace = () => {
  const { id } = useParams();

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

  const [circuitCover, setCircuitCover] = useState(null);

  const [isSimulationRunning, setIsSimulationRunning] = useState({
    isRunning: false,
    userId: "",
  });

  const toolbarRef = useRef();

  const stageRef = useRef<ElementRef<typeof Stage>>(null);

  const {
    user: { uid: userId },
  } = useAuth();

  const location = useLocation();

  const navigate = useNavigate();

  const lastEdited = useRef(userId);

  const db = getDatabase(app);

  useEffect(() => {
    console.log({ nodes });
    (async () => {
      if (nodes > 1) {
        await set(ref(db, `circuits/${id}/nodes`), nodes);
      }
    })();
  }, [nodes]);

  useEffect(() => {
    set(ref(db, `circuits/${id}/editedBy`), "");
    if (!userId) {
      navigate("/", { state: { from: location } });
    }
    return () => {
      if (!!userId) {
        resetUsersCircuits();
      }
    };
  }, []);

  useEffect(() => {
    (async () => {
      if (action === "goback") {
        const cooworkerWiresRef = ref(db, `circuits/${id}/cooworkerWires`);
        const cooworkerWiresResponse = await get(cooworkerWiresRef);

        const cooworkerWires = [...(cooworkerWiresResponse?.val() ?? [])];

        const cooworkerWiresFiltered = cooworkerWires.filter(
          (wire) => wire.id !== userId
        );

        await set(cooworkerWiresRef, cooworkerWiresFiltered);
        await resetUsersCircuits();
        navigate("/dashboard");
      }
    })();
  }, [circuitCover]);

  const resetUsersCircuits = async () => {
    const userCircuitsRef = ref(db, `users/${userId}`);

    const snapshot = await get(userCircuitsRef);

    if (!snapshot.val()) {
      return await Promise.resolve();
    }

    const snapshotCopy = [...(snapshot?.val() ?? [])];
    const indexCurrentCircuit = snapshotCopy.findIndex((el) => el.id === id);
    if (!!circuitCover && indexCurrentCircuit >= 0) {
      snapshotCopy[indexCurrentCircuit] = {
        ...snapshotCopy[indexCurrentCircuit],
        img: circuitCover,
      };
      await set(userCircuitsRef, snapshotCopy);
    }
  };

  useEffect(() => {
    (async () => {
      dispatch(updateCircuit(circuit));
      if (!!state.simulation) {
        const { simulation, ...rest } = state.simulation;

        if (!compareObjects(rest.circuit, circuit)) {
          await set(ref(db, `circuits/${id}/circuit`), circuit);
          await set(ref(db, `circuits/${id}/editedBy`), lastEdited.current);
          lastEdited.current = userId;
        }
      }
    })();
  }, [circuit]);

  useEffect(() => {
    (async () => {
      dispatch(updateIntersection(intersections));
      if (!!state.simulation) {
        const { simulation, ...rest } = state.simulation;

        if (!compareObjects(rest.intersections, intersections)) {
          await set(ref(db, `circuits/${id}/intersections`), intersections);
          await set(ref(db, `circuits/${id}/editedBy`), lastEdited.current);
          lastEdited.current = userId;
        }
      }
    })();
  }, [intersections]);

  useEffect(() => {
    (async () => {
      if (action === "simulate") {
        dispatch(addCircuit(circuit));
        await set(ref(db, `circuits/${id}/isRunningSimulation`), true);
        await set(ref(db, `circuits/${id}/editedBy`), userId);
      }

      if (action === "simulatestop") {
        await set(ref(db, `circuits/${id}/isRunningSimulation`), false);
        await set(ref(db, `circuits/${id}/editedBy`), userId);
      }

      if (action === "print") {
        toolbarRef.current.hide();
        window.print();
        toolbarRef.current.show();
      }

      if (action === "goback") {
        toolbarRef.current.hide();
        const img = stageRef.current?.toDataURL();
        toolbarRef.current.show();
        setCircuitCover(img);
      }
    })();
  }, [action]);

  useEffect(() => {
    const circuits = ref(db, `circuits/${id}`);
    const subscribe = onValue(circuits, (snapshot) => {
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

      if (response?.nodes > nodes) {
        setNodes(response?.nodes);
      }

      setIsSimulationRunning({
        isRunning: !!response?.isRunningSimulation,
        userId: response?.editedBy ?? "",
      });

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
    return () => {
      set(ref(db, `circuits/${id}/editedBy`), "");
      subscribe();
    };
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
          value: getNegativeInitialValue(event.componentType),
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

  const getNegativeInitialValue = (componentType: ComponentsKeys) => {
    const hasSourceOnCircuitAlready = (componentType: ComponentsKeys) => {
      return circuit.some(
        (component) => component.componentType === componentType
      );
    };

    return isSource(componentType)
      ? hasSourceOnCircuitAlready(componentType)
        ? ""
        : "0"
      : "";
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
      diode: "D",
      voltimeter: "VOLTMETER_",
      ohmmimeter: "OHMMIMETER_",
      currentmeter: "CURRENT_",
      osciloscope: "OSCILLOSCOPE_",
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
      console.log("NAO CONECTOU NO COMPONENTE");
    }

    if (!wire?.from) {
      createWire(evt);
      console.log("AQUIIIIIIIIIIIIIIIIII");

      return;
    }

    if (wireHasConnectedToComponent(wire)) {
      console.log("DONE");
      setWireNodeToEndComponent(wire);
      console.log("SETRTING WIRE AFTER NODE CONNECTED");
      setWires([...wires, points]);
      setWire({} as Wire);
      return;
    }

    if (wireConnectedToOtherWire(wire.to)) {
      console.log("É UMA JUNÇÃO");
      connectNodeToComponent(wire);
      setIntersections([...intersections, wire.to]);
      setWires([...wires, points]);
      setWire({} as Wire);
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

    if (wireConnectedToOtherWire(from)) {
      setIntersections([...intersections, from]);
      return;
    }

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

  const handleWireClick = (wireIndex: number) => {
    const actions = {
      remove,
    } as {
      [key: string]: (component: ComponentType | number) => void;
    };

    if (!!actions?.[action]) {
      actions[action](wireIndex);
    }
  };

  const remove = (elementClicked: ComponentType | number) => {
    if ((elementClicked as ComponentType)?.componentType) {
      removeComponent(elementClicked as ComponentType);
    }
    if (typeof elementClicked === "number") {
      removeWire(elementClicked);
    }
  };

  const removeWire = (wireIndex: number) => {
    const { wires } = wireRef.current!;

    const wiresIndexToRemove = findAllWiresToRemove(wireIndex);

    const wiresToRemove = wiresIndexToRemove.map((i) => wires[i]).flat();

    const [start, end] = findStartAndEndPoint(wiresToRemove);

    const [componentAtStart, terminalAtStart] =
      findComponentAndTerminalConnectedByWire(start);

    const [componentAtEnd, terminalAtEnd] =
      findComponentAndTerminalConnectedByWire(end);

    if (componentAtStart && terminalAtStart) {
      updateComponentTerminalNode({
        component: componentAtStart,
        terminal: terminalAtStart!,
        node: componentAtStart.nodes[terminalAtStart].value === "0" ? "0" : "",
      });
    }

    if (componentAtEnd && terminalAtEnd) {
      updateComponentTerminalNode({
        component: componentAtEnd,
        terminal: terminalAtEnd!,
        node: componentAtEnd.nodes[terminalAtEnd].value === "0" ? "0" : "",
      });
    }

    wireRef.current?.setWires((wires) =>
      wires.filter((_, i) => !wiresIndexToRemove.includes(i))
    );
  };

  const findAllWiresToRemove = (wireIndex: number) => {
    const { wires } = wireRef.current!;

    const wiresToRemove = [wireIndex];

    const [startPointOriginal, endPointOriginal] = findStartAndEndPoint(
      wires[wireIndex]
    );

    const prevWires = findPrevWires(startPointOriginal);
    const nextWires = findNextWires(endPointOriginal);

    wiresToRemove.unshift(...prevWires);
    wiresToRemove.push(...nextWires);

    return wiresToRemove;
  };

  const findStartAndEndPoint = (wire: number[]) => {
    const start = {
      x: wire[0],
      y: wire[1],
    };

    const end = {
      x: wire[wire!.length - 2],
      y: wire[wire!.length - 1],
    };

    return [start, end];
  };
  const findPrevWires = (
    startPoint: Position,
    prevWiresIndex = [] as number[]
  ): number[] => {
    const { wires } = wireRef.current!;

    const indexWirePrev = wires.findIndex((wire) => {
      const [_, end] = findStartAndEndPoint(wire);

      return compareObjects(end, startPoint);
    });

    if (indexWirePrev >= 0) {
      prevWiresIndex.unshift(indexWirePrev);
      const [start] = findStartAndEndPoint(wires[indexWirePrev]);
      return findPrevWires(start, prevWiresIndex);
    }
    return prevWiresIndex;
  };

  const findNextWires = (
    endPoint: Position,
    nextWiresIndex = [] as number[]
  ) => {
    const { wires } = wireRef.current!;

    const indexWireNext = wires.findIndex((wire) => {
      const [start, _] = findStartAndEndPoint(wire);

      return compareObjects(start, endPoint);
    });
    if (indexWireNext >= 0) {
      nextWiresIndex.push(indexWireNext);
      const [start] = findStartAndEndPoint(wires[indexWireNext]);
      return findPrevWires(start, nextWiresIndex);
    }
    return nextWiresIndex;
  };

  return (
    <div className={styles.container}>
      {isSimulationRunning.isRunning && (
        <span
          style={{
            width: `100%`,
            position: "absolute",
            display: "flex",
            justifyContent: "center",
            backgroundColor: "red",
            zIndex: 1000,
            color: "white",
          }}
        >
          {isSimulationRunning.userId} is running the simulation
        </span>
      )}
      {isSimulationRunning.isRunning && isSimulationRunning.userId === userId && (
        <span
          style={{
            width: `100%`,
            position: "absolute",
            display: "flex",
            justifyContent: "center",
            backgroundColor: "green",
            zIndex: 1000,
            color: "white",
          }}
        >
          You start the simulation
        </span>
      )}
      <ActionsToolbar circuit={circuit} onActionChange={setAction} />
      <ReactReduxContext.Consumer>
        {({ store }) => (
          <Stage
            width={window.innerWidth}
            height={window.innerHeight}
            onClick={handleStageClick}
            onMouseMove={handleStageMouseMove}
            ref={stageRef}
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
                  circuitId={id}
                  userId={userId}
                  lastEdited={lastEdited}
                  simulation={state.simulation}
                  onClickWire={handleWireClick}
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
                ref={toolbarRef}
                onComponentDragStart={handleDragStart}
                onComponentDragMove={handleDragMove}
                onComponentDragEnd={handleDragRelease}
                showTools={showTools}
              />
            </Provider>
          </Stage>
        )}
      </ReactReduxContext.Consumer>

      <Oscilloscope />

      <div
        className={styles.toolsSelector}
        style={{
          top: marginTop - 50,
        }}
      >
        <button
          onClick={() => setShowTools(true)}
          style={{
            backgroundColor: !showTools
              ? "rgba(255, 255, 255, 0.1647)"
              : "#efefef",
          }}
        >
          TOOLS
        </button>
        <button
          onClick={() => setShowTools(false)}
          style={{
            backgroundColor: showTools
              ? "rgba(255, 255, 255, 0.1647)"
              : "#efefef",
          }}
        >
          COMPONENTS
        </button>
      </div>
    </div>
  );
};
