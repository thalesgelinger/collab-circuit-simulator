import { useSelector } from "react-redux";
import { Routes, Route } from "react-router-dom";
import { Login } from "./pages";

export const Router = () => {
  const { isLogged } = useSelector((state: any) => state.user);
  console.log(isLogged);

  return (
    <Routes>
      <Route path="/" element={<Login />} />
    </Routes>
  );
};
