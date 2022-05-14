import { CircuitType, Simulation } from "./../../models/Simulation";
import { createSlice } from "@reduxjs/toolkit";
import { CooworkerWire, Wire } from "../../pages/Workspace/Wires";
import { Position } from "../../@types/ComponentType";

export interface SimulationState {
  simulation: Simulation;
  circuit: CircuitType;
  wires: number[][];
  cooworkerWires: CooworkerWire[];
  intersections: Position[];
}

const initialState = {
  circuit: [] as CircuitType,
} as SimulationState;

export const simulationSlice = createSlice({
  name: "simulation",
  initialState,
  reducers: {
    addCircuit(state, { payload: circuit }) {
      state.simulation = new Simulation(circuit);
    },
    updateCircuit(state, { payload: circuit }) {
      state.circuit = circuit;
    },
    updateWires(state, { payload: wires }) {
      state.wires = wires;
    },
    updateIntersection(state, { payload: intersections }) {
      state.intersections = intersections;
    },
    updateCooworkerWires(state, { payload: cooworkerWires }) {
      state.cooworkerWires = cooworkerWires;
    },
  },
});

export const {
  addCircuit,
  updateCircuit,
  updateWires,
  updateIntersection,
  updateCooworkerWires,
} = simulationSlice.actions;

export default simulationSlice.reducer;
