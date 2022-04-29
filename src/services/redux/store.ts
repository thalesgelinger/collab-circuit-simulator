import { Simulation } from "./../../models/Simulation";
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import simulationReducer from "./simulationSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    simulation: simulationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export type RootState = ReturnType<typeof store.getState>;
