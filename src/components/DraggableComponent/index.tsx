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
import { Image, Text, Circle } from "react-konva";
import { ComponentType } from "../../@types";
import useImage from "use-image";
import { Html } from "react-konva-utils";
import { useSelector } from "react-redux";
import { RootState } from "../../services/redux/store";
import { Position } from "../../@types/ComponentType";

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
      {!!componentData && (
        <Circle
          radius={10}
          fill="yellow"
          stroke="black"
          strokeWidth={5}
          x={xComponent}
          y={yComponent}
        />
      )}
      {!!componentData && (
        <Circle
          radius={10}
          fill="blue"
          stroke="black"
          strokeWidth={5}
          x={componentData?.nodes?.negative?.position.x}
          y={componentData?.nodes?.negative?.position.y}
        />
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
      {!!componentData && (
        <Circle
          radius={10}
          fill="red"
          stroke="black"
          strokeWidth={5}
          x={componentData?.nodes?.positive?.position.x}
          y={componentData?.nodes?.positive?.position.y}
        />
      )}
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
