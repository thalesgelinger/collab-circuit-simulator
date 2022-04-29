import { ToolsTypes } from "./../@types/ToolsTypes";
import { ComponentType } from "../@types";

export type CircuitType = ComponentType[];

export class Simulation {
  #resultData: string[] = [];
  #netlist = "";

  constructor(circuitFull: CircuitType) {
    const removeTools = ({ componentType }: ComponentType) => {
      return !["voltimeter"].includes(componentType);
    };
    const circuit = circuitFull.filter(removeTools);
    this.#netlist = this.#circuitTypeToNetlist(circuit);
    console.log({ netlist: this.#netlist });
  }

  async #run(netlist: string) {
    const netlistResult = await window.runSpice(netlist);
    return netlistResult;
  }

  #circuitTypeToNetlist(circuit: CircuitType) {
    const netlist = circuit
      .map((component) => {
        const { name, value, nodes } = component;
        return [name, nodes.positive, nodes.negative, value].join(" ");
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

  get hasCircuit() {
    return !!this.#netlist;
  }
}
