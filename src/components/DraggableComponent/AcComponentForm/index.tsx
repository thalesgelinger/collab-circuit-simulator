import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Html } from "react-konva-utils";
import { Position, ComponentType } from "../../../@types/ComponentType";

type AcComponentFormProps = {
  componentData: ComponentType;
  position: Position;
  onSubmit: (component: ComponentType) => void;
};

type AcFormType = {
  offset: number;
  amplitude: number;
  frequency: number;
  delay: number;
  theta: number;
  phase: number;
};

export const AcComponentForm = ({
  componentData,
  position,
  onSubmit,
}: AcComponentFormProps) => {
  const [component, setComponent] = useState(componentData);

  const [acForm, setAcForm] = useState<AcFormType>({
    offset: 0,
    amplitude: 0,
    frequency: 0,
    delay: 0,
    theta: 0,
    phase: 0,
  });

  useEffect(() => {
    setAcForm((acForm) =>
      Object.keys(acForm).reduce((acc, current, i) => {
        return {
          ...acc,
          [current]: getValueFormatedToAcForm()[i],
        };
      }, {} as AcFormType)
    );
  }, []);

  useEffect(() => {
    setComponent({ ...component, value: getAcValueFormatter() });
  }, [acForm]);

  const getValueFormatedToAcForm = () => {
    return componentData?.value
      .replace("SIN (", "")
      .replace(")", "")
      .split(" ");
  };

  const getAcValueFormatter = () => {
    const valueFormatter = Object.values(acForm).join(" ");
    return `SIN (${valueFormatter})`;
  };

  const editValue = (key: keyof AcFormType) => {
    return ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
      setAcForm((acForm) => ({ ...acForm, [key]: value }));
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
        {Object.keys(acForm).map((key) => (
          <>
            <label>{key}:</label>
            <input
              type="text"
              onChange={editValue(key as keyof AcFormType)}
              value={acForm[key as keyof AcFormType]}
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
