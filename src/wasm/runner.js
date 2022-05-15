let netlistGlobal;
let results = [];
Module = {
  arguments: ["-b", "test.cir"],

  preRun: [
    () => {
      console.log("from html");
      FS.writeFile("/test.cir", netlistGlobal);
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
  console.log({ netlist });
  netlistGlobal = netlist;
  const script = document.createElement("script");
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
