let netlistGlobal;
let results = [];
Module = {
  arguments: ["-b", "test.cir"],

  preRun: [
    () => {
      console.log("from html");
      // https://emscripten.org/docs/api_reference/Filesystem-API.html#filesystem-api
      FS.writeFile("/test.cir", netlistGlobal);
      // FS.writeFile("/modelcard.nmos", strModelNmos);
      // FS.writeFile("/modelcard.pmos", strModelPmos);

      // FS.writeFile("/test_bsim.cir", strBsimComprt);
      //console.log(FS.readFile("/test.cir", { encoding: "utf8" }));
    },
  ],
  postRun: [
    () => {
      results.push("DONE");
    },
  ],
  print: (function () {
    return function (text) {
      if (arguments.length > 1)
        text = Array.prototype.slice.call(arguments).join(" ");
      results.push(text);
    };
  })(),
};

const delay = (time) => new Promise((res) => setTimeout(res, time));

var runSpice = async (netlist) => {
  netlistGlobal = netlist;
  const script = document.createElement("script");

  if (!!script) {
    script.remove();
  }

  script.src = "./src/wasm/ngspice.js";
  script.type = "text/javascript";
  document.body.appendChild(script);

  const getResults = async () => {
    return new Promise(async (res, rej) => {
      if (results[results.length - 1] === "DONE") {
        res([results, false]);
      } else {
        await delay(100);
        res([null, true]);
      }
    });
  };

  const MAX_CALLS = 20;
  let maxCalls = 0;
  while (results[results.length - 1] !== "DONE" || maxCalls === MAX_CALLS) {
    const [resultsReady, error] = await getResults();

    if (!error) {
      return resultsReady;
    }
    maxCalls++;
  }
  return results;
};
