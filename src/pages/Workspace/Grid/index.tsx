import { useMemo } from "react";
import { Line } from "react-konva";

interface GridProps {
  blockSnapSize: number;
}

export const Grid = ({ blockSnapSize }: GridProps) => {
  const { innerHeight: height, innerWidth: width } = window;

  const columns = useMemo(() => {
    const points = [];
    for (var i = 0; i < width / blockSnapSize; i++) {
      points.push([
        Math.round(i * blockSnapSize) + 0.5,
        0,
        Math.round(i * blockSnapSize) + 0.5,
        height,
      ]);
    }
    return points;
  }, []);

  const rows = useMemo(() => {
    const points = [];
    for (var i = 0; i < height / blockSnapSize; i++) {
      points.push([
        0,
        Math.round(i * blockSnapSize),
        width,
        Math.round(i * blockSnapSize),
      ]);
    }
    return points;
  }, []);

  const grid = {
    columns,
    rows,
  };

  return (
    <>
      {grid.columns.map((points, index) => (
        <Line key={index} points={points} stroke="#ddd" strokeWidth={0.5} />
      ))}
      {grid.rows.map((points, index) => (
        <Line key={index} points={points} stroke="#ddd" strokeWidth={0.5} />
      ))}
    </>
  );
};
