export {};
declare global {
  interface Window {
    runSpice(netlist: string, scriptPath: string): Promise<string[]>;
    results?: string[];
    netlistGlobal?: string;
  }
}
