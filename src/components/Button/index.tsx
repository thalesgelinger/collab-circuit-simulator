import { ButtonHTMLAttributes } from "react";
import styles from "./styles.module.scss";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {}

export const Button = ({ children, className, ...rest }: ButtonProps) => {
  return (
    <button className={styles.button} {...rest}>
      {children}
    </button>
  );
};
