import { ElementRef, useCallback, useEffect, useRef, useState } from "react";
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
import { Tools } from "./Tools";
import { Toolbar } from "./Toolbar";
import { Provider, useDispatch, useSelector } from "react-redux";
import { RootState, store } from "../../services/redux/store";
import {
  ActionTypes,
  updateCircuit,
} from "../../services/redux/simulationSlice";

type WiresHandle = ElementRef<typeof Wires>;

type ActionsType = {
  [key: string]: (evt: KonvaEventObject<MouseEvent>) => void;
};

export const Workspace = () => {
  const [circuit, setCircuit] = useState<ComponentType[]>([]);
  const blockSnapSize = 20;
  const snapPosition = useSnapToGrid(blockSnapSize);

  const [showTools, setShowTools] = useState(false);

  const wireRef = useRef<WiresHandle>(null);

  const dispatch = useDispatch();

  const [nodes, setNodes] = useState(0);

  const [action, setAction] = useState("");

  // const { user } = useAuth();

  // useEffect(() => {
  //   if (circuit.length) {
  //     const db = getDatabase();
  //     set(ref(db, "circuits"), { circuit });
  //   }
  // }, [circuit]);

  useEffect(() => {
    console.log({ circuit });
    dispatch(updateCircuit(circuit));
  }, [circuit]);

  // useEffect(() => {
  //   const db = getDatabase(app);
  //   const starCountRef = ref(db, "circuits");
  //   onValue(starCountRef, (snapshot) => {
  //     const { circuit } = snapshot.val();
  //     setCircuit(circuit);
  //   });
  // }, []);

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
          value: "",
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

  const getComponentNameByType = (type: string) => {
    const types = {
      resistor: "R",
      dc_source: "V",
      capacitor: "C",
      voltimeter: "VOLTMETER_",
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

    if (hasConnected) {
      console.log("AEEEE");
    }

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

    console.log({ circuitWithComponentRemoved });

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

      console.log({ previousWireIndex, w: wires[previousWireIndex] });

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
    const component = circuit.find((component) => {
      const connectedToPositive =
        JSON.stringify(component.nodes.positive.position) ===
        JSON.stringify(wirePosition);
      const connectedToNegative =
        JSON.stringify(component.nodes.negative.position) ===
        JSON.stringify(wirePosition);

      return connectedToNegative || connectedToPositive;
    });
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
            <Grid blockSnapSize={blockSnapSize} />
          </Layer>
          <Layer>
            <Circuit
              components={circuit}
              onComponentMoving={handleDragMove}
              onComponentDroped={handleDragRelease}
              onClickComponent={handleComponentClick}
            />
            <Wires ref={wireRef} />
          </Layer>

          <Toolbar
            onComponentDragStart={handleDragStart}
            onComponentDragMove={handleDragMove}
            onComponentDragEnd={handleDragRelease}
            showTools={showTools}
          />
        </Provider>
      </Stage>

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
