const mongoose = require("mongoose");

const afkSchema = new mongoose.Schema({
  userID:    { type: String, required: true, unique: true },
  reason:    { type: String, default: "AFK" },
  timestamp: { type: Number, default: Date.now }  // milisaniye 
});

module.exports = mongoose.model("AfkData", afkSchema);
