const express = require("express");
const router = express.Router();
const Platform = require("../models/Platform");
const { checkPlatform } = require("../services/healthCheck");

router.get("/", async (req, res) => {
  try {
    const platforms = await Platform.find();
    res.json(platforms);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch platforms" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, baseUrl, matchPrefix } = req.body;

    if (!name || !baseUrl) {
      return res.status(400).json({ error: "name and baseUrl are required" });
    }

    const isUp = await checkPlatform(baseUrl);

    const platform = await Platform.create({
      name,
      baseUrl,
      matchPrefix: matchPrefix || "/",
      status: isUp,
      lastCheckedAt: new Date(),
    });

    res.status(201).json(platform);
  } catch (err) {
    res.status(500).json({ error: "Failed to create platform" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { name, baseUrl, matchPrefix } = req.body;
    const platform = await Platform.findByIdAndUpdate(
      req.params.id,
      { name, baseUrl, matchPrefix },
      { new: true, runValidators: true }
    );

    if (!platform) {
      return res.status(404).json({ error: "Platform not found" });
    }

    res.json(platform);
  } catch (err) {
    res.status(500).json({ error: "Failed to update platform" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const platform = await Platform.findByIdAndDelete(req.params.id);

    if (!platform) {
      return res.status(404).json({ error: "Platform not found" });
    }

    res.json({ message: "Platform deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete platform" });
  }
});
router.post("/:id/check", async (req, res) => {
  try {
    const platform = await Platform.findById(req.params.id);

    if (!platform) {
      return res.status(404).json({ error: "Platform not found" });
    }

    const isUp = await checkPlatform(platform.baseUrl);
    platform.status = isUp;
    platform.lastCheckedAt = new Date();
    await platform.save();

    res.json(platform);
  } catch (err) {
    res.status(500).json({ error: "Failed to check platform" });
  }
});

module.exports = router;
