import { Button, Input } from "../../components";
import { signInWithGoogle } from "../../services/firebase";
import { SocialButton } from "./components/SocialButton";

import styles from "./styles.module.scss";

export const Login = () => {
  const onGooglePress = async () => {
    const user = await signInWithGoogle();
    console.log({ user });
  };

  return (
    <div className={styles.container}>
      <main>
        <SocialButton>Entrar com Google</SocialButton>
        <SocialButton>Entrar com Facebook</SocialButton>
        <span>ou</span>
        <Input placeholder="Email" />
        <Input placeholder="Senha" />
        <Button>Entrar</Button>
      </main>
    </div>
  );
};
