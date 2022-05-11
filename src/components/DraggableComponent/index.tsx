import { KonvaEventObject } from "konva/lib/Node";
import {
  ChangeEvent,
  ElementRef,
  FormEvent,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { Image, Text, Circle, Group } from "react-konva";
import { ComponentType } from "../../@types";
import useImage from "use-image";
import { Html } from "react-konva-utils";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../services/redux/store";
import { Position } from "../../@types/ComponentType";
import { updateCircuit } from "../../services/redux/simulationSlice";

interface DraggableComponentProps {
  size: number;
  x: number;
  y: number;
  backToOrigin?: boolean;
  onDragStart?: (event: KonvaEventObject<DragEvent>) => void;
  onDragMove?: (event: KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (event: ComponentType) => void;
  onClickComponent: (component: ComponentType) => void;
  componentData?: ComponentType;
}

export const DraggableComponent = (props: DraggableComponentProps) => {
  const {
    size,
    x,
    y,
    onDragEnd,
    onDragMove,
    onDragStart,
    backToOrigin = true,
    componentData,
    onClickComponent,
  } = props;

  console.log({ componentData });

  const ref = useRef<any>();
  const textRef = useRef<ElementRef<typeof Text>>(null);

  const [editingLabel, toggleEditingLabel] = useReducer((s) => !s, false);

  const [component, setComponent] = useState(componentData);
  const [measureValue, setMeasureValue] = useState("");

  const [image] = useImage(componentData!.image);

  const { simulation, circuit } = useSelector(
    (state: RootState) => state.simulation
  );

  const dispatch = useDispatch();

  useEffect(() => {
    console.log({ simulation });
  }, [simulation]);

  const handleDragEnd = (event: KonvaEventObject<DragEvent>) => {
    if (!!onDragEnd) {
      onDragEnd(componentData);
    }

    if (backToOrigin) {
      ref?.current?.position({
        x,
        y,
      });
    }
  };

  const editComponent =
    (key: keyof ComponentType) => (evt: ChangeEvent<HTMLInputElement>) => {
      setComponent({ ...component, [key]: evt.target.value });
    };

  const submitNewLabel = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toggleEditingLabel();
    console.log("Teste", { component });

    const circuitCopy = [...circuit];
    const componentIndex = circuit.findIndex(({ id }) => {
      id === component?.id;
    });

    circuitCopy[componentIndex] = component!;

    dispatch(updateCircuit(circuitCopy));
  };

  const handleDoubleClick = async () => {
    const tools = ["voltimeter"];

    if (tools.includes(componentData!.componentType)) {
      const nodes = await simulation.getVoltageNodes();
      const measuredKeyPositive = Object.keys(nodes).find((key) =>
        key.includes(componentData!.nodes.positive.value)
      )!;
      const measuredKeyNegative = Object.keys(nodes).find((key) =>
        key.includes(componentData!.nodes.negative.value)
      )!;
      const measuredValue = !!nodes?.[measuredKeyNegative]
        ? nodes[measuredKeyPositive] - nodes[measuredKeyNegative]
        : nodes[measuredKeyPositive];

      console.log({ measuredValue });
      setMeasureValue(measuredValue);
    }
  };

  const angleToPosition = {
    0: { x, y },
    90: { x, y },
    180: { x, y },
    270: { x, y },
  } as { [key: number]: Position };

  const xComponent = angleToPosition[componentData!.angle].x;
  const yComponent = angleToPosition[componentData!.angle].y;

  const onComponentClick = () => {
    onClickComponent({
      ...componentData!,
      position: {
        x: xComponent,
        y: yComponent,
      },
    });
  };

  return (
    <>
      {backToOrigin && (
        <Image image={image} height={size * 2} width={size * 2} x={x} y={y} />
      )}

      <Image
        image={image}
        ref={ref}
        height={size * 2}
        width={size * 2}
        x={xComponent}
        y={yComponent}
        rotation={componentData?.angle ?? 0}
        draggable
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={handleDragEnd}
        onDblClick={handleDoubleClick}
        onClick={onComponentClick}
      />

      {componentData?.name && (
        <>
          <Text
            ref={textRef}
            text={component?.name}
            x={x}
            y={y - 21}
            fontSize={14}
            onDblClick={toggleEditingLabel}
          />
          {componentData?.value && (
            <Text
              ref={textRef}
              text={component?.value}
              x={x}
              y={y - 7}
              fontSize={14}
              onDblClick={toggleEditingLabel}
            />
          )}
        </>
      )}

      {editingLabel && (
        <Html
          divProps={{
            style: {
              position: "absolute",
            },
          }}
        >
          <form
            onSubmit={submitNewLabel}
            style={{
              position: "absolute",
              top: y,
              left: x,
              width: 150,
              height: 200,
              backgroundColor: "white",
              border: "2px solid black",
              borderRadius: 8,
              padding: 8,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-around",
            }}
          >
            <h4>Editing component</h4>
            <label>Name :</label>
            <input
              type="text"
              onChange={editComponent("name")}
              value={component?.name}
              style={{
                width: "100%",
              }}
            />
            <label>Value :</label>
            <input
              type="text"
              onChange={editComponent("value")}
              value={component?.value}
              style={{
                width: "100%",
              }}
            />
            <button>Confirm</button>
          </form>
        </Html>
      )}

      {measureValue !== "" && (
        <Html
          divProps={{
            style: {
              position: "absolute",
            },
          }}
        >
          <div
            key={componentData?.id}
            style={{
              position: "absolute",
              top: y,
              left: x,
              backgroundColor: "#aeaeae",
              padding: 20,
              borderRadius: 10,
            }}
            draggable
            onDrag={(e) => {
              console.log({ e: e.target.getBoundingClientRect() });
            }}
          >
            <h3>{measureValue}</h3>
          </div>
        </Html>
      )}
    </>
  );
};
