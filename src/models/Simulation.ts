import { ToolsTypes } from "./../@types/ToolsTypes";
import { ComponentType } from "../@types";

export type CircuitType = ComponentType[];

const delay = (time) => new Promise((res) => setTimeout(res, time));
export class Simulation {
  #resultData: string[] = [];
  #netlist = "";
  #nodes: number[] = [];
  #isRunning = false;

  constructor(circuitFull: CircuitType) {
    const removeTools = ({ componentType }: ComponentType) => {
      return !["voltimeter", "osciloscope"].includes(componentType);
    };

    const removeComponentsNotConnected = ({ nodes }: ComponentType) => {
      return Object.keys(nodes).every((nodeKey) => {
        return !!nodes[nodeKey as keyof typeof nodes].value;
      });
    };

    this.#nodes = this.#extractNodes(circuitFull);
    const circuit = circuitFull
      .filter(removeTools)
      .filter(removeComponentsNotConnected);
    this.#netlist = this.#circuitTypeToNetlist(circuit);
    console.log("NETLIST BASE: ", { netlist: this.#netlist });
  }

  get hasCircuit() {
    return !!this.#netlist;
  }

  run() {
    this.#isRunning = true;
  }

  stop() {
    this.#isRunning = false;
  }

  get isRunning() {
    return this.#isRunning;
  }

  async #run(netlist: string) {
    console.log({ simlationNetlist: netlist });
    const ngspiceScript = `/wasm/ngspice.js`;
    const netlistResult = await window.runSpice(netlist, ngspiceScript);
    const oldRunner = document.getElementById("runner");
    oldRunner?.remove();

    const newRunner = document.createElement("script");

    newRunner.id = "runner";
    newRunner.src = "/wasm/runner.js";
    newRunner.type = "text/javascript";

    document.body.appendChild(newRunner);

    return netlistResult;
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
      .join("\n")
      .replace(/CURRENT_/g, "vAmp");
    return `Circuit \n ${netlist}`;
  }

  async getVoltageNodes() {
    const NODES_HEADER_SIZE = 3;

    const commands = `
    .model generic D
    .op
    .end
    `;

    const netlist = `${this.#netlist}\n${commands}`;
    this.#resultData = await this.#run(netlist);

    const indexNodeVoltageStart = this.#resultData.findIndex((value) => {
      return value.startsWith("Node") || value.endsWith("Voltage");
    });

    const resultStartsOnNode = this.#resultData.slice(indexNodeVoltageStart);

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

    return voltageNodes;
  }

  async getCurrent() {
    const commands = `
    .model generic D
    .op
    .end
    `;

    const netlist = `${this.#netlist}\n${commands}`;
    this.#resultData = await this.#run(netlist);

    const onlyCurrentValues = this.#resultData
      .filter((data) => data.includes("#branch"))
      .filter((v) => !v.toLowerCase().startsWith("vamp"));

    const currentNodesArray = onlyCurrentValues.map((raw) => {
      const [key, value] = raw
        .replace("\t", "")
        .split(" ")
        .filter((v) => !!v);

      const formattedKey = key
        .replace("#branch", "")
        .replace(/vamp/g, "CURRENT_");

      return {
        [formattedKey]: value,
      };
    });

    const currentNodes = currentNodesArray.reduce((acc, current) => {
      return {
        ...acc,
        ...current,
      };
    }, {});

    return currentNodes;
  }

  async getPulseSimulationNodes() {
    const pulseCommand = `
    .tran  50u 50m
    .control
      version
      run
      print ${this.#nodes.map((node) => `v(${node})`).join(" ")}
    .endc
    .end
    `;

    const netlistSimulation = `${this.#netlist}\n${pulseCommand}`;

    console.log({ netlistSimulation });

    this.#resultData = await this.#run(netlistSimulation);

    console.log({ resultCircuit: this.#resultData });

    const nodesMappedValues = this.#formatResponseDataToOscilloscope();

    return nodesMappedValues;
  }

  async #formatResponseDataToOscilloscope() {
    const indeValuesStart = this.#resultData.findIndex((value) => {
      return value.startsWith("Index");
    });

    const resultsStart = this.#resultData.slice(indeValuesStart + 2);

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

        const keys = this.#nodes.map((node) => `v(${node})`);

        return {
          time,
          ...nodesValues
            .filter((value) => !!value)
            .reduce(
              (acc, current, i) => ({
                ...acc,
                [keys[i]]: current,
              }),
              {}
            ),
        };
      });
    return nodesMappedValues as { time: string; [key: string]: string }[];
  }

  async getWave() {
    const frequency = this.#netlist.split("(")[1].split(" ")[2];
    const period = 1 / Number(frequency);

    const pulseCommand = `
    .model generic D
    .tran  {${period}/100} {5*${period}}
    .control
      version
      run
      print ${this.#nodes.map((node) => `v(${node})`).join(" ")}
    .endc
    .end
    `;

    const netlistSimulation = `${this.#netlist}\n${pulseCommand}`;

    console.log({ netlistSimulation });

    this.#resultData = await this.#run(netlistSimulation);

    console.log({ resultCircuit: this.#resultData });

    const nodesMappedValues = this.#formatResponseDataToOscilloscope();

    return nodesMappedValues;
  }
}
