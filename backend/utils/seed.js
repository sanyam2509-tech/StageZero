import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/User.model.js";
import { Fest } from "../models/Fest.model.js";
import { Event } from "../models/Event.model.js";
import { Team } from "../models/Team.model.js";
import { Submission } from "../models/Submission.model.js";
import { Evaluation } from "../models/Evaluation.model.js";

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/festflow";

export const seedDatabase = async () => {
  try {
    console.log(" Connecting to MongoDB for seeding...");
    await mongoose.connect(MONGO_URI);
    console.log(" MongoDB connected successfully.");

    console.log(" Clearing existing collections for idempotent seeding...");
    await Promise.all([
      User.deleteMany({}),
      Fest.deleteMany({}),
      Event.deleteMany({}),
      Team.deleteMany({}),
      Submission.deleteMany({}),
      Evaluation.deleteMany({}),
    ]);

    console.log(" Creating Demo Users...");
    const organizer = await User.create({
      name: "Alex Organizer",
      email: "organizer@demo.com",
      passwordHash: "demo123456",
      college: "Stanford University",
      githubUrl: "https://github.com/alex-festflow-organizer",
      globalRole: "superadmin",
    });

    const judge = await User.create({
      name: "Dr. Elena Vance (Lead Judge)",
      email: "judge@demo.com",
      passwordHash: "demo123456",
      college: "AI Research Institute",
      githubUrl: "https://github.com/dr-elena-vance",
      globalRole: "user",
    });

    const participant = await User.create({
      name: "Sam Innovator",
      email: "participant@demo.com",
      passwordHash: "demo123456",
      college: "UC Berkeley Hackers",
      githubUrl: "https://github.com/sam-innovator",
      globalRole: "user",
    });

    const marcus = await User.create({
      name: "Marcus Chen",
      email: "marcus@demo.com",
      passwordHash: "demo123456",
      college: "MIT Computer Science",
      githubUrl: "https://github.com/marcus-chen",
      globalRole: "user",
    });

    const sarah = await User.create({
      name: "Sarah Jenkins",
      email: "sarah@demo.com",
      passwordHash: "demo123456",
      college: "Harvard Engineering",
      githubUrl: "https://github.com/sarah-jenkins",
      globalRole: "user",
    });

    console.log(" Creating Campus Fests...");
    const now = new Date();
    const fest1 = await Fest.create({
      title: "HackPulse 2026 — Global Innovation Fest",
      slug: "hackpulse-2026",
      description:
        "The premier inter-collegiate hackathon and technology symposium bringing together over 2,500 builders, innovators, and designers from across the globe.",
      collegeName: "Stanford University",
      bannerUrl:
        "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1600&q=80",
      startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000), // started yesterday
      endDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // ends in 3 days
      createdBy: organizer._id,
      organizers: [organizer._id],
    });

    const fest2 = await Fest.create({
      title: "Technova Apex 2026",
      slug: "technova-apex-2026",
      description:
        "Annual engineering extravaganza celebrating breakthrough artificial intelligence, robotics combat, and algorithmic excellence.",
      collegeName: "MIT Campus",
      bannerUrl:
        "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&q=80",
      startDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      createdBy: organizer._id,
      organizers: [organizer._id],
    });

    console.log(" Creating Events with Custom Rubrics & Rounds...");
    const hackathonEvent = await Event.create({
      festId: fest1._id,
      title: "AI & Full-Stack Web3 Hackathon",
      category: "hackathon",
      description:
        "Build full-stack agentic or decentralized applications addressing real-world climate, productivity, and developer infrastructure challenges.",
      teamSize: { min: 1, max: 4 },
      rounds: [
        {
          roundNumber: 1,
          title: "Round 1: MVP Architecture & Prototype",
          deadline: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        },
        {
          roundNumber: 2,
          title: "Round 2: Grand Finale & Live Pitch",
          deadline: new Date(now.getTime() + 48 * 60 * 60 * 1000),
        },
      ],
      rubric: [
        { criterion: "Innovation & Originality", maxScore: 10, weight: 1.5 },
        { criterion: "Technical Execution & Architecture", maxScore: 10, weight: 2.0 },
        { criterion: "UI/UX & User Experience", maxScore: 10, weight: 1.0 },
        { criterion: "Real-world Viability & Impact", maxScore: 10, weight: 1.5 },
      ],
      judges: [judge._id, organizer._id],
      status: "ongoing",
    });

    const codingEvent = await Event.create({
      festId: fest1._id,
      title: "Algorithm Blitz: Speed Coding Sprint",
      category: "coding",
      description:
        "High-octane competitive programming sprint solving algorithmic puzzles, graph theory problems, and concurrent optimization challenges.",
      teamSize: { min: 1, max: 2 },
      rounds: [
        {
          roundNumber: 1,
          title: "Speed Round: 10 Problems in 3 Hours",
          deadline: new Date(now.getTime() + 18 * 60 * 60 * 1000),
        },
      ],
      rubric: [
        { criterion: "Algorithmic Efficiency & Space Complexity", maxScore: 10, weight: 2.0 },
        { criterion: "Edge Case & Robustness Handling", maxScore: 10, weight: 1.5 },
      ],
      judges: [judge._id],
      status: "ongoing",
    });

    const roboticsEvent = await Event.create({
      festId: fest2._id,
      title: "Autonomous Robotics Derby",
      category: "robotics",
      description:
        "Design, build, and program autonomous rovers navigating dynamic physical obstacle courses using computer vision.",
      teamSize: { min: 2, max: 4 },
      rounds: [
        {
          roundNumber: 1,
          title: "Arena Navigation & Vision Qualifying",
          deadline: new Date(now.getTime() + 72 * 60 * 60 * 1000),
        },
      ],
      rubric: [
        { criterion: "Autonomous Navigation Speed", maxScore: 10, weight: 1.5 },
        { criterion: "Obstacle Avoidance Precision", maxScore: 10, weight: 2.0 },
      ],
      judges: [judge._id],
      status: "upcoming",
    });

    console.log(" Creating Teams for Hackathon Event...");
    const team1 = await Team.create({
      eventId: hackathonEvent._id,
      name: "NeuralPulse Innovators",
      inviteCode: "NPULSE",
      leaderId: participant._id,
      members: [participant._id, marcus._id],
      checkedIn: true,
    });

    const team2 = await Team.create({
      eventId: hackathonEvent._id,
      name: "QuantumVortex",
      inviteCode: "QVORTX",
      leaderId: sarah._id,
      members: [sarah._id],
      checkedIn: true,
    });

    const team3 = await Team.create({
      eventId: hackathonEvent._id,
      name: "CyberSentinels",
      inviteCode: "CSENTL",
      leaderId: organizer._id,
      members: [organizer._id],
      checkedIn: true,
    });

    const team4 = await Team.create({
      eventId: hackathonEvent._id,
      name: "HyperLoopers",
      inviteCode: "HPLOOP",
      leaderId: marcus._id,
      members: [marcus._id],
      checkedIn: false,
    });

    console.log(" Creating Project Submissions...");
    const sub1 = await Submission.create({
      eventId: hackathonEvent._id,
      teamId: team1._id,
      roundNumber: 1,
      projectTitle: "FestFlow Autonomous Dispatcher",
      tagline: "Real-time AI logistics and incident triage for mega-campus fests",
      description:
        "A distributed full-stack platform coordinating volunteer fleets, incident ticketing, dynamic stage crowd routing, and real-time audio announcement synthesis.",
      repoUrl: "https://github.com/festflow/dispatcher",
      demoUrl: "https://festflow-dispatcher.demo.app",
      videoUrl: "https://youtube.com/watch?v=demo123",
      techStack: ["React", "Vite", "Node.js", "Socket.io", "Mongoose", "Tailwind CSS"],
      submittedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    });

    const sub2 = await Submission.create({
      eventId: hackathonEvent._id,
      teamId: team2._id,
      roundNumber: 1,
      projectTitle: "BioSense Sentinel Edge",
      tagline: "Ultra-low-latency computer vision triage for emergency medical tents",
      description:
        "Utilizes lightweight edge machine learning models to detect heat exhaustion, vital anomalies, and crowd surge pressure points in real time.",
      repoUrl: "https://github.com/quantums/biosense",
      demoUrl: "https://biosense-sentinel.live",
      videoUrl: "https://youtube.com/watch?v=demo456",
      techStack: ["Python", "FastAPI", "React", "OpenCV", "TensorFlow"],
      submittedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    });

    const sub3 = await Submission.create({
      eventId: hackathonEvent._id,
      teamId: team3._id,
      roundNumber: 1,
      projectTitle: "GreenPulse Campus Ledger",
      tagline: "Decentralized carbon offset tracker for zero-waste university hackathons",
      description:
        "Integrates smart sensors with audited cryptographic proofs to reward participants for zero-waste composting, recycled plastic badge redemption, and mass transit usage.",
      repoUrl: "https://github.com/cybers/greenpulse",
      demoUrl: "https://greenpulse.campus.org",
      videoUrl: "https://youtube.com/watch?v=demo789",
      techStack: ["Solidity", "Ethers.js", "React", "Node.js", "Tailwind CSS"],
      submittedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000),
    });

    const sub4 = await Submission.create({
      eventId: hackathonEvent._id,
      teamId: team4._id,
      roundNumber: 1,
      projectTitle: "SoundSphere Spatial VR",
      tagline: "Spatial audio synthesizer transforming hackathon pitches into 3D auditory spaces",
      description:
        "Transforms browser-based video demos into rich binaural 3D auditory stages, allowing remote judges to experience live team code reviews collaboratively.",
      repoUrl: "https://github.com/hyper/soundsphere",
      demoUrl: "https://soundsphere-audio.demo",
      videoUrl: "https://youtube.com/watch?v=demo999",
      techStack: ["WebAudio API", "Three.js", "Socket.io", "React"],
      submittedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    });

    console.log(" Creating Judge Evaluations & Computing Leaderboard...");
    // Scores for sub1 (Team 1)
    const scoresSub1 = [
      { criterion: "Innovation & Originality", score: 9.5, maxScore: 10, weight: 1.5 },
      { criterion: "Technical Execution & Architecture", score: 9.2, maxScore: 10, weight: 2.0 },
      { criterion: "UI/UX & User Experience", score: 9.0, maxScore: 10, weight: 1.0 },
      { criterion: "Real-world Viability & Impact", score: 9.6, maxScore: 10, weight: 1.5 },
    ];
    // Total weighted = (9.5/10*1.5 + 9.2/10*2.0 + 9.0/10*1.0 + 9.6/10*1.5)*10 = (1.425 + 1.84 + 0.90 + 1.44)*10 = 56.05
    const totalWeightedSub1 = Number(
      scoresSub1
        .reduce((sum, item) => sum + (item.score / item.maxScore) * item.weight * 10, 0)
        .toFixed(2)
    );

    await Evaluation.create({
      submissionId: sub1._id,
      eventId: hackathonEvent._id,
      judgeId: judge._id,
      scores: scoresSub1,
      totalWeightedScore: totalWeightedSub1,
      feedback:
        "Outstanding architecture and seamless real-time WebSocket state management. Extremely practical for large festivals.",
    });

    // Scores for sub2 (Team 2)
    const scoresSub2 = [
      { criterion: "Innovation & Originality", score: 8.8, maxScore: 10, weight: 1.5 },
      { criterion: "Technical Execution & Architecture", score: 8.6, maxScore: 10, weight: 2.0 },
      { criterion: "UI/UX & User Experience", score: 8.2, maxScore: 10, weight: 1.0 },
      { criterion: "Real-world Viability & Impact", score: 8.5, maxScore: 10, weight: 1.5 },
    ];
    const totalWeightedSub2 = Number(
      scoresSub2
        .reduce((sum, item) => sum + (item.score / item.maxScore) * item.weight * 10, 0)
        .toFixed(2)
    );

    await Evaluation.create({
      submissionId: sub2._id,
      eventId: hackathonEvent._id,
      judgeId: judge._id,
      scores: scoresSub2,
      totalWeightedScore: totalWeightedSub2,
      feedback:
        "Impressive computer vision integration and fast model inference. Great documentation.",
    });

    // Scores for sub3 (Team 3)
    const scoresSub3 = [
      { criterion: "Innovation & Originality", score: 8.0, maxScore: 10, weight: 1.5 },
      { criterion: "Technical Execution & Architecture", score: 7.8, maxScore: 10, weight: 2.0 },
      { criterion: "UI/UX & User Experience", score: 8.5, maxScore: 10, weight: 1.0 },
      { criterion: "Real-world Viability & Impact", score: 7.9, maxScore: 10, weight: 1.5 },
    ];
    const totalWeightedSub3 = Number(
      scoresSub3
        .reduce((sum, item) => sum + (item.score / item.maxScore) * item.weight * 10, 0)
        .toFixed(2)
    );

    await Evaluation.create({
      submissionId: sub3._id,
      eventId: hackathonEvent._id,
      judgeId: judge._id,
      scores: scoresSub3,
      totalWeightedScore: totalWeightedSub3,
      feedback:
        "Solid smart contract design and clean UI presentation. Could improve offline state resilience.",
    });

    // Scores for sub4 (Team 4)
    const scoresSub4 = [
      { criterion: "Innovation & Originality", score: 7.5, maxScore: 10, weight: 1.5 },
      { criterion: "Technical Execution & Architecture", score: 7.0, maxScore: 10, weight: 2.0 },
      { criterion: "UI/UX & User Experience", score: 7.8, maxScore: 10, weight: 1.0 },
      { criterion: "Real-world Viability & Impact", score: 7.2, maxScore: 10, weight: 1.5 },
    ];
    const totalWeightedSub4 = Number(
      scoresSub4
        .reduce((sum, item) => sum + (item.score / item.maxScore) * item.weight * 10, 0)
        .toFixed(2)
    );

    await Evaluation.create({
      submissionId: sub4._id,
      eventId: hackathonEvent._id,
      judgeId: judge._id,
      scores: scoresSub4,
      totalWeightedScore: totalWeightedSub4,
      feedback:
        "Innovative audio concept. Would love to see further optimization of spatial rendering latency.",
    });

    console.log(" Seed completed successfully!");
    console.log("----------------------------------------------------------------");
    console.log(" DEMO CREDENTIALS (All passwords: demo123456):");
    console.log(" 1. Organizer   : organizer@demo.com");
    console.log(" 2. Lead Judge  : judge@demo.com");
    console.log(" 3. Participant : participant@demo.com");
    console.log("----------------------------------------------------------------");
  } catch (error) {
    console.error(" Error seeding database:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log(" MongoDB disconnected.");
  }
};

// Execute if run directly from CLI
if (process.argv[1]?.endsWith("seed.js")) {
  seedDatabase();
}
