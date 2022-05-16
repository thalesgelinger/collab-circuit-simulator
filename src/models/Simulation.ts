import { ToolsTypes } from "./../@types/ToolsTypes";
import { ComponentType } from "../@types";

export type CircuitType = ComponentType[];

export class Simulation {
  #resultData: string[] = [];
  #netlist = "";
  #nodes: number[] = [];

  constructor(circuitFull: CircuitType) {
    const removeTools = ({ componentType }: ComponentType) => {
      return !["voltimeter", "osciloscope"].includes(componentType);
    };
    this.#nodes = this.#extractNodes(circuitFull);
    const circuit = circuitFull.filter(removeTools);
    this.#netlist = this.#circuitTypeToNetlist(circuit);
  }

  get hasCircuit() {
    return !!this.#netlist;
  }

  async #run(netlist: string) {
    const netlistResult = await window.runSpice(netlist);
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
      .join("\n");
    return `Circuit \n ${netlist}`;
  }

  async getVoltageNodes() {
    const NODES_HEADER_SIZE = 3;
    const netlist = this.#netlist.concat("\n.op\n.end");
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

    return nodesMappedValues;
  }
}
