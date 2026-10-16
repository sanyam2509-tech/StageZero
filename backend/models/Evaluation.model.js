import mongoose, { Schema } from "mongoose";

const scoreItemSchema = new Schema(
  {
    criterion: {
      type: String,
      required: true,
      trim: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    maxScore: {
      type: Number,
      required: true,
      default: 10,
    },
    weight: {
      type: Number,
      required: true,
      default: 1,
    },
  },
  { _id: false }
);

const evaluationSchema = new Schema(
  {
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: "Submission",
      required: [true, "Submission ID is required"],
      index: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event ID is required"],
      index: true,
    },
    judgeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Judge ID is required"],
      index: true,
    },
    scores: [scoreItemSchema],
    totalWeightedScore: {
      type: Number,
      required: [true, "Total weighted score is required"],
      min: 0,
    },
    feedback: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add unique compound index { submissionId: 1, judgeId: 1 }
evaluationSchema.index({ submissionId: 1, judgeId: 1 }, { unique: true });

export const Evaluation = mongoose.model("Evaluation", evaluationSchema);
