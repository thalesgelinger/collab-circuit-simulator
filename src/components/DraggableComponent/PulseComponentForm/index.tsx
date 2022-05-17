import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Html } from "react-konva-utils";
import { Position, ComponentType } from "../../../@types/ComponentType";

type PulseComponentFormProps = {
  componentData: ComponentType;
  position: Position;
  onSubmit: (component: ComponentType) => void;
};

type PulseFormType = {
  initialValue: number;
  pulsedValue: number;
  delayTime: number;
  riseTime: number;
  fallTime: number;
  pulseWidth: number;
  period: number;
  phase: number;
};

export const PulseComponentForm = ({
  componentData,
  position,
  onSubmit,
}: PulseComponentFormProps) => {
  const [component, setComponent] = useState(componentData);

  const [pulseForm, setPulseForm] = useState<PulseFormType>({
    initialValue: 0,
    pulsedValue: 0,
    delayTime: 0,
    riseTime: 0,
    fallTime: 0,
    pulseWidth: 0,
    period: 0,
    phase: 0,
  });

  useEffect(() => {
    setPulseForm((pulseForm) =>
      Object.keys(pulseForm).reduce((acc, current, i) => {
        return {
          ...acc,
          [current]: getValueFormatedToPulseForm()[i],
        };
      }, {} as PulseFormType)
    );
  }, []);

  useEffect(() => {
    setComponent({ ...component, value: getPulseValueFormatter() });
  }, [pulseForm]);

  const getValueFormatedToPulseForm = () => {
    return componentData?.value
      .replace("PULSE (", "")
      .replace(")", "")
      .split(" ");
  };

  const getPulseValueFormatter = () => {
    const valueFormatter = Object.values(pulseForm).join(" ");
    return `PULSE (${valueFormatter})`;
  };

  const editValue = (key: keyof PulseFormType) => {
    return ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
      setPulseForm((pulseForm) => ({ ...pulseForm, [key]: value }));
    };
  };

  const editName = (evt: ChangeEvent<HTMLInputElement>) => {
    setComponent({ ...component, name: evt.target.value });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log({ componentONSuybmit: component });

    onSubmit(component);
  };

  return (
    <Html
      divProps={{
        style: {
          position: "absolute",
        },
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          position: "absolute",
          top: position.y,
          left: position.x,
          width: 150,
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
          onChange={editName}
          value={component.name}
          style={{
            width: "100%",
          }}
        />
        {Object.keys(pulseForm).map((key) => (
          <>
            <label>{key}:</label>
            <input
              type="text"
              onChange={editValue(key as keyof PulseFormType)}
              value={pulseForm[key as keyof PulseFormType]}
              style={{
                width: "100%",
              }}
            />
          </>
        ))}
        <button>Confirm</button>
      </form>
    </Html>
  );
};
