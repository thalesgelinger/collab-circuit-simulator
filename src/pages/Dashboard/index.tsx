import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button, CircuitCard } from "../../components";

import defaultUser from "../../assets/icons/user.png";

import circuitSample from "../../assets/circuit-sample.png";

import styles from "./styles.module.scss";
import { CircuitCardType } from "../../@types";
import { RootState } from "../../services/redux/store";
import { logout } from "../../services/redux/userSlice";

export const Dashboard = () => {
  const { user } = useSelector((state: RootState) => state.user);
  const [myCircuits, setMyCircuits] = useState<CircuitCardType[]>(
    Array(20)
      .fill(1)
      .map((_, i) => ({ img: circuitSample, name: i.toString() }))
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();

  console.log(user);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  return (
    <div className={styles.container}>
      <aside>
        <a onClick={handleLogout}>sair</a>
        <img src={user.photoURL ? user.photoURL : defaultUser} alt="user" />
        <span>{user.displayName}</span>
        <Button style={{ background: "#ffffff", color: "#000000" }}>
          Novo circuito +
        </Button>
      </aside>
      <main>
        {myCircuits.map(({ img, name }, key) => (
          <CircuitCard key={key} img={img} name={name} />
        ))}
      </main>
    </div>
  );
};
