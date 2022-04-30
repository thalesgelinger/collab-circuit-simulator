import { useState } from "react";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
} from "chart.js";
import styles from "./styles.module.scss";

export const Oscilloscope = () => {
  const [oscilloscopeOn, setOscilloscopeOn] = useState(false);

  return (
    <section className={styles.container}>
      <div className={styles.buttoOsci}>
        <button
          onClick={() => setOscilloscopeOn(!oscilloscopeOn)}
          className={styles.buttoZoomOsci}
        >
          Ampliar
        </button>
        {oscilloscopeOn && <div className={styles.display}>oiii</div>}
      </div>
    </section>
  );
};
