import { KonvaEventObject } from "konva/lib/Node";
import {
  ChangeEvent,
  ChangeEventHandler,
  ElementRef,
  FormEvent,
  InputHTMLAttributes,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { Image, Text } from "react-konva";
import { ComponentType } from "../../@types";
import useImage from "use-image";
import { Html } from "react-konva-utils";
import { useSelector } from "react-redux";
import { RootState } from "../../services/redux/store";

interface DraggableComponentProps {
  size: number;
  x: number;
  y: number;
  backToOrigin?: boolean;
  onDragStart?: (event: KonvaEventObject<DragEvent>) => void;
  onDragMove?: (event: KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (event: ComponentType) => void;
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
  } = props;

  const ref = useRef<any>();
  const textRef = useRef<ElementRef<typeof Text>>(null);

  const [editingLabel, toggleEditingLabel] = useReducer((s) => !s, false);

  const [label, setLabel] = useState("");
  const [measureValue, setMeasureValue] = useState("");

  const [image] = useImage(componentData!.image);

  const simulation = useSelector(
    (state: RootState) => state.simulation.simulation
  );

  useEffect(() => {
    console.log({ simulation });
  }, [simulation]);

  const handleDragEnd = (event: KonvaEventObject<DragEvent>) => {
    const position = {
      x: event.currentTarget.x(),
      y: event.currentTarget.y(),
    };

    const newComponent = {
      position,
    } as ComponentType;

    if (!!onDragEnd) {
      onDragEnd(componentData ?? newComponent);
    }

    if (backToOrigin) {
      ref?.current?.position({
        x,
        y,
      });
    }
  };

  const editComponentLabel = (evt: ChangeEvent<HTMLInputElement>) => {
    setLabel(evt.target.value);
  };

  const submitNewLabel = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toggleEditingLabel();
    console.log("Teste");
  };

  const handleDoubleClick = async () => {
    const tools = ["voltimeter"];

    if (tools.includes(componentData!.componentType)) {
      const nodes = await simulation.getVoltageNodes();
      const measuredKeyPositive = Object.keys(nodes).find((key) =>
        key.includes(componentData!.nodes.positive)
      )!;
      const measuredKeyNegative = Object.keys(nodes).find((key) =>
        key.includes(componentData!.nodes.negative)
      )!;
      const measuredValue = !!nodes[measuredKeyNegative]
        ? nodes[measuredKeyPositive] - nodes[measuredKeyNegative]
        : nodes[measuredKeyPositive];

      console.log({ measuredValue });
      setMeasureValue(measuredValue);
    }
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
        x={x}
        y={y}
        draggable
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={handleDragEnd}
        onDblClick={handleDoubleClick}
      />
      {componentData?.name && (
        <>
          <Text
            ref={textRef}
            text={componentData?.name}
            x={x}
            y={y - 21}
            fontSize={14}
            onDblClick={toggleEditingLabel}
          />
          {componentData?.value && (
            <Text
              ref={textRef}
              text={componentData?.value}
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
          <form onSubmit={submitNewLabel}>
            <input
              type="text"
              onChange={editComponentLabel}
              value={label ?? componentData?.name}
              style={{
                position: "absolute",
                width: textRef!.current?.textArr[0].width,
                top: y,
                left: x,
              }}
            />
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
