import { Vector2d } from "konva/lib/types";
import {
  Dispatch,
  forwardRef,
  ForwardRefRenderFunction,
  SetStateAction,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { Line } from "react-konva";
import { useDispatch } from "react-redux";
import { ComponentType } from "../../../@types";
import {
  updateWire,
  updateWires,
} from "../../../services/redux/simulationSlice";

export interface Wire {
  from: Vector2d;
  to: Vector2d;
}

interface WiresProps {}

interface WiresHandle {
  wire: Wire;
  setWire: Dispatch<SetStateAction<Wire>>;
  wires: number[][];
  setWires: Dispatch<SetStateAction<number[][]>>;
  points: number[];
  isConnectingComponents: boolean;
}

export const Wires = forwardRef<WiresHandle, WiresProps>((_, ref) => {
  const [wire, setWire] = useState<Wire>({} as Wire);
  const [wires, setWires] = useState<number[][]>([]);

  const isConnectingComponents = !!wire?.from;

  const dispatch = useDispatch();

  useImperativeHandle(ref, () => ({
    wire,
    setWire,
    wires,
    setWires,
    points,
    isConnectingComponents,
  }));

  useEffect(() => {
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setWire({} as Wire);
      }
    });
  }, []);

  useEffect(() => {
    dispatch(updateWires(wires));
  }, [wires]);
  useEffect(() => {
    dispatch(updateWire(wire));
  }, [wire]);

  const getCurvePoint = (from: Vector2d, to: Vector2d) => {
    if (!hasPoints(from, to)) {
      return;
    }

    const dx = Math.abs(from.x - to.x);
    const dy = Math.abs(from.y - to.y);

    const x = dx > dy ? Math.min(from.x, to.x) : Math.max(from.x, to.x);
    const y = x === from.x ? to.y : from.y;

    const curve = { x, y };

    return curve;
  };

  const hasPoints = (...points: Vector2d[]) => {
    return points.every((point) => point?.x && point?.y);
  };

  const buildPoints = (...nodes: Vector2d[] | any[]) => {
    const points = nodes
      .filter((node) => node?.x && node?.y)
      .map((node) => [node.x, node.y])
      .flat();
    return points;
  };

  const points = useMemo(() => {
    const { from, to } = wire;
    const curve = getCurvePoint(from, to);
    const points = buildPoints(from, curve, to);
    return points;
  }, [wire]);

  return (
    <>
      {wires.map((wirePoints, index) => {
        return (
          <Line
            key={index}
            points={wirePoints}
            stroke="#000"
            fill="#000"
            strokeWidth={3}
            onClick={() => {
              console.log("Wire CLicked");
            }}
          />
        );
      })}
      {isConnectingComponents && (
        <Line points={points} stroke="#000" fill="#000" strokeWidth={3} />
      )}
    </>
  );
});
