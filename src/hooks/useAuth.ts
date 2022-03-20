import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState } from "../services/redux/store";

export const useAuth = () => {
  const user = useSelector((state: RootState) => state.user);

  const navigate = useNavigate();

  useEffect(() => {
    if (!user.isLogged) {
      navigate("/");
    }
  }, [user.isLogged]);

  return { user };
};
