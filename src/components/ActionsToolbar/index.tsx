import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ComponentType } from "../../@types";
import { Simulation } from "../../models/Simulation";
import { addCircuit } from "../../services/redux/simulationSlice";
import { RootState } from "../../services/redux/store";
import { Icon } from "../Icon";

import styles from "./styles.module.scss";

// import { runSpice } from "../../wasm/runner.js";

const ICON_DEFAULT_SIZE = 40;

type ActionTypes =
  | "edit"
  | "goback"
  | "simulate"
  | "simulatestop"
  | "print"
  | "rotate"
  | "remove"
  | "";

interface ActionsToolbarProps {
  onActionChange: (actionType: ActionTypes) => void;
  circuit: ComponentType[];
}

export const ActionsToolbar = ({
  circuit,
  onActionChange,
}: ActionsToolbarProps) => {
  const [action, setAction] = useState("");

  const dispatch = useDispatch();

  useEffect(() => {
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setAction("");
        onActionChange("");
      }
    });
  }, []);

  const handleActionsChange = (actionType: ActionTypes) => () => {
    console.log({ actionType });

    const updatedAction = actionType === action ? "" : actionType;

    setAction(updatedAction);
    onActionChange(updatedAction);

    setTimeout(() => {
      if (["print", "goback"].includes(actionType)) {
        setAction("");
        onActionChange("");
      }
    }, 500);
  };

  return (
    <section className={styles.container}>
      <Icon
        name={action === "simulate" ? "pause" : "play"}
        size={ICON_DEFAULT_SIZE}
        color={"#black"}
        onClick={async () => {
          setAction(action === "simulate" ? "simulatestop" : "simulate");
          onActionChange(action === "simulate" ? "simulatestop" : "simulate");
        }}
      />
      <Icon
        name="edit"
        size={ICON_DEFAULT_SIZE}
        color={"#black"}
        onClick={handleActionsChange("edit")}
        style={{
          border: `1px solid ${action === "edit" ? "black" : "transparent"}`,
          borderRadius: ICON_DEFAULT_SIZE / 4,
        }}
      />
      <Icon
        name="print"
        size={ICON_DEFAULT_SIZE}
        color={"#black"}
        onClick={handleActionsChange("print")}
        style={{
          border: `1px solid ${action === "print" ? "black" : "transparent"}`,
          borderRadius: ICON_DEFAULT_SIZE / 4,
        }}
      />
      <Icon
        name="share"
        size={ICON_DEFAULT_SIZE}
        color={"#black"}
        onClick={async () => {
          await navigator.clipboard.writeText(window.location.href);
          alert(
            "URL do circuito copiado para área de transferencia, compartilhe com um colega para começarem a trabalhar em equipe"
          );
        }}
      />
      <Icon
        name="rotate"
        size={ICON_DEFAULT_SIZE}
        color={"#black"}
        onClick={handleActionsChange("rotate")}
        style={{
          border: `1px solid ${action === "rotate" ? "black" : "transparent"}`,
          borderRadius: ICON_DEFAULT_SIZE / 4,
        }}
      />
      <Icon
        name="trash"
        size={ICON_DEFAULT_SIZE}
        color={"#black"}
        onClick={handleActionsChange("remove")}
        style={{
          border: `1px solid ${action === "remove" ? "black" : "transparent"}`,
          borderRadius: ICON_DEFAULT_SIZE / 4,
        }}
      />

      <Icon
        name="back"
        size={ICON_DEFAULT_SIZE}
        color={"#black"}
        onClick={handleActionsChange("goback")}
      />
    </section>
  );
};
