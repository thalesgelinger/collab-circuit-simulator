import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button, CircuitCard } from "../../components";

import defaultUser from "/assets/icons/user.png";

import styles from "./styles.module.scss";
import { CircuitCardType } from "../../@types";
import { logout } from "../../services/redux/userSlice";
import { useAuth } from "../../hooks/useAuth";
import { get, getDatabase, onValue, ref, set, remove } from "firebase/database";
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
        console.log({ snaoshotNoDashBoard: snapshot.val() });
        if (!!snapshot.val()) {
          setMyCircuits(snapshot.val());
        }
      });
    }
  }, [user]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const createNewCircuit = async () => {
    const hash = Math.random().toString(36).substring(7);

    await set(ref(db, `users/${user.uid}/${myCircuits.length}`), {
      id: hash,
      name: `Circuit ${myCircuits.length + 1}`,
    });

    navigate(`/workspace/${hash}`);
  };

  const handleCardClick = (hash: string) => {
    navigate(`/workspace/${hash}`);
  };

  const handleRemove = (id: string) => async () => {
    const db = getDatabase(app);

    const circuitsUpdated = myCircuits.filter((circuit) => circuit.id !== id);

    await set(ref(db, `users/${user.uid}`), circuitsUpdated);
    await remove(ref(db, `circuits/${id}`));
    setMyCircuits(circuitsUpdated);
  };

  return (
    <div className={styles.container}>
      <aside>
        <a onClick={handleLogout}>sair</a>
        <div>
          <img src={user.photoURL ? user.photoURL : defaultUser} alt="user" />
        </div>
        <span>{user.displayName}</span>
        <Button
          onClick={createNewCircuit}
          style={{ background: "#079ca1c5", color: "white" }}
        >
          Novo circuito +
        </Button>
      </aside>
      <main>
        {!!myCircuits?.length ? (
          myCircuits.map(({ id, img, name }) => (
            <CircuitCard
              key={id}
              id={id}
              img={img}
              name={name}
              onClick={handleCardClick}
              onRemove={handleRemove(id)}
            />
          ))
        ) : (
          <span className={styles.nocircuitmessage}>
            Você ainda não tem nenhum circuito, pressione Novo Circuito para
            começar
          </span>
        )}
      </main>
    </div>
  );
};
