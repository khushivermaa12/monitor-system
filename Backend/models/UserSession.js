const mongoose = require("mongoose");

const userSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  uri: {
    type: String,
    required: true,
  },
  platform: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Platform",
  },
  resolved: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24,
  },
});

const UserSession = mongoose.model("UserSession", userSessionSchema);
module.exports = UserSession;