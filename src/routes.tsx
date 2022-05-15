import { Routes, Route } from "react-router-dom";
import { Dashboard, Login, Workspace } from "./pages";

export const Router = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/workspace/:id" element={<Workspace />} />
    </Routes>
  );
};
