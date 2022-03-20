export const useSnapToGrid = (blockSnapSize: number) => {
  const snapPosition = (x: number, y: number) => {
    const snapedPosition = {
      x: Math.round(x / blockSnapSize) * blockSnapSize,
      y: Math.round(y / blockSnapSize) * blockSnapSize,
    };
    return snapedPosition;
  };

  return snapPosition;
};
