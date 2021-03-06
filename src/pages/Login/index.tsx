import { FormEventHandler, useEffect, useReducer, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getAuth,
  signInWithEmailAndPassword,
  FacebookAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
  User,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { Button, Input } from "../../components";
import { app } from "../../services/firebase";
import {
  Alert,
  Eye,
  GoogleIcon,
  FacebookIcon,
  Hidden,
} from "../../assets/icons";
import { changeUser } from "../../services/redux/userSlice";
import styles from "./styles.module.scss";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [viewPassword, togglePasswordView] = useReducer(
    (state) => !state,
    false
  );
  const [error, setError] = useState(false);
  const auth = getAuth(app);
  const navigate = useNavigate();

  const location = useLocation();

  const dispatch = useDispatch();

  const [user, setUser] = useState<User>({} as User);

  useEffect(() => {
    if (!!user?.uid) {
      if (!!location?.state?.from?.pathname) {
        navigate(location?.state?.from?.pathname);
      } else {
        navigate("/dashboard");
      }
    }
  }, [user]);

  const actionEmailAndPassword = async (
    e: FormEventHandler<HTMLFormElement>,
    isNewUser = false
  ) => {
    e.preventDefault();
    try {
      const fn = isNewUser
        ? createUserWithEmailAndPassword
        : signInWithEmailAndPassword;
      const response = await fn(auth, email, password);
      dispatch(changeUser(response.user));
      setUser(response.user);
      setError(false);
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        actionEmailAndPassword(e, true);
      }
      setError(true);
    }
  };

  const actionLoginFacebook = async () => {
    try {
      const provider = new FacebookAuthProvider();
      const response = await signInWithPopup(auth, provider);
      dispatch(changeUser(response.user));
      setUser(response.user);
      setError(false);
    } catch (error) {
      setError(true);
    }
  };

  const actionLoginGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const response = await signInWithPopup(auth, provider);
      dispatch(changeUser(response.user));
      setUser(response.user);
      setError(false);
    } catch (error) {
      console.log(error);
      setError(true);
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={actionEmailAndPassword}>
        <span className={styles.title}>
          Simulador de circuitos colaborativo
        </span>
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
        <Button style={{ background: "#079ca1c5" }} type="submit">
          Entrar
        </Button>
        {error && (
          <div className={styles.errorView}>
            <img src={Alert} alt="" />
            <span className={styles.errorText}>
              Email ou senha est?? invalido
            </span>
          </div>
        )}
        <div className={styles.lineContainer}>
          <div className={styles.line} />
          <span>ou</span>
          <div className={styles.line} />
        </div>
        <Button
          style={{ background: "#db4939c5" }}
          onClick={actionLoginGoogle}
          type="button"
        >
          <img src={GoogleIcon} alt="" />
          <span className={styles.textButton}>Continuar com Google</span>
        </Button>
        {/* <Button
          style={{ background: "#3b5898c5" }}
          onClick={actionLoginFacebook}
          type="button"
        >
          <img src={FacebookIcon} alt="" />
          <span className={styles.textButton}>Continuar com Facebook</span>
        </Button> */}
      </form>
    </div>
  );
};
