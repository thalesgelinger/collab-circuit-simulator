export const formatToSi = (n: number) => {
  const unitList = [
    "y",
    "z",
    "a",
    "f",
    "p",
    "n",
    "u",
    "m",
    "",
    "k",
    "M",
    "G",
    "T",
    "P",
    "E",
    "Z",
    "Y",
  ];
  const zeroIndex = 8;
  const nn = n.toExponential(2).split(/e/);
  let u = Math.floor(+nn[1] / 3) + zeroIndex;
  if (u > unitList.length - 1) {
    u = unitList.length - 1;
  } else if (u < 0) {
    u = 0;
  }
  return (
    (Number(nn[0]) * Math.pow(10, +nn[1] - (u - zeroIndex) * 3)).toFixed(2) +
    unitList[u]
  );
};
