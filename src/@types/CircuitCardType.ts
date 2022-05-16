export interface CircuitCardType {
  id: string;
  img: string;
  name: string;
  onClick(hash: string): void;
  onRemove(): void;
}
