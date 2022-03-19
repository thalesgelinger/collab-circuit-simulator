import { useSelector } from "react-redux";
import { Routes, Route } from "react-router-dom";
import { Dashboard, Login, Workspace } from "./pages";
import { RootState } from "./services/redux/store";

export const Router = () => {
  const { isLogged } = useSelector((state: RootState) => state.user);
  console.log(isLogged);

  return (
    <Routes>
      <Route path="/" element={<Login />} exact />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/workspace" element={<Workspace />} />
    </Routes>
  );
};
