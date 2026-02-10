import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_URL from "../config/api.js";

const Records = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("all");
    const [loading, setLoading] = useState(true);

    // Data states
    const [profile, setProfile] = useState(null);
    const [competitions, setCompetitions] = useState([]);
    const [workouts, setWorkouts] = useState([]);
    const [featuredPRs, setFeaturedPRs] = useState([]);
    const [allRecords, setAllRecords] = useState([]);
    const [monthlyProgress, setMonthlyProgress] = useState(0);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (profile && competitions.length > 0 && workouts.length > 0) {
            processFeaturedPRs();
            processAllRecords();
        }
    }, [activeTab, profile, competitions, workouts]);

    const fetchData = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        try {
            // Fetch profile
            const profileRes = await axios.get(`${API_URL}/api/profile/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(profileRes.data);

            // Fetch competitions
            const compRes = await axios.get(`${API_URL}/api/competitions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCompetitions(compRes.data.competitions || []);

            // Fetch workouts
            const workoutRes = await axios.get(`${API_URL}/api/workouts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWorkouts(workoutRes.data.workouts || []);

            // Calculate monthly progress
            calculateMonthlyProgress(compRes.data.competitions || [], workoutRes.data.workouts || []);

            setLoading(false);
        } catch (error) {
            console.error("Error fetching data:", error);
            setLoading(false);
        }
    };

    const calculateMonthlyProgress = (comps, works) => {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        const recentComps = comps.filter(c => new Date(c.date) >= oneMonthAgo);
        const recentWorkouts = works.filter(w => new Date(w.date) >= oneMonthAgo);

        setMonthlyProgress(recentComps.length + recentWorkouts.length);
    };

    const timeToSeconds = (timeStr) => {
        const [mm, ss, ms] = timeStr.split(':').map(Number);
        return mm * 60 + ss + ms / 100;
    };

    const formatTime = (timeStr) => {
        const [mm, ss, ms] = timeStr.split(':');
        if (mm === "00") {
            return `${ss}.${ms}s`;
        }
        return `${parseInt(mm)}:${ss}.${ms}`;
    };

    const processFeaturedPRs = () => {
        const prs = [];

        // Running PR (Main Event)
        if (profile?.mainEvent) {
            const mainEventComps = competitions.filter(c => c.distance === profile.mainEvent);
            if (mainEventComps.length > 0) {
                const sorted = [...mainEventComps].sort((a, b) =>
                    timeToSeconds(a.raceTime) - timeToSeconds(b.raceTime)
                );
                const best = sorted[0];

                // Calculate improvement
                let improvement = "—";
                if (sorted.length > 1) {
                    const diff = timeToSeconds(sorted[1].raceTime) - timeToSeconds(best.raceTime);
                    improvement = `-${diff.toFixed(2)}s`;
                }

                prs.push({
                    id: 'main-event',
                    icon: "speed",
                    name: profile.mainEvent,
                    value: formatTime(best.raceTime).replace('s', ''),
                    unit: "s",
                    improvement: improvement,
                    status: "Active",
                    statusColor: "green",
                    trending: "trending_down"
                });
            }
        }

        // Strength PR (Heaviest lift)
        const strengthWorkouts = workouts.filter(w => w.workoutType === "Strength" && w.exercises?.length > 0);
        if (strengthWorkouts.length > 0) {
            let heaviestExercise = null;
            let maxWeight = 0;

            strengthWorkouts.forEach(workout => {
                workout.exercises.forEach(ex => {
                    if (ex.weight > maxWeight) {
                        maxWeight = ex.weight;
                        heaviestExercise = {
                            name: ex.exercise,
                            weight: ex.weight,
                            reps: ex.reps,
                            date: workout.date
                        };
                    }
                });
            });

            if (heaviestExercise) {
                prs.push({
                    id: 'strength-pr',
                    icon: "fitness_center",
                    name: heaviestExercise.name,
                    value: heaviestExercise.weight,
                    unit: "kg",
                    improvement: `×${heaviestExercise.reps}`,
                    status: "Elite",
                    statusColor: "primary",
                    trending: "trending_up"
                });
            }
        }

        setFeaturedPRs(prs);
    };

    const processAllRecords = () => {
        let records = [];

        // Competition records
        const competitionRecords = competitions.map(comp => {
            const eventType = getEventType(comp.distance);

            return {
                id: `comp-${comp._id}`,
                type: 'competition',
                eventType: eventType,
                icon: eventType === 'sprints' ? 'timer' : 'directions_run',
                name: comp.distance,
                date: new Date(comp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                value: formatTime(comp.raceTime),
                change: comp.location,
                changeType: "neutral",
                rawDate: new Date(comp.date)
            };
        });

        // Strength workout records (unique exercises with max weight)
        const strengthWorkouts = workouts.filter(w => w.workoutType === "Strength" && w.exercises?.length > 0);
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

        const strengthRecords = Object.values(exercisePRs).map(pr => ({
            id: `strength-${pr.exercise}`,
            type: 'workout',
            eventType: 'strength',
            icon: 'exercise',
            name: pr.exercise,
            date: new Date(pr.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            value: `${pr.weight}kg`,
            change: `×${pr.reps} reps`,
            changeType: "positive",
            rawDate: new Date(pr.date)
        }));

        // Endurance records (total distance per workout)
        const enduranceWorkouts = workouts.filter(w =>
            (w.workoutType === "Endurance" || w.workoutType === "Sprint") &&
            w.sets?.length > 0
        );

        const enduranceRecords = enduranceWorkouts.map(workout => {
            const totalDistance = workout.sets.reduce((sum, set) => {
                return sum + set.reps.reduce((rSum, rep) => {
                    return rSum + (parseFloat(rep.distance) || 0);
                }, 0);
            }, 0);

            return {
                id: `endurance-${workout._id}`,
                type: 'workout',
                eventType: 'endurance',
                icon: 'directions_run',
                name: workout.workoutType,
                date: new Date(workout.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                value: `${(totalDistance / 1000).toFixed(1)}km`,
                change: `${workout.sets.length} sets`,
                changeType: "neutral",
                rawDate: new Date(workout.date)
            };
        });

        // Combine and sort by date
        records = [...competitionRecords, ...strengthRecords, ...enduranceRecords]
            .sort((a, b) => b.rawDate - a.rawDate);

        // Filter by active tab
        if (activeTab !== "all") {
            records = records.filter(r => r.eventType === activeTab);
        }

        setAllRecords(records);
    };

    const getEventType = (distance) => {
        const dist = parseInt(distance);
        if (dist <= 400) return 'sprints';
        if (dist >= 3000) return 'endurance';
        return 'sprints'; // Middle distance as sprints
    };

    if (loading) {
        return (
            <div className="bg-background-dark text-white min-h-screen flex items-center justify-center">
                <p className="text-lg">Loading records...</p>
            </div>
        );
    }

    return (
        <div className="bg-background-dark text-white min-h-screen pb-24">
            {/* TOP APP BAR */}
            <header className="sticky top-0 z-50 bg-background-dark border-b border-slate-800/30">
                <div className="flex items-center justify-between p-4">
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="text-white flex items-center"
                    >
                        <span className="material-symbols-outlined">arrow_back_ios</span>
                    </button>
                    <h2 className="text-lg font-bold flex-1 text-center">Personal Bests</h2>
                    <button className="flex items-center justify-center opacity-0 pointer-events-none">
                        <span className="material-symbols-outlined">analytics</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto">
                {/* SUMMARY STATS */}
                <div className="px-4 pt-6 pb-2">
                    <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-primary">
                                Monthly Progress
                            </p>
                            <p className="text-2xl font-bold text-white">
                                {monthlyProgress > 0 ? `+${monthlyProgress}` : monthlyProgress} New Records
                            </p>
                        </div>
                        <div className="bg-primary rounded-full p-2">
                            <span className="material-symbols-outlined text-white">bolt</span>
                        </div>
                    </div>
                </div>

                {/* CATEGORY TABS */}
                <div className="pb-3 sticky top-[73px] bg-background-dark z-10 pt-2">
                    <div className="flex border-b border-slate-800/30 px-4 gap-8 overflow-x-auto scrollbar-hide">
                        {["all", "sprints", "strength", "endurance"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 whitespace-nowrap ${
                                    activeTab === tab
                                        ? "border-b-primary text-white"
                                        : "border-b-transparent text-slate-400"
                                }`}
                            >
                                <p className="text-sm font-bold capitalize">
                                    {tab === "all" ? "All Records" : tab}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* FEATURED PRS CAROUSEL */}
                {featuredPRs.length > 0 && (
                    <>
                        <h3 className="text-white text-lg font-bold px-4 pb-2 pt-4">Featured PRs</h3>
                        <div className="flex overflow-x-auto scrollbar-hide">
                            <div className="flex items-stretch p-4 gap-4">
                                {featuredPRs.map((pr) => (
                                    <div
                                        key={pr.id}
                                        className="flex h-full flex-1 flex-col gap-3 rounded-xl min-w-[280px] bg-[#1c2638] p-4 border border-slate-700/50 shadow-sm"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-primary">
                                                    {pr.icon}
                                                </span>
                                            </div>
                                            <span
                                                className={`${
                                                    pr.statusColor === "green"
                                                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                                                        : "bg-primary/10 text-primary border-primary/20"
                                                } text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest border`}
                                            >
                                                {pr.status}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-sm font-medium">{pr.name}</p>
                                            <h4 className="text-primary text-4xl font-bold mt-1">
                                                {pr.value}
                                                <span className="text-lg">{pr.unit}</span>
                                            </h4>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2 pt-3 border-t border-slate-700/30">
                                            <span className="material-symbols-outlined text-green-500 text-sm">
                                                {pr.trending}
                                            </span>
                                            <p className="text-green-500 text-sm font-bold">
                                                {pr.improvement}{" "}
                                                <span className="text-slate-500 font-normal">vs prev</span>
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* ALL RECORDS LIST */}
                <div className="px-4 pb-8">
                    <h2 className="text-white text-[22px] font-bold pb-3 pt-5">All History</h2>
                    {allRecords.length > 0 ? (
                        <div className="space-y-3">
                            {allRecords.map((record) => (
                                <div
                                    key={record.id}
                                    className="flex items-center justify-between p-4 bg-[#1c2638] rounded-xl border border-slate-700/50"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-background-dark flex items-center justify-center">
                                            <span className="material-symbols-outlined text-slate-400">
                                                {record.icon}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-base">
                                                {record.name}
                                            </p>
                                            <p className="text-slate-400 text-xs">{record.date}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white font-bold text-lg">{record.value}</p>
                                        <p
                                            className={`text-xs font-bold ${
                                                record.changeType === "positive"
                                                    ? "text-green-500"
                                                    : "text-slate-400"
                                            }`}
                                        >
                                            {record.change}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-slate-500 text-3xl">
                                    sports_score
                                </span>
                            </div>
                            <p className="text-slate-400 text-sm">No records found for {activeTab}</p>
                            <p className="text-slate-500 text-xs mt-1">Start logging workouts to track your progress!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Records;