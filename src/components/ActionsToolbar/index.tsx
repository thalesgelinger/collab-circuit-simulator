import { useEffect, useState } from "react";
import { Icon } from "../Icon";

import styles from "./styles.module.scss";

const ICON_DEFAULT_SIZE = 40;

type ActionTypes = "edit" | "";
interface ActionsToolbarProps {
  onActionChange: (actionType: ActionTypes) => void;
}

export const ActionsToolbar = ({ onActionChange }: ActionsToolbarProps) => {
  const [currentAction, setCurrentAction] = useState<ActionTypes>("");

  useEffect(() => {
    onActionChange(currentAction);
  }, [currentAction]);

  const handleActionsChange = (actionType: ActionTypes) => () => {
    setCurrentAction(actionType === currentAction ? "" : actionType);
  };

  return (
    <section className={styles.container}>
      <Icon name="play" size={ICON_DEFAULT_SIZE} color={"#black"} />
      <Icon
        name="edit"
        size={ICON_DEFAULT_SIZE}
        color={"#black"}
        onClick={handleActionsChange("edit")}
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
