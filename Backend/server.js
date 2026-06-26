require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");

const maintenanceMiddleware = require("./middleware/maintenanceMiddleware");
const platformRoutes = require("./routes/platformRoutes");
const statusRoutes = require("./routes/statusRoutes");
const startMonitoring = require("./cron/monitorPlatforms");
const connectDB = require("./config/mongodb");

//app config
const app = express();
const PORT = process.env.PORT || 4000;

//middleware
app.use(cors());
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "change-this-secret",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 24h
  })
);

app.use("/api/platforms", platformRoutes);
app.use("/api/status", statusRoutes);

app.get("/maintenance", (req, res) => {
  res.json({ message: "This service is currently under maintenance." });
});

app.use(maintenanceMiddleware);

//api endpoint
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the platform" });
});

app.get("/admin", (req, res) => {
  res.json({ message: "Admin portal" });
});
connectDB()
  .then(() => {
    startMonitoring();
    app.listen(PORT, () => {
      console.log(`Server running on : ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start application:", err);
    process.exit(1);
  });

