import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "./initialize";

export const signInWithGoogle = async () => {
  try {
    const { user } = await signInWithPopup(auth, provider);
    return user;
  } catch (e) {
    console.error(e);
  }
};
