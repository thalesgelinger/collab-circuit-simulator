import { useState } from "react";
import { Button, CircuitCard } from "../../components";

import defaultUser from "../../assets/icons/user.png";

import circuitSample from "../../assets/circuit-sample.png";

import styles from "./styles.module.scss";
import { CircuitCardType } from "../../@types";

export const Dashboard = () => {
  const [myCircuits, setMyCircuits] = useState<CircuitCardType[]>(
    Array(20)
      .fill(1)
      .map((_, i) => ({ img: circuitSample, name: i.toString() }))
  );

  return (
    <div className={styles.container}>
      <aside>
        <a>sair</a>
        <img src={defaultUser} alt="user" />
        <span>username</span>
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
