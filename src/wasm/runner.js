const delay = (time) => new Promise((res) => setTimeout(res, time));

function updateResults(value) {
  const asString = localStorage.getItem("spice");
  const currentData = !!asString ? JSON.parse(asString) : [];
  localStorage.setItem("spice", JSON.stringify([...currentData, value]));
}

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
      updateResults("DONE");
    },
  ],
  print: (function () {
    return function (text) {
      if (arguments.length > 1)
        text = Array.prototype.slice.call(arguments).join(" ");

      updateResults(text);
    };
  })(),
};

async function runSpice() {
  createAndAppendScript("spice", "./src/wasm/ngspice.js");
}

function createAndAppendScript(name, path) {
  const script = document.createElement("script");
  script.id = name;
  script.src = path;
  script.type = "text/javascript";
  document.body.appendChild(script);
}
