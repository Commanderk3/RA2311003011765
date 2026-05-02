const { getAccessToken } = require("./auth");
const { fetchDepots, fetchVehicles } = require("./api");
const { planKnapsack } = require("./knapsack");

function normalizeDepots(rawDepots) {
  if (!Array.isArray(rawDepots)) {
    throw new Error("Invalid depots response: depots must be an array.");
  }

  return rawDepots.map((depot, index) => {
    const id = Number(depot.ID);
    const mechanicHours = Number(depot.MechanicHours);

    if (!Number.isInteger(id) || id <= 0) {
      throw new Error(`Invalid depot ID at index ${index}.`);
    }

    if (!Number.isInteger(mechanicHours) || mechanicHours < 0) {
      throw new Error(`Invalid MechanicHours for depot ${id}.`);
    }

    return {
      ID: id,
      MechanicHours: mechanicHours,
    };
  });
}

function normalizeVehicles(rawVehicles) {
  if (!Array.isArray(rawVehicles)) {
    throw new Error("Invalid vehicles response: vehicles must be an array.");
  }

  return rawVehicles.map((vehicle, index) => {
    const taskId = String(vehicle.TaskID || "").trim();
    const duration = Number(vehicle.Duration);
    const impact = Number(vehicle.Impact);

    if (!taskId) {
      throw new Error(`Missing TaskID for vehicle at index ${index}.`);
    }

    if (!Number.isInteger(duration) || duration <= 0) {
      throw new Error(`Invalid Duration for task ${taskId}.`);
    }

    if (!Number.isInteger(impact) || impact < 0) {
      throw new Error(`Invalid Impact for task ${taskId}.`);
    }

    return {
      TaskID: taskId,
      Duration: duration,
      Impact: impact,
    };
  });
}

function parseDepotId(input) {
  if (input === undefined || input === null || input === "") {
    return null;
  }

  const depotId = Number(input);
  if (!Number.isInteger(depotId) || depotId <= 0) {
    throw new Error("depotId must be a positive integer.");
  }

  return depotId;
}

async function generateSchedules(config, options = {}) {
  const depotId = parseDepotId(options.depotId);
  const token = await getAccessToken(config);
  const [depotsResponse, vehiclesResponse] = await Promise.all([
    fetchDepots(config, token),
    fetchVehicles(config, token),
  ]);

  const depots = normalizeDepots(depotsResponse.depots);
  const vehicles = normalizeVehicles(vehiclesResponse.vehicles);

  const targetDepots =
    depotId === null ? depots : depots.filter((depot) => depot.ID === depotId);

  if (targetDepots.length === 0) {
    throw new Error(`No depot found for ID ${depotId}.`);
  }

  if (vehicles.length === 0) {
    return {
      generatedAt: new Date().toISOString(),
      depotCount: targetDepots.length,
      vehicleTaskCount: 0,
      schedules: targetDepots.map((depot) => ({
        depotId: depot.ID,
        mechanicHours: depot.MechanicHours,
        totalDuration: 0,
        totalImpact: 0,
        selectedTaskCount: 0,
        selectedTaskIDs: [],
        selectedTasks: [],
      })),
    };
  }

  const maxCapacity = Math.max(
    ...targetDepots.map((depot) => depot.MechanicHours),
  );
  const planner = planKnapsack(vehicles, maxCapacity);

  const schedules = targetDepots.map((depot) => {
    const result = planner.solve(depot.MechanicHours);
    return {
      depotId: depot.ID,
      mechanicHours: depot.MechanicHours,
      totalDuration: result.totalDuration,
      totalImpact: result.totalImpact,
      selectedTaskCount: result.selectedTasks.length,
      selectedTaskIDs: result.selectedTasks.map((task) => task.TaskID),
      selectedTasks: result.selectedTasks,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    depotCount: targetDepots.length,
    vehicleTaskCount: vehicles.length,
    schedules,
  };
}

module.exports = {
  generateSchedules,
};
