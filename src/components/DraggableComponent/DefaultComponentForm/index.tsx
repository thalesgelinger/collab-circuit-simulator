import { ChangeEvent, FormEvent, useState } from "react";
import { Html } from "react-konva-utils";
import { Position, ComponentType } from "../../../@types/ComponentType";

type DefaultComponentFormProps = {
  componentData: ComponentType;
  position: Position;
  onSubmit: (component: ComponentType) => void;
};

export const DefaultComponentForm = ({
  componentData,
  position,
  onSubmit,
}: DefaultComponentFormProps) => {
  const [component, setComponent] = useState(componentData);

  const editComponent = (key: keyof ComponentType) => {
    return (evt: ChangeEvent<HTMLInputElement>) => {
      setComponent({ ...component, [key]: evt.target.value });
    };
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
          value={component.name}
          style={{
            width: "100%",
          }}
        />
        <label>Value :</label>
        <input
          type="text"
          onChange={editComponent("value")}
          value={component.value}
          style={{
            width: "100%",
          }}
        />
        <button>Confirm</button>
      </form>
    </Html>
  );
};
