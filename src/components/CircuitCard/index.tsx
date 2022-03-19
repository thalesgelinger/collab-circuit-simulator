import { CircuitCardType } from "../../@types";

import styles from "./styles.module.scss";

export const CircuitCard = ({ img, name }: CircuitCardType) => {
  return (
    <div className={styles.container}>
      <img src={img} alt={name} />
      <span>{name}</span>
    </div>
  );
};
