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

export function shuffleSections(tracks, intensity) {
  if (intensity === 10) return fisherYates(tracks);
  const blockSize = 1 + Math.floor((tracks.length - 1) * intensity / 10);
  const result = [];
  for (let offset = 0; offset < tracks.length; offset += blockSize) {
    for (const track of fisherYates(tracks.slice(offset, offset + blockSize))) result.push(track);
  }
  return result;
}
