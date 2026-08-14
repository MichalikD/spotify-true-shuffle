// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: magic;
function parseInput(value) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (error) {
      throw new Error(
        "The input to the Shuffle Engine is not valid JSON."
      );
    }
  }

  return value;
}

function fisherYates(trackList) {
  const result = trackList.slice();

  for (
    let index = result.length - 1;
    index > 0;
    index--
  ) {
    const randomIndex = Math.floor(
      Math.random() * (index + 1)
    );

    const temporary = result[index];
    result[index] = result[randomIndex];
    result[randomIndex] = temporary;
  }

  return result;
}

function getConfigNumber(
  config,
  key,
  defaultValue
) {
  const value = config[key];

  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  return defaultValue;
}

function getConfigBoolean(
  config,
  key,
  defaultValue
) {
  const value = config[key];

  if (typeof value === "boolean") {
    return value;
  }

  return defaultValue;
}

module.exports = {
  parseInput,
  fisherYates,
  getConfigNumber,
  getConfigBoolean
};
