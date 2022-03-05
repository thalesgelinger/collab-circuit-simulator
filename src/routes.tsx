import { Routes, Route } from "react-router-dom";
import { Login } from "./pages";

export const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
    </Routes>
  );
};
