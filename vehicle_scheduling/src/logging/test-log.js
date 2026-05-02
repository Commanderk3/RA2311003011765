const { Log } = require("./index");

async function main() {
  await Log(
    "backend",
    "INFO",
    "middleware",
    "Logging middleware test event from vehicle_scheduling project."
  );
}

main();
