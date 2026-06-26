const cron = require("node-cron");
const { checkAllPlatforms } = require("../services/healthCheck");

function startMonitoring() {
  cron.schedule("*/30 * * * * *", async () => {
    try {
      const results = await checkAllPlatforms();
      results.forEach((r) =>
        console.log(`[monitor] ${r.name}: ${r.status}`)
      );
    } catch (err) {
      console.error("[monitor] health check sweep failed:", err);
    }
  });

  console.log("Platform monitoring cron started (every 30s)");
}

module.exports = startMonitoring;
