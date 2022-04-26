import { ComponentType } from "../@types";

export type CircuitType = ComponentType[];

export class Simulation {
  #resultData: string[] = [];

  async start(circuit: CircuitType) {
    const netlist = this.#circuitTypeToNetlist(circuit);
    const netlistResult = await window.runSpice(netlist);
    this.#resultData = netlistResult;
  }

  getData() {
    return this.#resultData;
  }

  #circuitTypeToNetlist(circuit: CircuitType) {
    const netlist = circuit
      .map((component) => {
        const { name, value, nodes } = component;
        return [name, nodes.positive, nodes.negative, value].join(" ");
      })
      .join("\n")
      .concat("\n.op\n.end");
    return `Circuit \n ${netlist}`;
  }

  getVoltageNodes() {
    const NODES_HEADER_SIZE = 3;

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
}
