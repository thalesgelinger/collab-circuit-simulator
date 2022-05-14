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
import { DefaultComponentForm } from "./DefaultComponentForm";
import { PulseComponentForm } from "./PulseComponentForm";

interface DraggableComponentProps {
  size: number;
  x: number;
  y: number;
  backToOrigin?: boolean;
  onDragStart?: (event: KonvaEventObject<DragEvent>) => void;
  onDragMove?: (event: KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (event: ComponentType) => void;
  onClickComponent: (component: ComponentType) => void;
  onCircuitUpdate: (component: ComponentType[]) => void;
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
    onCircuitUpdate,
  } = props;

  const ref = useRef<any>();
  const textRef = useRef<ElementRef<typeof Text>>(null);

  const [editingLabel, toggleEditingLabel] = useReducer((s) => !s, false);

  const [measureValue, setMeasureValue] = useState("");

  const [image] = useImage(componentData!.image);

  const [component, setComponent] = useState(componentData);

  const { simulation, circuit, wire, wires } = useSelector(
    (state: RootState) => state.simulation
  );

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

  const submitNewLabel = (component: ComponentType) => {
    setComponent(component);
    const circuitCopy = Array.from(circuit);
    const componentIndex = circuit.findIndex(({ id }) => {
      return id === component.id;
    });
    circuitCopy[componentIndex] = component;
    console.log("CIRCUIT COPY:", { circuitCopy });
    onCircuitUpdate(circuitCopy);
    toggleEditingLabel();
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

  const getForm = (formType: string) => {
    const forms = {
      pulse_source: () => (
        <PulseComponentForm
          key={componentData!.id}
          componentData={componentData!}
          position={{ x, y }}
          onSubmit={submitNewLabel}
        />
      ),
    };

    if (forms?.[formType]) {
      return forms[formType]();
    }

    return (
      <DefaultComponentForm
        key={componentData!.id}
        componentData={componentData!}
        position={{ x, y }}
        onSubmit={submitNewLabel}
      />
    );
  };

  return (
    <>
      {backToOrigin && (
        <Image
          image={image}
          height={size * 2}
          width={size * 2}
          x={x}
          y={y}
          rotation={componentData?.angle ?? 0}
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

      {editingLabel && getForm(componentData?.componentType)}

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
