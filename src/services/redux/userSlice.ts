import { createSlice } from "@reduxjs/toolkit";
import { User } from "firebase/auth";

export const userSlice = createSlice({
  name: "user",
  initialState: {
    user: {} as User,
    isLogged: false,
  },
  reducers: {
    changeUser(state, { payload: user }) {
      console.log({ user });
      state.user = user;
      if (!!user) {
        sessionStorage.setItem("user", JSON.stringify(user));
      }
    },
    logout(state) {
      state.user = {} as any;
      sessionStorage.setItem("user", JSON.stringify({}));
    },
  },
});

export const { changeUser, logout } = userSlice.actions;

export default userSlice.reducer;
