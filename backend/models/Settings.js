import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
    {
        allowedIp: {
            type: String,
            default: null,
            trim: true,
            // store comma-separated: "192.168.1.1, 10.0.0.0/24, 172.16.0.5"
        },
        ipLabel: { type: String, default: null },
        ipRestrictionEnabled: { type: Boolean, default: true },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
    },
    { timestamps: true }
);
const Settings = mongoose.model("Settings", settingsSchema);

export default Settings