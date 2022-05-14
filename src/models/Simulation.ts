import { ToolsTypes } from "./../@types/ToolsTypes";
import { ComponentType } from "../@types";

export type CircuitType = ComponentType[];

const delay = (time: number) => new Promise((res) => setTimeout(res, time));

/*let results = [];

    const response = await Spice({
      netlist,
      output: results,
    });

    console.log({ response });*/

export class Simulation {
  #netlist = "";
  #nodes: number[] = [];
  #isRunning = false;
  #isRunningSimulation = false;

  constructor(circuitFull: CircuitType) {
    const removeTools = ({ componentType }: ComponentType) => {
      return !["voltimeter"].includes(componentType);
    };
    this.#nodes = this.#extractNodes(circuitFull);
    const circuit = circuitFull.filter(removeTools);
    this.#netlist = this.#circuitTypeToNetlist(circuit);
  }

  get hasCircuit() {
    return !!this.#netlist;
  }

  async #run(netlist: string) {
    localStorage.setItem("netlist", netlist);
    window.netlistGlobal = netlist;

    window.runSpice();

    const getData = async (): Promise<string[]> => {
      const resultString = localStorage.getItem("spice");
      console.log("BATATA");
      const results = !!resultString ? JSON.parse(resultString) : [];

      if (results[results.length - 1] === "DONE") {
        const script = document.querySelector("#spice");
        document.body.removeChild(script);

        return Promise.resolve(results);
      }
      await delay(200);
      return await getData();
    };

    const response = await getData();
    localStorage.setItem("spice", JSON.stringify([]));
    return response;

    // let results: string[] = [];

    // window.observe = (value: string) => {
    //   console.log({ value });
    //   results.push(value);
    //   if (value === "DONE") {
    //     console.log("DEU");
    //     localStorage.setItem("done", JSON.stringify(true));
    //   }
    // };

    // const response = await new Promise((res) => {
    //   const interval = setInterval(() => {
    //     console.log("BATATA");
    //     if (JSON.parse(localStorage.getItem("done"))) {
    //       console.log("Vai limpar");
    //       clearInterval(interval);
    //       res(results);
    //     }
    //   }, 500);
    // });

    // if (JSON.parse(localStorage.getItem("done"))) {
    //   console.log("FOI ess naba?");
    //   window.observe = null;
    //   window.netlistGlobal = "";
    //   const script = document.querySelector("#spice");
    //   document.body.removeChild(script);
    // }

    // console.log("ACABOU:", { response, done: this.#isRunningSimulation });

    // results = [];
    return response;
  }

  #extractNodes(circuit: CircuitType) {
    const onlyNodes = circuit
      .map(({ nodes }) => Object.keys(nodes).map((key) => nodes[key].value))
      .flat()
      .filter((value) => !!Number(value))
      .sort();

    return Array.from(new Set(onlyNodes));
  }

  #circuitTypeToNetlist(circuit: CircuitType) {
    const netlist = circuit
      .map((component) => {
        const { name, value, nodes } = component;
        return [name, nodes.positive.value, nodes.negative.value, value].join(
          " "
        );
      })
      .join("\n");
    return `Circuit \n ${netlist}`;
  }

  async getVoltageNodes() {
    console.log("RODOU o getVoltageNodes:", this.#isRunning);

    if (this.#isRunning) {
      await delay(100);
      return await this.getVoltageNodes();
    }

    this.#isRunning = true;
    const NODES_HEADER_SIZE = 3;
    const netlist = `${this.#netlist}\n.op\n.end`;
    console.log("FOI AQui");
    const resultData = await this.#run(netlist);

    console.log({ resultData });

    const indexNodeVoltageStart = resultData.findIndex((value) => {
      return value.startsWith("Node") || value.endsWith("Voltage");
    });

    const resultStartsOnNode = resultData.slice(indexNodeVoltageStart);

    const indexNodeVoltaEnd = resultStartsOnNode.findIndex((value) => !value);

    const onlyNodes = resultStartsOnNode
      .splice(NODES_HEADER_SIZE, indexNodeVoltaEnd - NODES_HEADER_SIZE)
      .map((line) => line.replace("\t", ""));

    const voltageNodes = onlyNodes
      .map((line) => line.split(" ").filter((el) => !!el))
      .reduce((acc, current) => {
        acc[current[0]] = current[1];
        return acc;
      }, {} as { [key: string]: string });

    this.#isRunning = false;
    return voltageNodes;
  }

  async getPulseSimulationNodes() {
    // const netlist = this.#netlist.concat("\n.op\n.end");
    console.log("RODOU o getPulseSimulationNodes");

    if (this.#isRunning) {
      return [];
    }

    this.#isRunning = true;

    const netlist = `.title dual rc ladder
    R1 int in 10k
    V1 in 0 PULSE (0 5 1u 1u 1u 1 1)
    R2 out int 1k
    C1 int 0 1u
    C2 out 0 100n

    .tran 100u 50m
    `;

    const pulseCommand = `
    .control
    version
    run
    *print ${this.#nodes.map((node) => `v(${node})`).join(" ")}
    print in int out
    .endc
    .end
    `;

    const netlistSimulation = `${netlist}\n${pulseCommand}`;

    console.log({ netlistSimulation });

    const resultData = await this.#run(netlistSimulation);

    console.log({ resultData });

    const indeValuesStart = resultData.findIndex((value) => {
      return value.startsWith("Index");
    });

    const resultsStart = resultData.slice(indeValuesStart + 2);

    const indexNodeVoltaEnd = resultsStart.findIndex((value) =>
      value.startsWith("DONE")
    );

    const onlyNodes = resultsStart.splice(0, indexNodeVoltaEnd);

    const nodesMappedValues = onlyNodes
      .filter(
        (value) =>
          !(
            value.startsWith("Index") ||
            value.startsWith("----") ||
            value.startsWith("\f")
          )
      )
      .map((line) => {
        const [index, time, ...nodesValues] = line.split("\t");
        return {
          time,
          ...nodesValues
            .filter((value) => !!value)
            .reduce(
              (acc, current, i) => ({
                ...acc,
                [`v(${i + 1})`]: current,
              }),
              {}
            ),
        };
      });

    console.log({ nodesMappedValues });

    this.#isRunning = false;
    return nodesMappedValues;
  }
}
