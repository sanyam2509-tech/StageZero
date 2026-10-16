import mongoose, { Schema } from "mongoose";

const teamSchema = new Schema(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event ID is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Team name is required"],
      trim: true,
    },
    inviteCode: {
      type: String,
      required: [true, "Invite code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    leaderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Team leader is required"],
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    checkedIn: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Add compound unique index { eventId: 1, name: 1 }
teamSchema.index({ eventId: 1, name: 1 }, { unique: true });

export const Team = mongoose.model("Team", teamSchema);
