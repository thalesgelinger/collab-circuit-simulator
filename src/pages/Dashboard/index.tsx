import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button, CircuitCard } from "../../components";

import defaultUser from "../../assets/icons/user.png";

import circuitSample from "../../assets/circuit-sample.png";

import styles from "./styles.module.scss";
import { CircuitCardType } from "../../@types";
import { logout } from "../../services/redux/userSlice";
import { useAuth } from "../../hooks/useAuth";
import { get, getDatabase, onValue, ref, set } from "firebase/database";
import { app } from "../../services/firebase";

export const Dashboard = () => {
  const [myCircuits, setMyCircuits] = useState<CircuitCardType[]>([]);
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const db = getDatabase(app);

  useEffect(() => {
    console.log({ userId: user.uid });
    if (!!user?.uid) {
      get(ref(db, `users/${user.uid}`)).then((snapshot) => {
        setMyCircuits(snapshot.val() ?? []);
      });
    }
  }, []);

  useEffect(() => {
    console.log({ myCircuits });
  }, [myCircuits]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const createNewCircuit = async () => {
    const hash = Math.random().toString(36).substring(7);

    await set(ref(db, `users/${user.uid}`), [
      ...myCircuits,
      { id: hash, name: `Circuit ${myCircuits.length + 1}` },
    ]);

    navigate(`/workspace/${hash}`);
  };

  const handleCardClick = (hash: string) => {
    navigate(`/workspace/${hash}`);
  };

  return (
    <div className={styles.container}>
      <aside>
        <a onClick={handleLogout}>sair</a>
        <img src={user.photoURL ? user.photoURL : defaultUser} alt="user" />
        <span>{user.displayName}</span>
        <Button
          onClick={createNewCircuit}
          style={{ background: "#ffffff", color: "#000000" }}
        >
          Novo circuito +
        </Button>
      </aside>
      <main>
        {myCircuits.map(({ id, img, name }) => (
          <CircuitCard
            key={id}
            id={id}
            img={img}
            name={name}
            onClick={handleCardClick}
          />
        ))}
      </main>
    </div>
  );
};
