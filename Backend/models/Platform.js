const mongoose = require("mongoose");

const platformSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    baseUrl: {
      type: String,
      required: true,
      trim: true,
    },

    matchPrefix: {
      type: String,
      required: true,
      default: "/",
    },
    status: {
      type: Boolean,
      default: true,
    },
    lastCheckedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Platform = mongoose.models.Platform || mongoose.model("Platform", platformSchema);
module.exports = Platform