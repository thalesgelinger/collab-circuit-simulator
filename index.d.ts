export {};
declare global {
  interface Window {
    runSpice(netlist: string): Promise<string[]>;
  }
}
