import { useReducer, useState } from "react";
import { useDispatch } from "react-redux";
import {
  getAuth,
  signInWithEmailAndPassword,
  FacebookAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { Button, Input } from "../../components";
import app from "../../services/firebase";
import {
  Alert,
  Eye,
  GoogleIcon,
  FacebookIcon,
  Hidden,
} from "../../assets/index";

import styles from "./styles.module.scss";
import { changeUser } from "../../services/redux/userSlice";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [viewPassword, togglePasswordView] = useReducer(
    (state) => !state,
    false
  );
  const [error, setError] = useState(false);
  const auth = getAuth(app);
  const dispatch = useDispatch();

  const actionEmailAndPassword = async () => {
    try {
      const response = await signInWithEmailAndPassword(auth, email, password);
      dispatch(changeUser(response));
      setError(false);
    } catch (error) {
      setError(true);
    }
  };

  const actionLoginFacebook = async () => {
    try {
      const provider = new FacebookAuthProvider();
      const response = await signInWithPopup(auth, provider);
      dispatch(changeUser(response));
      setError(false);
    } catch (error) {
      setError(true);
    }
  };

  const actionLoginGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const response = await signInWithPopup(auth, provider);
      dispatch(changeUser(response));
      setError(false);
    } catch (error) {
      setError(true);
    }
  };

  return (
    <div className={styles.container}>
      <main>
        <span className={styles.title}>Colaborative Circuit Simulator</span>
        <Input
          onChange={(event) => setEmail(event.target.value)}
          value={email}
          placeholder="Email"
        />
        <div className={styles.passwordContainer}>
          <Input
            onChange={(event) => setPassword(event.target.value)}
            value={password}
            placeholder="Senha"
            type={!viewPassword ? "password" : ""}
          />
          <button onClick={togglePasswordView} className={styles.viewPassword}>
            <img
              className={styles.imagePassword}
              src={viewPassword ? Hidden : Eye}
              alt=""
            />
          </button>
        </div>
        <Button
          style={{ background: "#079ca1c5" }}
          onClick={actionEmailAndPassword}
        >
          Entrar
        </Button>
        {error && (
          <div className={styles.errorView}>
            <img src={Alert} alt="" />
            <span className={styles.errorText}>
              Email ou senha está invalido
            </span>
          </div>
        )}
        <div className={styles.lineContainer}>
          <div className={styles.line} />
          <span>ou</span>
          <div className={styles.line} />
        </div>
        <Button style={{ background: "#db4939c5" }} onClick={actionLoginGoogle}>
          <img src={GoogleIcon} alt="" />
          <span className={styles.textButton}>Continuar com Google</span>
        </Button>
        <Button
          style={{ background: "#3b5898c5" }}
          onClick={actionLoginFacebook}
        >
          <img src={FacebookIcon} alt="" />
          <span className={styles.textButton}>Continuar com Facebook</span>
        </Button>
      </main>
    </div>
  );
};
