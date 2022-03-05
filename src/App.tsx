import { signInWithGoogle } from "./services/firebase";

const App = () => {
  const onGooglePress = async () => {
    const user = await signInWithGoogle();
    console.log({ user });
  };

  return (
    <>
      <h1>Collab Circuit Simulator</h1>
      <button onClick={onGooglePress}>Login com google</button>
    </>
  );
};

export default App;
