const mongoose = require("mongoose");

const messageConfigSchema = new mongoose.Schema({
  messageId: {
    type: String,
    required: true
  },
  channelId: {
    type: String,
    required: true
  },
  mode: {
    type: String,
    enum: ["normal", "unique", "verify", "drop", "reversed", "limit", "binding"],
    default: "normal"
  },
  maxRoles: {
    type: Number,
    default: null  // yalnızca "limit" modunda kullanılır
  },
  roles: [
    {
      emoji: {
        type: String,
        required: true
      },
      roleId: {
        type: String,
        required: true
      }
    }
  ],
  whitelistRoles: {
    type: [String],   // rol ID’lerinden oluşan dizi
    default: []
  },
  blacklistRoles: {
    type: [String],   // rol ID’lerinden oluşan dizi
    default: []
  }
}, { _id: false });

const reactionRoleSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true
  },
  messages: {
    type: [messageConfigSchema],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model("ReactionRole", reactionRoleSchema);
