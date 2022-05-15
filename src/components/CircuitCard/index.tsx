import { CircuitCardType } from "../../@types";

import styles from "./styles.module.scss";

export const CircuitCard = ({ id, img, name, onClick }: CircuitCardType) => {
  return (
    <div className={styles.container} onClick={() => onClick(id)}>
      <img src={img} alt={name} />
      <span>{name}</span>
    </div>
  );
};
