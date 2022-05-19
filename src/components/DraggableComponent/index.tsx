import { KonvaEventObject } from "konva/lib/Node";
import {
  ElementRef,
  useEffect,
  useMemo,
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
import { ComponentsKeys, Position } from "../../@types/ComponentType";
import { DefaultComponentForm } from "./DefaultComponentForm";
import { PulseComponentForm } from "./PulseComponentForm";
import { updateOscilloscopeData } from "../../services/redux/simulationSlice";
import { AcComponentForm } from "./AcComponentForm";
import { formatToSi } from "../../utils/formatToSI";
import { pointerShape } from "../../utils/pointerShape";

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

type MeasuredValue = {
  key: number;
  value: string;
  position: Position;
  show?: boolean;
};

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

  const [measureValues, setMeasureValues] = useState<MeasuredValue[]>(
    [] as MeasuredValue[]
  );

  const [showLabelType, setShowLabelType] = useState(false);

  const [image] = useImage(componentData!.image);

  const [component, setComponent] = useState(componentData);

  const dispatch = useDispatch();

  const { simulation, circuit, isRunning, action } = useSelector(
    (state: RootState) => state.simulation
  );

  const tools = useMemo(() => {
    return {
      voltimeter: async () => {
        const nodes = (await simulation.getVoltageNodes()) as {
          [key: string]: string;
        };
        const measuredKeyPositive = Object.keys(nodes).find((key) =>
          key.includes(componentData!.nodes.positive.value)
        )!;
        const measuredKeyNegative = Object.keys(nodes).find((key) =>
          key.includes(componentData!.nodes.negative.value)
        )!;
        const measuredValue = !!nodes?.[measuredKeyNegative]
          ? Number(nodes[measuredKeyPositive]) -
            Number(nodes[measuredKeyNegative])
          : Number(nodes[measuredKeyPositive]);

        const voltageMeasure = {
          key: componentData!.id,
          value: `${formatToSi(measuredValue)}V`,
          position: componentData!.position,
        };

        setMeasureValues([voltageMeasure, ...measureValues]);
      },
      currentmeter: async () => {
        const current = await simulation.getCurrent();

        const voltageMeasure = {
          key: componentData!.id,
          value: `${formatToSi(Number(current[componentData!.name]))}A`,
          position: componentData!.position,
        };

        setMeasureValues([voltageMeasure, ...measureValues]);
      },
      osciloscope: async () => {
        const oscilloscopeTypes = {
          pulse_source: async () => {
            const response = await simulation.getPulseSimulationNodes();

            const waveForOsciloscopeConnectedNode = response.map((data) => {
              const key = `v(${componentData!.nodes.positive.value})`;

              return {
                time: data.time,
                [key]: data[key],
              };
            });

            return waveForOsciloscopeConnectedNode;
          },
          ac_source: async () => {
            const response = await simulation.getWave();

            console.log({ response });

            const waveForOsciloscopeConnectedNode = response.map((data) => {
              const key = `v(${componentData!.nodes.positive.value})`;

              return {
                time: data.time,
                [key]: data[key],
              };
            });

            return waveForOsciloscopeConnectedNode;
          },
        } as { [key in ComponentsKeys]: () => Promise<any> };

        const source = circuit.find((component) =>
          component.componentType.endsWith("_source")
        );

        const run = oscilloscopeTypes[source!.componentType];

        const dataResponse = await run();
        dispatch(updateOscilloscopeData(dataResponse));
      },
    } as { [key in ComponentsKeys]: () => Promise<void> };
  }, [isRunning]);

  useEffect(() => {
    setMeasureValues([]);
    dispatch(updateOscilloscopeData([]));
  }, [circuit]);

  useEffect(() => {
    if (!isRunning) {
      setMeasureValues([]);
    }

    if (isRunning) {
      console.log("VAI RODAR AQUI");
      getValuesOfConnectedSources();
    }
  }, [isRunning]);

  const getValuesOfConnectedSources = async () => {
    if (tools.hasOwnProperty(componentData!.componentType)) {
      console.log({ circuit });
      await tools[componentData!.componentType]();
    }
  };

  const handleDragEnd = (event: KonvaEventObject<DragEvent>) => {
    if (!!onDragEnd) {
      onDragEnd(componentData!);
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
    onCircuitUpdate(circuitCopy);
    toggleEditingLabel();
  };

  const handleDoubleClick = async () => {
    if (!simulation.isRunning) {
      return;
    }

    if (componentData?.componentType === "osciloscope") {
      tools.osciloscope();
    } else {
      const measured = measureValues.find(
        ({ key }) => key === componentData!.id
      );

      setMeasureValues((measureValues) => {
        return measureValues.map(({ key }) => {
          return {
            ...measured,
            show: measured!.key === key ? !measured?.show : false,
          };
        });
      });
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
      ac_source: () => (
        <AcComponentForm
          key={componentData!.id}
          componentData={componentData!}
          position={{ x, y }}
          onSubmit={submitNewLabel}
        />
      ),
    } as { [key in ComponentsKeys]: () => JSX.Element };

    if (forms?.[formType as ComponentsKeys]) {
      return forms[formType as ComponentsKeys]();
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

  const isTool = Object.keys(tools).includes(componentData!.componentType);

  return (
    <>
      {backToOrigin && (
        <>
          <Image
            image={image}
            height={size * 2}
            width={size * 2}
            x={x}
            y={y}
            rotation={componentData?.angle ?? 0}
          />
          {showLabelType && (
            <Text
              text={componentData?.componentType}
              x={
                x -
                (size * 4 + Number(componentData?.componentType.length) * 2.5)
              }
              y={y + size}
              width={200}
              fontSize={14}
            />
          )}
        </>
      )}

      {!!componentData?.nodes &&
        Object.keys(componentData.nodes).map((nodeKey) => {
          const node = componentData!.nodes[nodeKey];

          return (
            node.value === "" && (
              <Circle
                radius={3}
                fill="white"
                stroke="black"
                strokeWidth={1}
                x={node.position.x}
                y={node.position.y}
                onMouseOver={pointerShape(
                  action === "edit" ? "copy" : "default"
                )}
                onMouseLeave={pointerShape("default")}
              />
            )
          );
        })}

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
        onMouseEnter={(e) => {
          pointerShape(
            isTool ? "pointer" : action === "edit" ? "default" : "grab"
          )(e);
          setShowLabelType(true);
        }}
        onMouseDown={pointerShape(
          isTool ? "pointer" : action === "edit" ? "default" : "grabbing"
        )}
        onMouseLeave={(e) => {
          pointerShape("default")(e);
          setShowLabelType(false);
        }}
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
            onMouseOver={pointerShape("text")}
            onMouseLeave={pointerShape("default")}
          />
          {componentData?.value && (
            <Text
              ref={textRef}
              text={
                measureValues.find(({ key }) => componentData.id === key)
                  ?.value ?? componentData?.value
              }
              x={x}
              y={y - 7}
              fontSize={14}
              onDblClick={toggleEditingLabel}
              onMouseOver={pointerShape("text")}
              onMouseLeave={pointerShape("default")}
            />
          )}
        </>
      )}

      {editingLabel && getForm(componentData!.componentType)}

      {measureValues.map(
        ({ show, value, position: { x, y } }, i) =>
          show && (
            <Html
              divProps={{
                style: {
                  position: "absolute",
                },
              }}
            >
              <div
                key={i}
                style={{
                  position: "absolute",
                  top: y,
                  left: x,
                  backgroundColor: "#aeaeae",
                  padding: 20,
                  borderRadius: 10,
                }}
                draggable
              >
                <h3>{value}</h3>
              </div>
            </Html>
          )
      )}
    </>
  );
};
