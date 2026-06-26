const express = require("express");
const router = express.Router();
const Platform = require("../models/Platform");
const UserSession = require("../models/UserSession");
router.get("/", async (req, res) => {
  try {
    const sessionId = req.sessionID || req.headers["x-session-id"];

    if (!sessionId) {
      return res.status(400).json({ error: "Missing session id" });
    }

    const userSession = await UserSession.findOne({
      sessionId,
      resolved: false,
    }).sort({ createdAt: -1 });

    if (!userSession) {
      return res.json({ status: "unknown", uri: null });
    }

    const platform = userSession.platform
      ? await Platform.findById(userSession.platform)
      : null;

    const isUp = platform ? platform.status : false;

    if (isUp) {
      userSession.resolved = true;
      await userSession.save();
    }

    res.json({
      status: isUp ? "up" : "down",
      uri: userSession.uri,
    });
  } catch (err) {
    console.error("statusRoutes error:", err);
    res.status(500).json({ error: "Failed to fetch status" });
  }
});

module.exports = router;
