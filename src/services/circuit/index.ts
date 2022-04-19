const str = `Basic RC circuit
r 1 2 1.0
*l 1 2 1.0
c 2 0 1.0
vin 1 0  pulse (0 1) ac 1
.tran  0.1 7.0

.control
version
set filetype=ascii
run
write out.raw
.endc
.end
`;

Module = {
  arguments: ["-b", "test.cir"],
  //arguments: ["test.cir"]

  preRun: [
    (pr = () => {
      console.log("from html");
      // https://emscripten.org/docs/api_reference/Filesystem-API.html#filesystem-api
      FS.writeFile("/test.cir", str);
      // FS.writeFile("/modelcard.nmos", strModelNmos);
      // FS.writeFile("/modelcard.pmos", strModelPmos);

      // FS.writeFile("/test_bsim.cir", strBsimComprt);
      console.log(FS.readFile("/test.cir", { encoding: "utf8" }));
    }),
  ],
  postRun: [
    (ps = () => {
      console.log("job done! from html");
      console.log("post run...");

      let pMsg = document.getElementById("pMsg");
      pMsg.innerHTML = "Please refresh the page for a new simulation run";

      textArea.scrollTo(0, 0);
    }),
  ],
  print: (function () {
    return function (text) {
      if (arguments.length > 1)
        text = Array.prototype.slice.call(arguments).join(" ");
      // These replacements are necessary if you render to raw HTML
      //text = text.replace(/&/g, "&amp;");
      //text = text.replace(/</g, "&lt;");
      //text = text.replace(/>/g, "&gt;");
      //text = text.replace('\n', '<br>', 'g');

      console.log({ arguments });
      console.log({ text });
      if (textArea) {
        textArea.value += text + "\n";
        textArea.scrollTop = textArea.scrollHeight; // focus on bottom
      }
    };
  })(),
}; //end of Module

let btRun = document.getElementById("btRun");

export const runCircuitSimulation = () => {
  const script = document.createElement("script");
  script.src = "./build/ngspice.js";
  script.type = "text/javascript";
  document.body.appendChild(script);
};
