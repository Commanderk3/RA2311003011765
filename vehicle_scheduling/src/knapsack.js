function planKnapsack(vehicles, maxCapacity) {
  if (!Number.isInteger(maxCapacity) || maxCapacity < 0) {
    throw new Error("maxCapacity must be a non-negative integer.");
  }

  const count = vehicles.length;
  const bestImpactByCapacity = new Float64Array(maxCapacity + 1);
  const takeMatrix = Array.from(
    { length: count },
    () => new Uint8Array(maxCapacity + 1),
  );

  for (let i = 0; i < count; i += 1) {
    const { Duration: duration, Impact: impact } = vehicles[i];
    for (let capacity = maxCapacity; capacity >= duration; capacity -= 1) {
      const candidateImpact =
        bestImpactByCapacity[capacity - duration] + impact;
      if (candidateImpact > bestImpactByCapacity[capacity]) {
        bestImpactByCapacity[capacity] = candidateImpact;
        takeMatrix[i][capacity] = 1;
      }
    }
  }

  function solve(capacity) {
    if (!Number.isInteger(capacity) || capacity < 0 || capacity > maxCapacity) {
      throw new Error(
        `capacity must be an integer between 0 and ${maxCapacity}.`,
      );
    }

    const selected = [];
    let remaining = capacity;

    for (let i = count - 1; i >= 0; i -= 1) {
      const vehicle = vehicles[i];
      if (remaining >= vehicle.Duration && takeMatrix[i][remaining] === 1) {
        selected.push(vehicle);
        remaining -= vehicle.Duration;
      }
    }

    selected.reverse();

    let totalDuration = 0;
    let totalImpact = 0;
    for (const task of selected) {
      totalDuration += task.Duration;
      totalImpact += task.Impact;
    }

    return {
      capacity,
      totalDuration,
      totalImpact,
      selectedTasks: selected,
    };
  }

  return {
    solve,
  };
}

module.exports = {
  planKnapsack,
};
