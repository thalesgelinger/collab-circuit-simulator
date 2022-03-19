import { useSelector } from "react-redux";
import { Routes, Route } from "react-router-dom";
import { Dashboard, Login } from "./pages";
import { RootState } from "./services/redux/store";

export const Router = () => {
  const { isLogged } = useSelector((state: RootState) => state.user);
  console.log(isLogged);

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
};
