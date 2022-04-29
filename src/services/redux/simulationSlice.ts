import { Simulation } from "./../../models/Simulation";
import { createSlice } from "@reduxjs/toolkit";

interface InitialState {
  simulation: Simulation;
}

const initialState = {} as InitialState;

export const simulationSlice = createSlice({
  name: "simulation",
  initialState,
  reducers: {
    addCircuit(state, { payload: circuit }) {
      state.simulation = new Simulation(circuit);
    },
  },
});

export const { addCircuit } = simulationSlice.actions;

export default simulationSlice.reducer;
