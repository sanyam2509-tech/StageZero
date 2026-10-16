import mongoose, { Schema } from "mongoose";

const festSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Fest title is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Fest slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Fest description is required"],
    },
    collegeName: {
      type: String,
      required: [true, "College name is required"],
      trim: true,
    },
    bannerUrl: {
      type: String,
      default: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1600&q=80",
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    organizers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for fast sort & pagination
festSchema.index({ startDate: -1 });
festSchema.index({ createdAt: -1 });

export const Fest = mongoose.model("Fest", festSchema);
