const axios = require("axios");
const Platform = require("../models/Platform");

const REQUEST_TIMEOUT_MS = 5000;
async function checkPlatform(url) {
  try {
    const response = await axios.get(url, {
      timeout: REQUEST_TIMEOUT_MS,
      validateStatus: () => true,
    });
    return response.status >= 200 && response.status < 300;
  } catch (err) {
    return false;
  }
}
async function checkAllPlatforms() {
  const platforms = await Platform.find();
  const results = [];

  for (const platform of platforms) {
    const isUp = await checkPlatform(platform.baseUrl);

    if (platform.status !== isUp) {
      platform.status = isUp;
    }
    platform.lastCheckedAt = new Date();
    await platform.save();

    results.push({ name: platform.name, status: isUp ? "up" : "down" });
  }

  return results;
}

module.exports = { checkPlatform, checkAllPlatforms };