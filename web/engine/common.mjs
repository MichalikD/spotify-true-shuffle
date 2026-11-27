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

export {
  fisherYates,
  getConfigNumber,
  getConfigBoolean
};
