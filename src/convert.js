const convertToBinary = (decimal) => {
  decimal = Number(decimal);

  let binary = 0,
    remainder = 0,
    i = 1;

  do {
    remainder = decimal % 2;
    decimal = Math.floor(decimal / 2);
    binary = binary + remainder * i;
    i = i * 10;
  } while (decimal !== 0);

  return binary.toString().padStart(16, '0') + '\n';
};

module.exports = {
  convertToBinary,
};
