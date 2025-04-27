const mongoose = require('mongoose');
const VKSettingsSchema = new mongoose.Schema({
    guildId: String,
    roles: [
        {
            name: { type: String, required: true },
            alignment: { type: String, enum: ['good','evil','neutral'], required: true },
            metadata: { type: mongoose.Schema.Types.Mixed }
        }
    ],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("VKSettings", VKSettingsSchema);