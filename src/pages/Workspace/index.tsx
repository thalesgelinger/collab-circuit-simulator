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
import { DraggableComponentType } from "./ComponentsToolbar";
import styles from "./styles.module.scss";
import { Grid } from "./Grid";
import { useSnapToGrid } from "../../hooks";
import { Wire, Wires } from "./Wires";
import { Circuit } from "./Circuit";
import { Oscilloscope } from "./Oscilloscope";
import { useAuth } from "../../hooks/useAuth";
import { app } from "../../services/firebase";
import { getDatabase, onValue, ref, set, get } from "firebase/database";
import { ComponentsKeys, Position } from "../../@types/ComponentType";
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
  run,
  SimulationState,
  stop,
  updateAction,
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
import { pointerShape } from "../../utils/pointerShape";

type WiresHandle = ElementRef<typeof Wires>;

type ActionsType = {
  [key: string]: (evt: KonvaEventObject<MouseEvent>) => void;
};

interface SnapshotType extends SimulationState {
  editedBy: string;
  isRunningSimulation: boolean;
  nodes: any;
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

  const [circuitCover, setCircuitCover] = useState("");

  const [isSimulationRunning, setIsSimulationRunning] = useState({
    isRunning: false,
    userId: "",
  });

  const toolbarRef = useRef<ElementRef<typeof Toolbar>>();

  const stageRef = useRef<ElementRef<typeof Stage>>(null);

  // const {
  //   user: { uid: userId },
  // } = useAuth();

  const userId = "batata";

  const location = useLocation();

  const navigate = useNavigate();

  const lastEdited = useRef(userId);

  const db = getDatabase(app);

  const simulation = useSelector(
    (state: RootState) => state.simulation.simulation
  );

