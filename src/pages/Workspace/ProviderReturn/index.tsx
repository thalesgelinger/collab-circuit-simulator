import { useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../services/redux/store";

type ProviderReturnProps = {
  returnState: (state: RootState) => void;
};

export const ProviderReturn = ({ returnState }: ProviderReturnProps) => {
  const state = useSelector((state: RootState) => state);

  useEffect(() => {
    returnState(state);
  }, [state]);

  return <></>;
};
