import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_URL from "../config/api.js";

const Profile = () => {
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [competitions, setCompetitions] = useState([]);
    const [personalBest, setPersonalBest] = useState(null);
    const [workouts, setWorkouts] = useState([]);
    const [strengthPRs, setStrengthPRs] = useState([]);
    const [selectedExercise, setSelectedExercise] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        const fetchData = async () => {
            try {
                // Fetch profile
                const profileRes = await axios.get(
                    `${API_URL}/api/profile/me`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                console.log("Profile loaded:", profileRes.data);
                setProfile(profileRes.data);

                // Fetch competitions
                const compRes = await axios.get(
                    `${API_URL}/api/competitions`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const comps = compRes.data.competitions || [];
                setCompetitions(comps);

                // Calculate personal best (fastest time)
                if (comps.length > 0) {
                    const mainEvent = profileRes.data.mainEvent;

                    // Filter competitions for main event
                    const mainEventComps = comps.filter(c =>
                        c.distance === mainEvent
                    );

                    if (mainEventComps.length > 0) {
                        // Find fastest time
                        const fastest = mainEventComps.reduce((best, current) => {
                            const currentTime = timeToSeconds(current.raceTime);
                            const bestTime = timeToSeconds(best.raceTime);
                            return currentTime < bestTime ? current : best;
                        });

                        setPersonalBest(fastest);
                    }
                }

                // Fetch workouts for strength PRs
                const workoutRes = await axios.get(
                    `${API_URL}/api/workouts`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const allWorkouts = workoutRes.data.workouts || [];
                setWorkouts(allWorkouts);

                // Calculate strength PRs (heaviest weight for each exercise)
                const strengthWorkouts = allWorkouts.filter(w =>
                    w.workoutType === "Strength" && w.exercises && w.exercises.length > 0
                );

                const exercisePRs = {};
                strengthWorkouts.forEach(workout => {
                    workout.exercises.forEach(ex => {
                        if (ex.exercise && ex.weight) {
                            if (!exercisePRs[ex.exercise] || ex.weight > exercisePRs[ex.exercise].weight) {
                                exercisePRs[ex.exercise] = {
                                    exercise: ex.exercise,
                                    weight: ex.weight,
                                    reps: ex.reps,
                                    date: workout.date
                                };
                            }
                        }
                    });
                });

                const prs = Object.values(exercisePRs);
                setStrengthPRs(prs);

                if (prs.length > 0 && !selectedExercise) {
                    setSelectedExercise(prs[0].exercise);
                }

            } catch (err) {
                console.error("Failed to load data:", err);
                if (err.response?.status === 404) {
                    navigate("/setup-profile");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    // Convert time string (mm:ss:ms) to seconds
    const timeToSeconds = (timeStr) => {
        const [mm, ss, ms] = timeStr.split(':').map(Number);
        return mm * 60 + ss + ms / 100;
    };

    // Format time - remove leading 00: for sub-minute times
    const formatTime = (timeStr) => {
        const [mm, ss, ms] = timeStr.split(':');

        // If minutes are 00, return just seconds
        if (mm === "00") {
            return `${ss}:${ms}`;
        }

        return timeStr; // Return full format for times over 1 minute
    };

    const getSelectedPR = () => {
        return strengthPRs.find(pr => pr.exercise === selectedExercise);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    if (loading) {
        return (
            <div className="bg-background-dark text-white min-h-screen flex items-center justify-center">
                Loading profile...
            </div>
        );
    }

    return (
        <div className="bg-background-dark text-white min-h-screen pb-24">
            {/* TOP APP BAR */}
            <header className="sticky top-0 z-50 bg-background-dark/80 backdrop-blur-md border-b border-slate-800/50">
                <div className="flex items-center justify-between p-4">
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-800/50"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h2 className="text-lg font-bold flex-1 text-center">Athlete Profile</h2>
                    <button className="flex size-10 items-center justify-center rounded-full bg-slate-800/50">
                        <span className="material-symbols-outlined">settings</span>
                    </button>
                </div>
            </header>

            {/* PROFILE HERO */}
            <div className="flex p-6 flex-col items-center">
                <div className="relative">
                    <div className="bg-slate-700 rounded-full h-32 w-32 border-4 border-primary shadow-[0_0_20px_rgba(37,106,244,0.3)] flex items-center justify-center">
                        <span className="text-5xl font-bold">{profile?.fullName?.charAt(0)}</span>
                    </div>
                    <div className="absolute bottom-1 right-1 bg-primary text-white p-1 rounded-full border-2 border-background-dark">
                        <span className="material-symbols-outlined text-xs">verified</span>
                    </div>
                </div>

                <div className="mt-4 text-center">
                    <p className="text-2xl font-bold">{profile?.fullName}</p>
                    <div className="flex items-center gap-2 mt-1 justify-center">
                        <span className="bg-primary/20 text-primary text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                            Athlete
                        </span>
                        <p className="text-slate-400 text-sm">{profile?.mainEvent}</p>
                    </div>
                </div>

                {/* QUICK ACTIONS */}
                <div className="flex w-full max-w-sm gap-3 mt-6">
                    <button
                        onClick={() => navigate("/setup-profile")}
                        className="flex-1 h-12 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20"
                    >
                        Edit Profile
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex-1 h-12 rounded-xl bg-slate-800 text-slate-300 font-bold border border-slate-700"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* BIOMETRICS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4">
                <div className="rounded-2xl p-4 bg-slate-800/40 border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-primary text-sm">straighten</span>
                        <p className="text-slate-400 text-xs font-semibold uppercase">Height</p>
                    </div>
                    <p className="text-xl font-bold">
                        {profile?.heightCm || "—"}
                        <span className="text-xs text-slate-400 ml-0.5">cm</span>
                    </p>
                </div>

                <div className="rounded-2xl p-4 bg-slate-800/40 border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-primary text-sm">monitor_weight</span>
                        <p className="text-slate-400 text-xs font-semibold uppercase">Weight</p>
                    </div>
                    <p className="text-xl font-bold">
                        {profile?.weightKg || "—"}
                        <span className="text-xs text-slate-400 ml-0.5">kg</span>
                    </p>
                </div>

                <div className="rounded-2xl p-4 bg-slate-800/40 border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-primary text-sm">calculate</span>
                        <p className="text-slate-400 text-xs font-semibold uppercase">BMI</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <p className="text-xl font-bold">{profile?.bmi || "—"}</p>
                        {profile?.bmi && (
                            <>
                                <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                                <span className="text-[10px] text-emerald-500 font-bold uppercase">
                                    Optimal
                                </span>
                            </>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl p-4 bg-slate-800/40 border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-primary text-sm">calendar_today</span>
                        <p className="text-slate-400 text-xs font-semibold uppercase">Freq</p>
                    </div>
                    <p className="text-xl font-bold">
                        {profile?.trainingDaysPerWeek || "—"}
                        <span className="text-xs text-slate-400 ml-0.5">d/wk</span>
                    </p>
                </div>
            </div>

            {/* PERSONAL BESTS SUMMARY */}
            <div className="px-4 mt-6">
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] pb-3 px-1">
                    Personal Bests
                </h3>
                <div className="space-y-3">
                    {/* Personal Best from Competitions */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/40 border-l-4 border-primary">
                        <div className="flex flex-col">
                            <p className="text-slate-400 text-xs font-medium">{profile?.mainEvent}</p>
                            <p className="text-white text-2xl font-bold">
                                {personalBest ? (
                                    formatTime(personalBest.raceTime)
                                ) : (
                                    <>
                                        —<span className="text-sm font-normal ml-1">TBD</span>
                                    </>
                                )}
                            </p>
                        </div>
                        <div className="flex flex-col items-end">
                            {personalBest ? (
                                <>
                                    <p className="text-emerald-500 text-[10px] uppercase font-bold">
                                        Personal Best
                                    </p>
                                    <p className="text-slate-500 text-xs">
                                        {new Date(personalBest.date).toLocaleDateString()}
                                    </p>
                                </>
                            ) : (
                                <p className="text-slate-500 text-[10px] uppercase font-bold">
                                    Not Set
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Strength Exercise PR with Dropdown */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/40 border-l-4 border-slate-700">
                        <div className="flex flex-col flex-1">
                            {strengthPRs.length > 0 ? (
                                <>
                                    <select
                                        value={selectedExercise}
                                        onChange={(e) => setSelectedExercise(e.target.value)}
                                        className="text-slate-400 text-xs font-medium bg-transparent border-none outline-none cursor-pointer mb-1"
                                    >
                                        {strengthPRs.map(pr => (
                                            <option
                                                key={pr.exercise}
                                                value={pr.exercise}
                                                className="bg-slate-800"
                                            >
                                                {pr.exercise}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-white text-2xl font-bold">
                                        {getSelectedPR()?.weight} kg
                                        <span className="text-sm font-normal ml-2 text-slate-400">
                                            × {getSelectedPR()?.reps}
                                        </span>
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="text-slate-400 text-xs font-medium">Gym PR</p>
                                    <p className="text-white text-2xl font-bold">
                                        —<span className="text-sm font-normal ml-1">TBD</span>
                                    </p>
                                </>
                            )}
                        </div>
                        <div className="flex flex-col items-end">
                            {strengthPRs.length > 0 && getSelectedPR() ? (
                                <>
                                    <p className="text-yellow-500 text-[10px] uppercase font-bold">
                                        Gym PR
                                    </p>
                                    <p className="text-slate-500 text-xs">
                                        {new Date(getSelectedPR().date).toLocaleDateString()}
                                    </p>
                                </>
                            ) : (
                                <p className="text-slate-500 text-[10px] uppercase font-bold">
                                    Not Set
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* PRIMARY EVENT & PREFERENCES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 mt-6">
                <div className="flex flex-col">
                    <h3 className="text-sm font-bold uppercase tracking-[0.2em] pb-3 px-1">
                        Primary Focus
                    </h3>
                    <div className="flex items-center gap-4 rounded-2xl bg-primary/10 p-4 border border-primary/20">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
                            <span className="material-symbols-outlined text-3xl">timer</span>
                        </div>
                        <div className="flex flex-col">
                            <p className="text-base font-bold">{profile?.mainEvent || "Not Set"}</p>
                            <p className="text-primary text-xs font-medium">Primary Event</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col">
                    <h3 className="text-sm font-bold uppercase tracking-[0.2em] pb-3 px-1">
                        Training
                    </h3>
                    <div className="flex items-center gap-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 p-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-yellow-400">
                            <span className="material-symbols-outlined text-3xl">fitness_center</span>
                        </div>
                        <div className="flex flex-col">
                            <p className="text-base font-bold">
                                {profile?.trainingDaysPerWeek || "—"} days/week
                            </p>
                            <p className="text-slate-400 text-xs font-medium">Frequency</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* PERFORMANCE ANALYTICS MINI CARD */}
            <div className="px-4 mt-6 mb-10">
                <div className="rounded-3xl overflow-hidden bg-slate-800/40 border border-slate-700/50 relative h-36 flex flex-col justify-end p-5">
                    <div className="absolute inset-0 opacity-20 pointer-events-none"
                         style={{ background: "linear-gradient(45deg, #256af4, transparent)" }}>
                    </div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">
                                    Total Competitions
                                </p>
                                <p className="text-white text-4xl font-bold">{competitions.length}</p>
                            </div>
                            <div className="flex gap-1 items-end h-16">
                                {competitions.slice(0, 5).map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`w-1.5 rounded-full ${
                                            idx === 4 ? 'bg-primary shadow-[0_0_10px_rgba(37,106,244,0.5)]' : 'bg-slate-700'
                                        }`}
                                        style={{
                                            height: `${40 + (idx * 10)}%`
                                        }}
                                    ></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;