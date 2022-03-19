import { useEffect, useState } from "react";
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
  const [myCircuits, setMyCircuits] = useState<CircuitCardType[]>(
    Array(20)
      .fill(1)
      .map((_, i) => ({ img: circuitSample, name: i.toString() }))
  );
  const user = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  useEffect(() => {
    if (!user.isLogged) {
      navigate("/");
    }
  }, [user.isLogged]);

  return (
    <div className={styles.container}>
      <aside>
        <a onClick={handleLogout}>sair</a>
        <img
          src={user.user.photoURL ? user.user.photoURL : defaultUser}
          alt="user"
        />
        <span>{user.user.displayName}</span>
        <Button
          onClick={() => navigate("/workspace")}
          style={{ background: "#ffffff", color: "#000000" }}
        >
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
