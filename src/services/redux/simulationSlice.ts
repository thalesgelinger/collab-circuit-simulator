import { CircuitType, Simulation } from "./../../models/Simulation";
import { createSlice } from "@reduxjs/toolkit";
import { Wire } from "../../pages/Workspace/Wires";

interface InitialState {
  simulation: Simulation;
  circuit: CircuitType;
  wires: number[][];
  wire: Wire;
}

const initialState = {
  circuit: [] as CircuitType,
} as InitialState;

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
    updateWire(state, { payload: wire }) {
      state.wire = wire;
    },
  },
});

export const { addCircuit, updateCircuit, updateWire, updateWires } =
  simulationSlice.actions;

export default simulationSlice.reducer;
