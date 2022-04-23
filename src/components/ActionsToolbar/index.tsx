import { useEffect, useState } from "react";
import { Simulation } from "../../models/Simulation";
import { Icon } from "../Icon";

import styles from "./styles.module.scss";

// import { runSpice } from "../../wasm/runner.js";

const ICON_DEFAULT_SIZE = 40;

type ActionTypes = "edit" | "";
interface ActionsToolbarProps {
  onActionChange: (actionType: ActionTypes) => void;
}

export const ActionsToolbar = ({ onActionChange }: ActionsToolbarProps) => {
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
          const circuit = [
            {
              type: "source",
              ref: "V1",
              value: "5",
              nodes: {
                positive: "1",
                negative: "0",
              },
            },
            {
              type: "resistor",
              ref: "R1",
              value: "100",
              nodes: {
                positive: "1",
                negative: "2",
              },
            },
            {
              type: "resistor",
              ref: "R2",
              value: "100",
              nodes: {
                positive: "2",
                negative: "3",
              },
            },
            {
              type: "resistor",
              ref: "R3",
              value: "100",
              nodes: {
                positive: "3",
                negative: "0",
              },
            },
          ];

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
