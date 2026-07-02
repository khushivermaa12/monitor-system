const Platform = require("../models/Platform");
const UserSession = require("../models/UserSession");

async function resolvePlatformForRequest(req) {
  const platforms = await Platform.find();

  const sorted = platforms.sort(
    (a, b) => (b.matchPrefix || "").length - (a.matchPrefix || "").length
  );

  return sorted.find((p) => req.originalUrl.startsWith(p.matchPrefix)) || null;
}

async function maintenanceMiddleware(req, res, next) {
  try {
    const platform = await resolvePlatformForRequest(req);

    if (!platform) {
      return next();
    }

    if (!platform.status) {
      const sessionId = req.sessionID || req.headers["x-session-id"];

      if (!sessionId) {
        return res.redirect("/maintenance");
      }

      await UserSession.findOneAndUpdate(
        { sessionId, resolved: false },
        {
          $setOnInsert: {
            sessionId,
            uri: req.originalUrl,
            platform: platform._id,
            statusAtRedirect: platform.status,
            createdAt: new Date(),
          },
        },
        { upsert: true, new: true }
      );

      return res.redirect("/maintenance");
    }

    return next();
  } catch (err) {
    console.error("maintenanceMiddleware error:", err);
    return next();
  }
}

module.exports = maintenanceMiddleware;