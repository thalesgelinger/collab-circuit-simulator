import { useEffect, useState } from "react";
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
          const netlist = `Basic circuit
            R1 1 2 100
            R2 2 3 100
            R3 3 0 100
            V 1 0 5
            .op
            .end`;

          const netlistResult = await window.runSpice(netlist);
          console.log({ netlistResult });
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
