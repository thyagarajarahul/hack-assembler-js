const fs = require('fs');
const lineReader = require('line-reader');

const { convertToBinary } = require('./convert');

const {
  BASE_ADDRESS,
  SYMBOLS,
  DESTINATION_COMMAND,
  COMPUTE_COMMAND,
  JUMP_COMMAND,
  COMMENT_REGEX,
  LABEL_REGEX,
} = require('./constants');

const symbolsTable = { ...SYMBOLS };

const preDefSymbolsLength = Object.keys(SYMBOLS).length;

let isLabelSet = false,
  currentAddress = BASE_ADDRESS,
  result = '';

const parse = (source, destination) => {
  let lineCount = 0;

  lineReader.eachLine(source, (line, last) => {
    const instruction = line.replace(COMMENT_REGEX, '').trim();

    if (!isLabelSet) {
      if (!instruction) return;

      handleLabel(instruction, lineCount);
    } else {
      if (instruction.startsWith('@')) {
        result += handleAInstruction(instruction);
      } else {
        result += handleCInstruction(instruction, lineCount);
      }
    }

    lineCount++;

    if (last) {
      if (isLabelSet) {
        saveFile(result, destination);
        return false;
      }

      isLabelSet = true;
      parse(source, destination);
    }
  });
};

const handleLabel = (instruction, lineCount) => {
  const symbolsTableLength = Object.keys(symbolsTable).length;
  const labelsLength = symbolsTableLength - preDefSymbolsLength;

  if (LABEL_REGEX.test(instruction)) {
    const label = instruction.replace(/\(|\)/g, '');
    symbolsTable[label] = lineCount - labelsLength;
  }
};

const handleAInstruction = (instruction) => {
  instruction = instruction.replace('@', '');

  if (isNaN(Number(instruction))) {
    if (symbolsTable[instruction] === undefined) {
      symbolsTable[instruction] = currentAddress;
      currentAddress++;
    }
  }

  const address = symbolsTable[instruction] ?? instruction;

  return convertToBinary(address);
};

const handleCInstruction = (instruction, lineCount) => {
  if (!instruction || LABEL_REGEX.test(instruction)) return '';

  let [d, cj] = instruction.split('=');

  if (!cj) {
    cj = d;
    d = 0;
  }

  const [c, j = 0] = cj.split(';');

  const code = `111${COMPUTE_COMMAND[c]}${DESTINATION_COMMAND[d]}${JUMP_COMMAND[j]}`;

  if (isNaN(Number(code))) {
    console.error(`Error at line ${lineCount + 1}: ${instruction} is not valid hack assembly code`);
    process.exit(1);
  }

  return `${code}\n`;
};

const saveFile = (result, destination) => {
  try {
    fs.writeFileSync(destination, result);
    console.log('Code assembled successfully!');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

module.exports = parse;
