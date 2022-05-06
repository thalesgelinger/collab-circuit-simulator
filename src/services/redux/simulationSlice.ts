import { CircuitType, Simulation } from "./../../models/Simulation";
import { createSlice } from "@reduxjs/toolkit";

export type ActionTypes = "edit" | "remove" | "rotate" | "";

interface InitialState {
  simulation: Simulation;
  circuit: CircuitType;
  action: ActionTypes;
}

const initialState = {
  circuit: [] as CircuitType,
  action: "",
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
  },
});

export const { addCircuit, updateCircuit } = simulationSlice.actions;

export default simulationSlice.reducer;
