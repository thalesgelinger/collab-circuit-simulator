import { getDatabase, set, ref, remove } from "firebase/database";
import { Vector2d } from "konva/lib/types";
import {
  Dispatch,
  ElementRef,
  forwardRef,
  ForwardRefRenderFunction,
  SetStateAction,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { Line } from "react-konva";
import { useDispatch, useSelector } from "react-redux";
import { compareObjects } from "..";
import { ComponentType } from "../../../@types";
import { app } from "../../../services/firebase";
import {
  SimulationState,
  updateCooworkerWires,
  updateWires,
} from "../../../services/redux/simulationSlice";
import { RootState } from "../../../services/redux/store";
import { pointerShape } from "../../../utils/pointerShape";

export interface Wire {
  from: Vector2d;
  to: Vector2d;
  nodeValue: string;
}

export interface CooworkerWire {
  id: string;
  from: Vector2d;
  to: Vector2d;
}

interface WiresProps {
  userId: string;
  circuitId: string;
  simulation: SimulationState;
  lastEdited: any;
  onClickWire(index: number): void;
}

interface WiresHandle {
  wire: Wire;
  setWire: Dispatch<SetStateAction<Wire>>;
  wires: Wire[];
  setWires: Dispatch<SetStateAction<Wire[]>>;
  cooworkerWires: CooworkerWire[];
  setCooworkerWires: Dispatch<SetStateAction<CooworkerWire[]>>;
  points: number[];
  isConnectingComponents: boolean;
}

export const Wires = forwardRef<WiresHandle, WiresProps>(
  (
    { lastEdited, userId, simulation: simulationState, circuitId, onClickWire },
    wireRef
  ) => {
    const [wire, setWire] = useState<Wire>({} as Wire);
    const [wires, setWires] = useState<Wire[]>([]);

    const [cooworkerWires, setCooworkerWires] = useState<CooworkerWire[]>([]);

    const isConnectingComponents = !!wire?.from;

    const dispatch = useDispatch();

    const { action } = useSelector((state: RootState) => state.simulation);

    useImperativeHandle(wireRef, () => ({
      wire,
      setWire,
      wires,
      setWires,
      points,
      isConnectingComponents,
      cooworkerWires,
      setCooworkerWires,
    }));

    useEffect(() => {
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          setWire({} as Wire);
        }
      });
    }, []);

    const db = getDatabase(app);

    useEffect(() => {
      console.log("SETOU OS WIRES", wires);
      (async () => {
        dispatch(updateWires(wires));
        if (!!simulationState) {
          console.log("ENVIANDO NOVOS FIOS:", { wires });
          await set(ref(db, `circuits/${circuitId}/wires`), wires);
          await set(
            ref(db, `circuits/${circuitId}/editedBy`),
            lastEdited.current
          );

          lastEdited.current = userId;
        }
      })();
    }, [wires]);

    useEffect(() => {
      console.log("ATENÇÃO AQUI: ", { wire });

      if (!!wire) {
        const indexWireInCooworker = simulationState?.cooworkerWires.findIndex(
          (wire) => wire.id === userId
        );

        if (indexWireInCooworker >= 0) {
          const cooworkerCopy = [...simulationState.cooworkerWires];

          cooworkerCopy[indexWireInCooworker] = {
            id: userId,
            ...wire,
          };
          setCooworkerWires(cooworkerCopy);
        } else {
          const cooworkerWires = simulationState?.cooworkerWires ?? [];

          setCooworkerWires([...cooworkerWires, { ...wire, id: userId }]);
        }
      }
    }, [wire]);

    useEffect(() => {
      console.log("COOWORKER WIRES: ", { cooworkerWires, wire });
      (async () => {
        dispatch(updateCooworkerWires(cooworkerWires));
        if (!!simulationState) {
          console.log("VAI SETAR O COOWORKER");
          await set(
            ref(db, `circuits/${circuitId}/cooworkerWires`),
            cooworkerWires
          );
          await set(
            ref(db, `circuits/${circuitId}/editedBy`),
            lastEdited.current
          );

          lastEdited.current = userId;
        }
      })();
    }, [cooworkerWires]);

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

    const convertToPoints = (wire: Wire) => {
      const { from, to } = wire;
      const curve = getCurvePoint(from, to);
      const points = buildPoints(from, curve, to);
      return points;
    };

    const points = useMemo(() => {
      return convertToPoints(wire);
    }, [wire]);

    return (
      <>
        {wires.map((wire, index) => {
          const points = convertToPoints(wire);
          return (
            <Line
              key={index}
              points={points}
              stroke="#000"
              fill="#000"
              strokeWidth={3}
              onClick={() => {
                onClickWire(index);
              }}
              onMouseOver={pointerShape(action === "edit" ? "copy" : "default")}
              onMouseLeave={pointerShape("default")}
            />
          );
        })}
        {isConnectingComponents && (
          <Line
            points={points}
            stroke="#5b5b5b"
            fill="#5b5b5b"
            strokeWidth={3}
          />
        )}
        {cooworkerWires.map((wire, index) => {
          const points = convertToPoints(wire);
          return (
            <Line
              key={index}
              points={points}
              stroke="#000"
              fill="#000"
              strokeWidth={3}
            />
          );
        })}
      </>
    );
  }
);
