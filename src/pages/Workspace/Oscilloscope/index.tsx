import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

import styles from "./styles.module.scss";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const Oscilloscope = () => {
  const [oscilloscopeOn, setOscilloscopeOn] = useState(true);
  const [chartData, setChartData] = useState({
    datasets: [],
  });
  const [chartOptions, setChartOptions] = useState({});
  const data = {
    labels: [1, 2, 3, 4],
    datasets: [
      {
        label: "Dataset 1",
        data: [1, 2, 1, 3],
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        yAxisID: "y",
      },
      // {
      //   label: "Dataset 2",
      //   data: ["January", "February", "March", "April", "May", "June", "July"],
      //   borderColor: "rgb(53, 162, 235)",
      //   backgroundColor: "rgba(53, 162, 235, 0.5)",
      //   yAxisID: "y1",
      // },
    ],
  };

  useEffect(() => {
    setChartData(data);

    setChartOptions({
      responsive: true,
      interaction: {
        mode: "index" as const,
        intersect: false,
      },
      stacked: false,
      plugins: {
        title: {
          display: true,
          text: "Chart.js Line Chart - Multi Axis",
        },
      },
      scales: {
        y: {
          type: "linear" as const,
          display: true,
          position: "left" as const,
        },
        y1: {
          type: "linear" as const,
          display: true,
          position: "right" as const,
          grid: {
            drawOnChartArea: false,
          },
        },
      },
    });
  }, []);

  return (
    <section className={styles.container}>
      <div className={styles.buttoOsci}>
        <button
          onClick={() => setOscilloscopeOn(!oscilloscopeOn)}
          className={styles.buttoZoomOsci}
        >
          Ampliar
        </button>
        {oscilloscopeOn && (
          <div className={styles.display}>
            <Line options={chartOptions} data={chartData} height={80} />;
          </div>
        )}
      </div>
    </section>
  );
};

const labels = ["January", "February", "March", "April", "May", "June", "July"];
