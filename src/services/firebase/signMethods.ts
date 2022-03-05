import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "./initialize";

export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const { user } = await signInWithPopup(auth, provider);
    return user;
  } catch (e) {
    console.error(e);
  }
};
