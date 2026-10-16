import mongoose, { Schema } from "mongoose";

const submissionSchema = new Schema(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event ID is required"],
      index: true,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: [true, "Team ID is required"],
      index: true,
    },
    roundNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    projectTitle: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
    },
    tagline: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      required: [true, "Project description is required"],
    },
    repoUrl: {
      type: String,
      trim: true,
      default: "",
    },
    demoUrl: {
      type: String,
      trim: true,
      default: "",
    },
    videoUrl: {
      type: String,
      trim: true,
      default: "",
    },
    techStack: [
      {
        type: String,
        trim: true,
      },
    ],
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Add unique compound index { eventId: 1, teamId: 1, roundNumber: 1 }
submissionSchema.index(
  { eventId: 1, teamId: 1, roundNumber: 1 },
  { unique: true }
);

export const Submission = mongoose.model("Submission", submissionSchema);
