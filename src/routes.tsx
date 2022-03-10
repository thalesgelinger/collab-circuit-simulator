import { Routes, Route } from "react-router-dom";
import { Dashboard, Login, Workspace } from "./pages";

export const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} exact />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/workspace" element={<Workspace />} />
    </Routes>
  );
};