  useEffect(() => {
    if (!!simulation) {
      if (isSimulationRunning.isRunning) {
        simulation.run();
        dispatch(run());
      } else {
        simulation.stop();
        dispatch(stop());
      }
    }
  }, [isSimulationRunning]);

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
    if (action === "goback") {
      navigate("/dashboard");
    }
    return () => {
      unmountCircuit();
    };
  }, [circuitCover]);

  const unmountCircuit = async () => {
    if (action === "goback") {
      const cooworkerWiresRef = ref(db, `circuits/${id}/cooworkerWires`);
      const cooworkerWiresResponse = await get(cooworkerWiresRef);

      const cooworkerWires = [...(cooworkerWiresResponse?.val() ?? [])];

      const cooworkerWiresFiltered = cooworkerWires.filter(
        (wire) => wire.id !== userId
      );

      await set(cooworkerWiresRef, cooworkerWiresFiltered);
      await resetUsersCircuits();
    }
  };

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
    dispatch(updateAction(action));
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
        toolbarRef.current!.hide();
        window.print();
        toolbarRef.current!.show();
      }

      if (action === "goback") {
        toolbarRef.current!.hide();
        const img = stageRef.current?.toDataURL();
        toolbarRef.current!.show();
        setCircuitCover(img!);
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
        wireRef!.current?.wires ?? []
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
        wireRef.current?.cooworkerWires ?? []
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
    const { wire, wires, setWire, setWires } = wireRef.current!;

    if (!hasClickedToComponentTerminal(evt)) {
      console.log("NAO CONECTOU NO COMPONENTE");
    }

    const { x, y } = getPointerPositionByEvent(evt);
    const clickedPosition = snapPosition(x, y);
    let [component, terminal] = clickedComponent(clickedPosition);

    let wireConnected = clickedWire(clickedPosition);

    const hasComponent = !!component && !!terminal;

    const componentHasValueNode =
      !!component?.nodes[terminal! as keyof typeof component.nodes]?.value;

    const componentNodeValue =
      hasComponent && !!componentHasValueNode
        ? component.nodes[terminal! as keyof typeof component.nodes].value
        : "";

    const nodeValue = !!componentNodeValue
      ? componentNodeValue
      : !!wireConnected
      ? wireConnected.nodeValue
      : nodes.toString();

    console.log({ component, terminal, wireConnected });

    if (!wire.from) {
      setWire({
        from: clickedPosition,
        nodeValue,
      } as Wire);

      if (hasComponent && !componentHasValueNode) {
        setCircuit((circuit) => {
          const circuitCopy = [...circuit];
          const indexOfComponent = circuit.findIndex(
            ({ id }) => component.id === id
          );
          circuitCopy[indexOfComponent] = {
            ...component,
            nodes: {
              ...component.nodes,
              [terminal]: {
                ...component.nodes[terminal as keyof typeof component.nodes],
                value: nodeValue,
              },
            },
          };
          return circuitCopy;
        });
      }

      if (!!wireConnected) {
        setIntersections([...intersections, clickedPosition]);
      }
      return;
    }

    const findComponent = (position: Position) => {
      const [component, terminal] = clickedComponent(position);

      if (!component) {
        const starterComponent = circuit.find((c) => {
          return Object.keys(c.nodes).some((key) => {
            return (
              c.nodes[key as keyof typeof c.nodes].value === wire.nodeValue
            );
          });
        });

        const terminal = Object.keys(starterComponent!.nodes).find(
          (nodeKey) => {
            return (
              starterComponent?.nodes[
                nodeKey as keyof typeof starterComponent.nodes
              ].value === wire.nodeValue
            );
          }
        );

        return [starterComponent, terminal];
      }

      return [component, terminal] as const;
    };

    const findComponents = (position: Position) => {
      const [component, terminal] = clickedComponent(position);

      if (!component) {
        const starterComponents = circuit.filter((c) => {
          return Object.keys(c.nodes).some((key) => {
            return (
              c.nodes[key as keyof typeof c.nodes].value === wire.nodeValue
            );
          });
        });

        const terminals = starterComponents.map((c) => {
          Object.keys(c!.nodes).find((nodeKey) => {
            return (
              c?.nodes[nodeKey as keyof typeof c.nodes].value === wire.nodeValue
            );
          });
        });

        return [[starterComponents], [terminals]];
      }

      return [component, terminal] as const;
    };

    if (!!wireConnected) {
      setIntersections([...intersections, clickedPosition]);

      console.log({ circuit, wire });

      // [component, terminal] = findComponents(wire.from);

      const hasNodeValueOnCLickedComponent =
        !!nodeValue && Number(wire.nodeValue) > Number(nodeValue);

      const nodeValueToConsider = hasNodeValueOnCLickedComponent
        ? nodeValue
        : wire.nodeValue;

      console.log("CONECTOU EM UM FIO:", {
        nodeValueToConsider,
        hasNodeValueOnCLickedComponent,
        component,
      });

      setWires((wiresOriginal) => {
        const wires = [...wiresOriginal];
        const wiresToChangeNodeValue = wires.filter(
          (w) => w.nodeValue === wire.nodeValue
        );

        wiresToChangeNodeValue.forEach((w) => {
          const indexOfWireToChange = wires.findIndex(
            (e) => e.nodeValue === w.nodeValue
          );
          wires[indexOfWireToChange] = {
            ...wires[indexOfWireToChange],
            nodeValue: nodeValueToConsider,
          };
        });

        wires.push({
          ...wire,
          to: clickedPosition,
          nodeValue: nodeValueToConsider,
        });

        return wires;
      });

      setCircuit((circuit) => {
        const circuitCopy = [...circuit];

        const valueNodeToConsiderHere = Math.max(
          Number(wire.nodeValue),
          Number(nodeValue)
        );
        const componentsToUpdate = circuit.filter((comp) => {
          return Object.keys(comp.nodes).some((key) => {
            console.log({ valueNodeToConsiderHere });

            return comp.nodes[key].value === valueNodeToConsiderHere.toString();
          });
        });

        console.log({ componentsToUpdate });

        componentsToUpdate.forEach((comp) => {
          const indexOfComponent = circuit.findIndex(
            ({ id }) => id === comp.id
          );

          const terminal = Object.keys(comp!.nodes).find((nodeKey) => {
            return (
              comp?.nodes[nodeKey as keyof typeof comp.nodes].value ===
              valueNodeToConsiderHere.toString()
            );
          });

          circuitCopy[indexOfComponent] = {
            ...comp,
            nodes: {
              ...comp.nodes,
              [terminal]: {
                ...comp.nodes[terminal as keyof typeof comp.nodes],
                value: nodeValueToConsider,
              },
            },
          };
        });

        return circuitCopy;
      });

      setWire({} as Wire);
      return;
    }

    if (!!component && !!terminal) {
      const hasNodeValueOnCLickedComponent =
        !!nodeValue && Number(wire.nodeValue) > Number(nodeValue);

      let nodeValueToConsider = hasNodeValueOnCLickedComponent
        ? nodeValue
        : wire.nodeValue;

      console.log("CONECTOU EM UM COMPONENTE: ", {
        nodeValue,
        nodeValueToConsider,
        wireNodeValue: wire.nodeValue,
      });

      if (nodeValue === nodeValueToConsider && nodeValue !== nodes.toString()) {
        [component, terminal] = findComponent(wire.from);
      }

      setWires((wiresOriginal) => {
        const wires = [...wiresOriginal];
        const wiresToChangeNodeValue = wires.filter(
          (w) => w.nodeValue === wire.nodeValue
        );

        wiresToChangeNodeValue.forEach((w) => {
          const indexOfWireToChange = wires.findIndex(
            (e) => e.nodeValue === w.nodeValue
          );
          wires[indexOfWireToChange] = {
            ...wires[indexOfWireToChange],
            nodeValue: nodeValueToConsider,
          };
        });

        wires.push({
          ...wire,
          to: clickedPosition,
          nodeValue: nodeValueToConsider,
        });

        return wires;
      });

      setCircuit((circuit) => {
        const circuitCopy = [...circuit];
        const indexOfComponent = circuit.findIndex(
          ({ id }) => component.id === id
        );
        circuitCopy[indexOfComponent] = {
          ...component,
          nodes: {
            ...component.nodes,
            [terminal]: {
              ...component.nodes[terminal as keyof typeof component.nodes],
              value: nodeValueToConsider,
            },
          },
        };
        return circuitCopy;
      });
      setWire({} as Wire);
      setNodes(wire.nodeValue === nodes.toString() ? nodes + 1 : nodes);
      return;
    }

    setWires([...wires, { ...wire, to: clickedPosition }]);
    setWire({ from: clickedPosition, nodeValue: wire.nodeValue } as Wire);
  };

  const clickedComponent = (clickedPosition: Position) => {
    const componentClicked = circuit.find((component) => {
      return Object.keys(component.nodes).some((nodeKey) => {
        return compareObjects(
          component.nodes[nodeKey as keyof typeof component.nodes].position,
          clickedPosition
        );
      });
    });

    if (!componentClicked) {
      return [undefined, undefined];
    }

    const terminal = Object.keys(componentClicked.nodes).find((nodeKey) => {
      return compareObjects(
        componentClicked.nodes[nodeKey as keyof typeof componentClicked.nodes]
          .position,
        clickedPosition
      );
    })! as keyof typeof componentClicked.nodes;

    return [componentClicked, terminal] as const;
  };

  const clickedWire = ({ x, y }: Position) => {
    const wireClicked = wireRef?.current?.wires.find((wire) => {
      const yValues = [wire.from.y, wire.to.y];
      const yMin = Math.min(...yValues);
      const yMax = Math.max(...yValues);
      const matchXHorizontal = wire.from.x === x && x === wire.to.x;
      const matchYHorizontal = yMin <= y && y <= yMax;

      const xValues = [wire.from.x, wire.to.x];
      const xMin = Math.min(...xValues);
      const xMax = Math.max(...xValues);
      const matchXVertical = xMin <= x && x <= xMax;
      const matchYVertical = wire.from.y === y && y === wire.from.y;

      const matchVertical = matchYVertical && matchXVertical;
      const matchHorizontal = matchYHorizontal && matchXHorizontal;
      return matchHorizontal || matchVertical;
    });

    return wireClicked;
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

  const findComponentAndTerminalConnectedByWire = (wirePosition: Position) => {
    const component = findComponentByWirePosition(wirePosition);
    if (!component) {
      return [undefined, undefined];
    }
    const terminal = findTerminalConnectedToWire(component, wirePosition)!;
    return [component, terminal] as const;
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

  const handleWireClick = (wire: Wire) => {
    const actions = {
      remove,
    } as {
      [key: string]: (component: ComponentType | number) => void;
    };

    if (!!actions?.[action]) {
      actions[action](wire);
    }
  };

  const remove = (elementClicked: ComponentType | Wire) => {
    if ((elementClicked as ComponentType)?.componentType) {
      removeComponent(elementClicked as ComponentType);
    }
    if ((elementClicked as Wire)?.nodeValue) {
      removeWire(elementClicked as Wire);
    }
  };

  const removeWire = (wire: Wire) => {
    const { setWires, wires } = wireRef.current!;

    setIntersections((intersections) => {
      const wiresToBeRemoved = wires.filter((w) => {
        return w.nodeValue === wire.nodeValue;
      });

      return intersections.filter((intersection) => {
        const isConnectedToWire = wiresToBeRemoved.some((w) => {
          const { nodeValue, ...position } = w;

          const isConnectionAtFrom = compareObjects(
            position.from,
            intersection
          );
          const isConnectionAtTo = compareObjects(position.to, intersection);

          console.log({
            isConnectionAtFrom,
            isConnectionAtTo,
            position,
            intersection,
          });

          return isConnectionAtFrom || isConnectionAtTo;
        });

        return !isConnectedToWire;
      });
    });
    setWires(
      wires.filter((w) => {
        return w.nodeValue !== wire.nodeValue;
      })
    );

    setCircuit((circuit) => {
      const circuitCopy = [...circuit];

      const circuitFiltered = circuitCopy.map((component) => {
        if (
          Object.keys(component.nodes).some(
            (key) =>
              component.nodes[key as keyof typeof component.nodes].value ===
              wire.nodeValue
          )
        ) {
          const terminal = Object.keys(component.nodes).find((key) => {
            return (
              component.nodes[key as keyof typeof component.nodes].value ===
              wire.nodeValue
            );
          })!;

          return {
            ...component,
            nodes: {
              ...component.nodes,
              [terminal]: {
                ...component.nodes[terminal as keyof typeof component.nodes],
                value:
                  component.nodes[terminal as keyof typeof component.nodes]
                    .value === "0" &&
                  component.componentType.endsWith("_source")
                    ? "0"
                    : "",
              },
            },
          };
        }
        return component;
      });
      return circuitFiltered;
    });
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
          onClick={() => setShowTools(false)}
          style={{
            backgroundColor: showTools
              ? "rgba(255, 255, 255, 0.1647)"
              : "#efefef",
          }}
        >
          COMPONENTES
        </button>
        <button
          onClick={() => setShowTools(true)}
          style={{
            backgroundColor: !showTools
              ? "rgba(255, 255, 255, 0.1647)"
              : "#efefef",
          }}
        >
          FERRAMENTAS
        </button>
      </div>
    </div>
  );
};
