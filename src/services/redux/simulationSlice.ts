import { CircuitType, Simulation } from "./../../models/Simulation";
import { createSlice } from "@reduxjs/toolkit";
import { CooworkerWire, Wire } from "../../pages/Workspace/Wires";
import { Position } from "../../@types/ComponentType";
import { ActionTypes } from "../../components/ActionsToolbar";

export interface SimulationState {
  simulation: Simulation;
  circuit: CircuitType;
  wires: Wire[];
  cooworkerWires: CooworkerWire[];
  intersections: Position[];
  oscilloscopeData: { time: string; [key: string]: string }[];
  isRunning: boolean;
  action: ActionTypes;
}

const initialState = {
  circuit: [] as CircuitType,
  isRunning: false,
  action: "",
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
    updateOscilloscopeData(state, { payload: oscilloscopeData }) {
      state.oscilloscopeData = oscilloscopeData;
    },
    run(state) {
      state.isRunning = true;
    },
    stop(state) {
      state.isRunning = false;
    },
    updateAction(state, { payload: action }) {
      state.action = action;
    },
  },
});

export const {
  addCircuit,
  updateCircuit,
  updateWires,
  updateIntersection,
  updateCooworkerWires,
  updateOscilloscopeData,
  run,
  stop,
  updateAction,
} = simulationSlice.actions;

export default simulationSlice.reducer;
