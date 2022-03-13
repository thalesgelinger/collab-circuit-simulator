import { Icon } from "../Icon";

import styles from "./styles.module.scss";

const ICON_DEFAULT_SIZE = 40;

export const ActionsToolbar = () => {
  return (
    <section className={styles.container}>
      <Icon name="play" size={ICON_DEFAULT_SIZE} color={"#black"} />
      <Icon name="edit" size={ICON_DEFAULT_SIZE} color={"#black"} />
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
