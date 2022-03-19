import { ButtonHTMLAttributes } from "react";
import { icons } from "./icons";
import styles from "./styles.module.scss";

interface IconProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  name: keyof typeof icons;
  size: number;
  color: string;
}

export const Icon = ({ name, size, color, ...rest }: IconProps) => {
  return (
    <button className={styles.container} {...rest}>
      <img height={size} width={size} color={color} src={icons[name]} />
    </button>
  );
};
