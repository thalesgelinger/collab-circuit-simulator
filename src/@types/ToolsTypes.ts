export interface ToolsTypes {
  voltimeter: VoltimeterNodes;
  currentmeter: CurrentmeterNodes;
  ohmmimeter: OhmimeterNodes;
  osciloscope: OsciloscopeNodes;
}

interface VoltimeterNodes {
  positive: string;
  negative: string;
}
interface CurrentmeterNodes {
  positive: string;
  negative: string;
}
interface OhmimeterNodes {
  positive: string;
  negative: string;
}
interface OsciloscopeNodes {
  positive: string;
  negative: string;
}
