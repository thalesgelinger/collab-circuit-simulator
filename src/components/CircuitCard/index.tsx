import { getDatabase, ref, remove } from "firebase/database";
import { CircuitCardType } from "../../@types";
import { app } from "../../services/firebase";

import styles from "./styles.module.scss";

export const CircuitCard = ({
  id,
  img,
  name,
  onClick,
  onRemove,
}: CircuitCardType) => {
  return (
    <div className={styles.container}>
      <span onClick={onRemove}>x</span>
      <div onClick={() => onClick(id)}>
        <img src={img} alt={name} />
        <span>{name}</span>
      </div>
    </div>
  );
};
