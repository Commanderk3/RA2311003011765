const fs = require("fs");
const path = require("path");
const { buildConfig, validateConfig } = require("./config");
const { generateSchedules } = require("./scheduler");
const { sendLog } = require("../../log");

const config = buildConfig();

function buildTextReport(result) {
  const lines = [
    "Vehicle Maintenance Scheduler Output",
    `Generated At: ${result.generatedAt}`,
    `Depots Processed: ${result.depotCount}`,
    `Vehicle Tasks Considered: ${result.vehicleTaskCount}`,
    "",
  ];

  for (const schedule of result.schedules) {
    lines.push(`Depot ${schedule.depotId}`);
    lines.push(`Mechanic Hours Budget: ${schedule.mechanicHours}`);
    lines.push(`Selected Tasks: ${schedule.selectedTaskCount}`);
    lines.push(`Total Duration Used: ${schedule.totalDuration}`);
    lines.push(`Total Impact: ${schedule.totalImpact}`);
    lines.push("Task IDs:");
    lines.push(
      schedule.selectedTaskIDs.length > 0
        ? schedule.selectedTaskIDs.join(", ")
        : "(none)",
    );
    lines.push("");
  }

  return lines.join("\n");
}

async function main() {
  validateConfig(config);

  const result = await generateSchedules(config);
  const outputDir = path.join(__dirname, "..", "output");
  fs.mkdirSync(outputDir, { recursive: true });

  const jsonPath = path.join(outputDir, "schedule-result.json");
  const txtPath = path.join(outputDir, "schedule-report.txt");
  fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), "utf8");
  fs.writeFileSync(txtPath, buildTextReport(result), "utf8");

  await sendLog(
    config,
    "INFO",
    "middleware",
    `Scheduler output for ${result.depotCount} depots and saved to output files.`,
  );

  console.log(`Saved JSON output to ${jsonPath}`);
  console.log(`Saved text report to ${txtPath}`);
}

main().catch((error) => {
  void sendLog(
    config,
    "ERROR",
    "middleware",
    `Scheduler run failed: ${error.message}`,
  );
  console.error(`Failed to generate schedule: ${error.message}`);
  process.exitCode = 1;
});
