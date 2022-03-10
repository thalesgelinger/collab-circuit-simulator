import { icons } from "./icons";
import styles from "./styles.module.scss";

interface IconProps {
  name: keyof typeof icons;
  size: number;
  color: string;
}

export const Icon = ({ name, size, color }: IconProps) => {
  return (
    <button className={styles.container}>
      <img height={size} width={size} color={color} src={icons[name]} />
    </button>
  );
};
