const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Workout = require("./models/Workout");
const auth = require("./middleware/auth");

const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || "your_secret_key";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://praveenjayathilake22_db_user:IMBuuF6dy6cI7aIS@cluster0.gmgl2nc.mongodb.net/?appName=Cluster0";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5174";

const app = express();

// CORS Configuration - Updated for production
app.use(cors({
    origin: [
        "http://localhost:5174",
        "http://localhost:5173",
        "http://localhost:3000",
        FRONTEND_URL
    ].filter(Boolean), // Remove undefined values
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// MongoDB Connection
mongoose
    .connect(MONGODB_URI)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));

/* MODELS */
const User = mongoose.model("User", {
    username: String,
    email: String,
    password: String,
});

const AthleteProfile = mongoose.model("AthleteProfile", {
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        unique: true,
    },
    fullName: String,
    mainEvent: String,
    otherEvents: [String],
    personalBestValue: String,
    heightCm: Number,
    weightKg: Number,
    bmi: Number,
    trainingDaysPerWeek: Number,
    createdAt: { type: Date, default: Date.now },
});

/* AUTH MIDDLEWARE */
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token" });

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.userId = decoded.userId;
        next();
    } catch {
        res.status(401).json({ message: "Invalid token" });
    }
};

/* ROUTES */

// Health check route
app.get("/", (req, res) => {
    res.json({
        status: "OK",
        message: "Athlete Tracker API is running",
        timestamp: new Date().toISOString()
    });
});

app.post("/api/signup", async (req, res) => {
    const { username, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already used" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ userId: user._id }, SECRET_KEY, {
        expiresIn: "24h",
    });

    res.status(201).json({ message: "Signup successful", token });
});

app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
        return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, SECRET_KEY, {
        expiresIn: "24h",
    });

    res.json({ message: "Login successful", token });
});

app.post("/api/profile", authMiddleware, async (req, res) => {
    const {
        fullName,
        mainEvent,
        otherEvents,
        personalBestValue,
        heightCm,
        weightKg,
        trainingDaysPerWeek,
    } = req.body;

    const bmi = Number(
        (weightKg / Math.pow(heightCm / 100, 2)).toFixed(1)
    );

    const profile = new AthleteProfile({
        userId: req.userId,
        fullName,
        mainEvent,
        otherEvents,
        personalBestValue,
        heightCm,
        weightKg,
        bmi,
        trainingDaysPerWeek,
    });

    await profile.save();
    res.status(201).json({ message: "Profile created" });
});

app.get("/api/profile/me", authMiddleware, async (req, res) => {
    try {
        const profile = await AthleteProfile.findOne({
            userId: req.userId,
        });

        if (!profile) {
            return res.status(404).json({ message: "Profile not found" });
        }

        res.json(profile);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

app.post("/api/workouts", auth, async (req, res) => {
    try {
        const workout = new Workout({
            userId: req.userId,
            ...req.body,
        });

        await workout.save();
        res.status(201).json({ message: "Workout saved successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to save workout" });
    }
});

app.get("/api/workouts", auth, async (req, res) => {
    try {
        const workouts = await Workout.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .limit(100);

        res.json({
            success: true,
            workouts
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch workouts"
        });
    }
});

// Competitions route
const competitionRoutes = require('./routes/competitions');
app.use('/api/competitions', competitionRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;