import { createSlice } from "@reduxjs/toolkit";
import { User } from "firebase/auth";

export const slice = createSlice({
  name: "batata",
  initialState: {
    user: {} as User,
    isLogged: false,
  },
  reducers: {
    changeUser(state, { payload }) {
      state.isLogged = true;
      state.user = payload.user;
    },
    logout(state) {
      state.isLogged = false;
      state.user = {} as any;
    },
  },
});

export const { changeUser, logout } = slice.actions;

export default slice.reducer;
