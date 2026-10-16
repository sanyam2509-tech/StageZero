import mongoose, { Schema } from "mongoose";

const roundSchema = new Schema(
  {
    roundNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
  },
  { _id: true }
);

const rubricCriterionSchema = new Schema(
  {
    criterion: {
      type: String,
      required: true,
      trim: true,
    },
    maxScore: {
      type: Number,
      required: true,
      default: 10,
    },
    weight: {
      type: Number,
      required: true,
      default: 1, // e.g. 1.0 or percentage
    },
  },
  { _id: true }
);

const eventSchema = new Schema(
  {
    festId: {
      type: Schema.Types.ObjectId,
      ref: "Fest",
      required: [true, "Fest reference is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: ["hackathon", "robotics", "coding", "cultural"],
      required: [true, "Category is required"],
      default: "hackathon",
    },
    description: {
      type: String,
      required: [true, "Event description is required"],
    },
    teamSize: {
      min: {
        type: Number,
        required: true,
        default: 1,
        min: 1,
      },
      max: {
        type: Number,
        required: true,
        default: 4,
        min: 1,
      },
    },
    rounds: [roundSchema],
    rubric: [rubricCriterionSchema],
    judges: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed"],
      default: "upcoming",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add compound indexes for fast querying by fest and sorting by creation date
eventSchema.index({ festId: 1, status: 1 });
eventSchema.index({ festId: 1, createdAt: -1 });

export const Event = mongoose.model("Event", eventSchema);
