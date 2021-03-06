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
import { useSelector } from "react-redux";
import { RootState } from "../../../services/redux/store";
import Konva from "konva";
import { formatToSi } from "../../../utils/formatToSI";

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

  const [dataset, setData] = useState<any[]>([]);

  const { simulation, oscilloscopeData, isRunning } = useSelector(
    (state: RootState) => state.simulation
  );

  useEffect(() => {
    if (!isRunning) {
      setData([]);
    }
  }, [isRunning]);

  useEffect(() => {
    if (!!simulation && !!oscilloscopeData?.length) {
      if (!!dataset.length) {
        setData((data) =>
          data.map((value, i) => ({
            ...value,
            ...oscilloscopeData[i],
          }))
        );
      } else {
        setData(oscilloscopeData);
      }
    }
  }, [oscilloscopeData]);

  const formatDatasetToGraph = (dataset: any[]) => {
    if (!dataset.length) {
      return [
        {
          label: "Placeholder",
          data: [],
          borderColor: Konva.Util.getRandomColor(),
          backgroundColor: Konva.Util.getRandomColor(),
          yAxisID: "y",
        },
      ];
    }

    const { time, ...nodes } = dataset[0];

    const datasetFormatted = Object.keys(nodes).map((key) => {
      const color = Konva.Util.getRandomColor();

      return {
        label: `${key}v`,
        data: dataset.map((s) => s[key]),
        borderColor: color,
        backgroundColor: color,
        yAxisID: "y",
      };
    });
    return datasetFormatted;
  };

  const data = {
    labels: dataset.map((s) => `${formatToSi(Number(s.time))}s`),
    datasets: formatDatasetToGraph(dataset),
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
      },
    });
  }, [dataset]);

  return !!oscilloscopeData?.length ? (
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
  ) : (
    <></>
  );
};
