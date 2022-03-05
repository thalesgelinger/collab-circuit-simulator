import { Button } from "../../../../ components";
import { ButtonProps } from "../../../../ components/Button";

export const SocialButton = ({ children, ...rest }: ButtonProps) => (
  <Button
    style={{
      background: "#ffffff",
      color: "#000000",
      fontWeight: "bold",
    }}
    {...rest}
  >
    {children}
  </Button>
);
