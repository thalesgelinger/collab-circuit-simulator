import { InputHTMLAttributes } from "react";
import styles from "./styles.module.scss";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = ({ ...rest }: InputProps) => {
  return <input className={styles.input} {...rest} />;
};
