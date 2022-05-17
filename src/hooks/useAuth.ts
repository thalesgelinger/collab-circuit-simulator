import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { RootState } from "../services/redux/store";
import { changeUser } from "../services/redux/userSlice";

export const useAuth = () => {
  const user = useSelector((state: RootState) => state.user.user);

  const location = useLocation();

  const dispatch = useDispatch();

  useEffect(() => {
    const userString = sessionStorage.getItem("user");
    const userStoraged = JSON.parse(userString);
    console.log({ userStoraged });
    if (!!userStoraged?.uid) {
      dispatch(changeUser(user));
    }
  }, [user]);

  return { user, lastLocation: location };
};
