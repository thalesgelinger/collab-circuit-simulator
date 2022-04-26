import { useEffect, useState } from "react";
import { ComponentType } from "../../@types";
import { Simulation } from "../../models/Simulation";
import { Icon } from "../Icon";

import styles from "./styles.module.scss";

// import { runSpice } from "../../wasm/runner.js";

const ICON_DEFAULT_SIZE = 40;

type ActionTypes = "edit" | "";
interface ActionsToolbarProps {
  onActionChange: (actionType: ActionTypes) => void;
  circuit: CircuitType;
}

export const ActionsToolbar = ({
  onActionChange,
  circuit,
}: ActionsToolbarProps) => {
  const [currentAction, setCurrentAction] = useState<ActionTypes>("");

  useEffect(() => {
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setCurrentAction("");
      }
    });
  }, []);

  useEffect(() => {
    onActionChange(currentAction);
  }, [currentAction]);

  const handleActionsChange = (actionType: ActionTypes) => () => {
    setCurrentAction(actionType === currentAction ? "" : actionType);
  };

  return (
    <section className={styles.container}>
      <Icon
        name="play"
        size={ICON_DEFAULT_SIZE}
        color={"#black"}
        onClick={async () => {
          console.log({ circuit });
          const simulation = new Simulation();
          await simulation.start(circuit);
          const netlistResult = simulation.getData();
          const nodes = simulation.getVoltageNodes();
          console.log({ netlistResult, nodes });
        }}
      />
      <Icon
        name="edit"
        size={ICON_DEFAULT_SIZE}
        color={"#black"}
        onClick={handleActionsChange("edit")}
        style={{ opacity: currentAction === "edit" ? 0.5 : 1 }}
      />
      <Icon name="print" size={ICON_DEFAULT_SIZE} color={"#black"} />
      <Icon name="share" size={ICON_DEFAULT_SIZE} color={"#black"} />
      <Icon name="trash" size={ICON_DEFAULT_SIZE} color={"#black"} />
      <Icon name="left-curly-arrow" size={ICON_DEFAULT_SIZE} color={"#black"} />
      <Icon
        name="right-curly-arrow"
        size={ICON_DEFAULT_SIZE}
        color={"#black"}
      />
      <Icon name="close" size={ICON_DEFAULT_SIZE} color={"#black"} />
    </section>
  );
};
