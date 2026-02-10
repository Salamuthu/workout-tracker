import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_URL from "../config/api.js";

const Dashboard = () => {
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [competitions, setCompetitions] = useState([]);
    const [workouts, setWorkouts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Calculated stats
    const [lastCompetition, setLastCompetition] = useState(null);
    const [lastWorkout, setLastWorkout] = useState(null);
    const [weeklyDistance, setWeeklyDistance] = useState(0);
    const [streak, setStreak] = useState(0);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
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

            // Get last competition for main event only
            if (compRes.data.competitions && compRes.data.competitions.length > 0 && profileRes.data.mainEvent) {
                const mainEventComps = compRes.data.competitions.filter(c =>
                    c.distance === profileRes.data.mainEvent
                );
                if (mainEventComps.length > 0) {
                    setLastCompetition(mainEventComps[0]);
                }
            }

            // Fetch workouts
            const workoutRes = await axios.get(`${API_URL}/api/workouts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const fetchedWorkouts = workoutRes.data.workouts || [];
            setWorkouts(fetchedWorkouts);

            console.log('=== FETCHED WORKOUTS ===');
            console.log('First workout:', fetchedWorkouts[0]);

            if (fetchedWorkouts.length > 0) {
                setLastWorkout(fetchedWorkouts[0]);
            }

            // Calculate weekly distance
            calculateWeeklyDistance(fetchedWorkouts);

            // Calculate streak
            calculateStreak(fetchedWorkouts);

            setLoading(false);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            if (error.response?.status === 401) {
                localStorage.removeItem("token");
                navigate("/login");
            }
            setLoading(false);
        }
    };

    const calculateWeeklyDistance = (workouts) => {
        const now = new Date();
        const currentDay = now.getDay();
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;

        const thisMonday = new Date(now);
        thisMonday.setDate(now.getDate() + mondayOffset);
        thisMonday.setHours(0, 0, 0, 0);

        const thisWeekWorkouts = workouts.filter(w => {
            const workoutDate = new Date(w.date);
            return workoutDate >= thisMonday;
        });

        const totalDistance = thisWeekWorkouts.reduce((sum, w) => {
            // Distance is in sets -> reps
            if (w.sets && Array.isArray(w.sets)) {
                const workoutDist = w.sets.reduce((setSum, set) => {
                    if (set.reps && Array.isArray(set.reps)) {
                        return setSum + set.reps.reduce((repSum, rep) => {
                            return repSum + (parseFloat(rep.distance) / 1000 || 0); // Convert m to km
                        }, 0);
                    }
                    return setSum;
                }, 0);
                return sum + workoutDist;
            }
            return sum;
        }, 0);

        setWeeklyDistance(totalDistance);
    };

    const calculateStreak = (workouts) => {
        if (workouts.length === 0) {
            setStreak(0);
            return;
        }

        const sortedWorkouts = [...workouts].sort((a, b) =>
            new Date(b.date) - new Date(a.date)
        );

        let currentStreak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        for (let workout of sortedWorkouts) {
            const workoutDate = new Date(workout.date);
            workoutDate.setHours(0, 0, 0, 0);

            const diffDays = Math.floor((currentDate - workoutDate) / (1000 * 60 * 60 * 24));

            if (diffDays === currentStreak || diffDays === currentStreak + 1) {
                currentStreak = diffDays + 1;
            } else {
                break;
            }
        }

        setStreak(currentStreak);
    };

    const getChartData = () => {
        if (!profile?.mainEvent) return [];

        // Filter competitions by main event only
        const mainEventComps = competitions.filter(c =>
            c.distance === profile.mainEvent
        );

        const last7 = mainEventComps.slice(0, 7).reverse();
        return last7.map(comp => {
            const [mm, ss, ms] = comp.raceTime.split(':');
            return (parseInt(mm) * 60) + parseInt(ss) + (parseInt(ms) / 100);
        });
    };

    const getWeeklyVolumes = () => {
        const weeks = [0, 0, 0, 0];
        const now = new Date();

        for (let i = 0; i < 4; i++) {
            const currentDay = now.getDay();
            const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;

            const thisMonday = new Date(now);
            thisMonday.setDate(now.getDate() + mondayOffset - (i * 7));
            thisMonday.setHours(0, 0, 0, 0);

            const thisSunday = new Date(thisMonday);
            thisSunday.setDate(thisMonday.getDate() + 6);
            thisSunday.setHours(23, 59, 59, 999);

            const weekWorkouts = workouts.filter(w => {
                const workoutDate = new Date(w.date);
                return workoutDate >= thisMonday && workoutDate <= thisSunday;
            });

            const totalDist = weekWorkouts.reduce((sum, w) => {
                // Distance is in sets -> reps
                if (w.sets && Array.isArray(w.sets)) {
                    return sum + w.sets.reduce((setSum, set) => {
                        if (set.reps && Array.isArray(set.reps)) {
                            return setSum + set.reps.reduce((repSum, rep) => {
                                return repSum + (parseFloat(rep.distance) / 1000 || 0); // Convert m to km
                            }, 0);
                        }
                        return setSum;
                    }, 0);
                }
                return sum;
            }, 0);

            weeks[3 - i] = totalDist;
        }

        return weeks;
    };

    const getWorkoutCategory = (workout) => {
        // Use workoutType field directly
        const workoutType = (workout.workoutType || '').toLowerCase();

        if (workoutType === 'speed' || workoutType === 'sprint') {
            return 'Speed';
        }
        if (workoutType === 'endurance') {
            return 'Endurance';
        }
        if (workoutType === 'strength') {
            return 'Strength';
        }

        // Fallback
        return 'Strength';
    };

    const getWorkoutDistance = (workout) => {
        // Distance is in sets -> reps
        if (!workout.sets || !Array.isArray(workout.sets)) return 0;

        return workout.sets.reduce((sum, set) => {
            if (set.reps && Array.isArray(set.reps)) {
                return sum + set.reps.reduce((repSum, rep) => {
                    return repSum + (parseFloat(rep.distance) / 1000 || 0); // Convert m to km
                }, 0);
            }
            return sum;
        }, 0);
    };

    if (loading) {
        return (
            <div className="bg-background-dark text-white min-h-screen flex items-center justify-center">
                <p className="text-lg">Loading dashboard...</p>
            </div>
        );
    }

    const weeklyVolumes = getWeeklyVolumes();
    const maxVolume = Math.max(...weeklyVolumes, 1);

    return (
        <div className="bg-background-dark text-white min-h-screen pb-24">
            <header className="sticky top-0 z-50 bg-background-dark/80 backdrop-blur-md">
                <div className="flex items-center p-4 justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-700 rounded-full size-10 border-2 border-primary flex items-center justify-center">
                            <span className="text-lg font-bold">
                                {profile?.fullName?.charAt(0)}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-sm font-medium opacity-70">Good Morning,</h2>
                            <p className="text-lg font-bold">{profile?.fullName}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="flex size-10 items-center justify-center rounded-full bg-slate-800">
                            <span className="material-symbols-outlined">notifications</span>
                        </button>
                        <button
                            onClick={() => navigate("/profile")}
                            className="flex size-10 items-center justify-center rounded-full bg-slate-800"
                        >
                            <span className="material-symbols-outlined">settings</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-md mx-auto">
                <section className="p-4 grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2 rounded-xl p-4 bg-slate-800/50 border border-slate-700/50">
                        <div className="flex items-center justify-between">
                            <span className="material-symbols-outlined text-primary">timer</span>
                        </div>
                        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                            Main Event
                        </p>
                        <p className="text-white text-xl font-bold">
                            {profile?.mainEvent || "—"}
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 rounded-xl p-4 bg-slate-800/50 border border-slate-700/50">
                        <div className="flex items-center justify-between">
                            <span className="material-symbols-outlined text-primary">emoji_events</span>
                            <span className="text-emerald-500 text-xs font-bold">PB</span>
                        </div>
                        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                            Personal Best
                        </p>
                        <p className="text-white text-xl font-bold">
                            {profile?.personalBestValue || "—"}
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 rounded-xl p-4 bg-slate-800/50 border border-slate-700/50">
                        <div className="flex items-center justify-between">
                            <span className="material-symbols-outlined text-primary">history</span>
                        </div>
                        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                            Last Workout
                        </p>
                        <p className="text-white text-xl font-bold">
                            {lastWorkout ? getWorkoutCategory(lastWorkout) : "None"}
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 rounded-xl p-4 bg-slate-800/50 border border-slate-700/50">
                        <div className="flex items-center justify-between">
                            <span className="material-symbols-outlined text-primary">local_fire_department</span>
                            <span className="text-emerald-500 text-xs font-bold">🔥</span>
                        </div>
                        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                            Streak
                        </p>
                        <p className="text-white text-xl font-bold">{streak} Days</p>
                    </div>
                </section>

                <section className="px-4 py-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">Performance Analytics</h2>
                        <button
                            onClick={() => navigate("/records")}
                            className="text-primary text-sm font-bold"
                        >
                            View Detailed
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-col gap-4 p-5 rounded-2xl bg-slate-800/30 border border-slate-700/30">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-slate-400 text-sm font-medium">
                                        Latest {profile?.mainEvent} Time
                                    </p>
                                    <p className="text-white text-3xl font-bold">
                                        {lastCompetition?.raceTime || "—"}
                                    </p>
                                </div>
                                {lastCompetition && (
                                    <div className="bg-primary/20 text-primary px-2 py-1 rounded text-xs font-bold">
                                        {lastCompetition.location}
                                    </div>
                                )}
                            </div>

                            {competitions.length > 0 && profile?.mainEvent && (
                                <div className="flex flex-col gap-4">
                                    <div className="h-[120px] relative">
                                        <svg
                                            viewBox="0 0 100 100"
                                            className="w-full h-full"
                                            preserveAspectRatio="none"
                                        >
                                            <defs>
                                                <linearGradient id="comp_gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                    <stop offset="0%" stopColor="#256af4" stopOpacity="0.3" />
                                                    <stop offset="100%" stopColor="#256af4" stopOpacity="0" />
                                                </linearGradient>
                                            </defs>

                                            {(() => {
                                                const data = getChartData();
                                                if (data.length === 0) return null;

                                                const max = Math.max(...data);
                                                const min = Math.min(...data);
                                                const range = max - min || 1;

                                                const points = data.map((val, idx) => ({
                                                    x: (idx / (data.length - 1)) * 100,
                                                    y: 100 - ((val - min) / range) * 80
                                                }));

                                                let smoothPath = `M ${points[0].x},${points[0].y}`;

                                                for (let i = 0; i < points.length - 1; i++) {
                                                    const current = points[i];
                                                    const next = points[i + 1];
                                                    const midX = (current.x + next.x) / 2;
                                                    const midY = (current.y + next.y) / 2;

                                                    smoothPath += ` Q ${current.x},${current.y} ${midX},${midY}`;
                                                    if (i === points.length - 2) {
                                                        smoothPath += ` Q ${next.x},${next.y} ${next.x},${next.y}`;
                                                    }
                                                }

                                                const fillPath = smoothPath + ` L 100,100 L 0,100 Z`;

                                                return (
                                                    <>
                                                        <path d={fillPath} fill="url(#comp_gradient)" />
                                                        <path
                                                            d={smoothPath}
                                                            fill="none"
                                                            stroke="#256af4"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        />
                                                    </>
                                                );
                                            })()}
                                        </svg>
                                    </div>
                                    <div className="flex justify-between px-1">
                                        {competitions
                                            .filter(c => c.distance === profile.mainEvent)
                                            .slice(0, 7)
                                            .reverse()
                                            .map((comp, idx) => (
                                                <p key={idx} className="text-slate-500 text-[11px] font-bold">
                                                    {new Date(comp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </p>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-4 p-5 rounded-2xl bg-slate-800/30 border border-slate-700/30">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-slate-400 text-sm font-medium">
                                        Weekly Training Distance
                                    </p>
                                    <p className="text-white text-3xl font-bold">
                                        {weeklyDistance.toFixed(1)} km
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4 items-end h-[120px] pt-4">
                                {weeklyVolumes.map((volume, idx) => {
                                    const height = (volume / maxVolume) * 100;
                                    const isCurrentWeek = idx === 3;
                                    return (
                                        <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end">
                                            <div
                                                className={`rounded-t-lg w-full ${
                                                    isCurrentWeek
                                                        ? "bg-primary shadow-[0_0_15px_rgba(37,106,244,0.4)]"
                                                        : "bg-primary/40"
                                                }`}
                                                style={{ height: `${Math.max(height, 5)}%` }}
                                            />
                                            <p className={`text-[11px] font-bold uppercase ${
                                                isCurrentWeek ? "text-white" : "text-slate-500"
                                            }`}>
                                                Week {idx + 1}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="p-4">
                    <h2 className="text-xl font-bold mb-4">Recent Workouts</h2>
                    <div className="space-y-3">
                        {workouts.slice(0, 5).map((workout, idx) => {
                            const category = getWorkoutCategory(workout);
                            const distance = getWorkoutDistance(workout);
                            const isRunning = category === 'Speed' || category === 'Endurance';

                            // Get exercise names for strength workouts
                            const exerciseNames = workout.exercises && workout.exercises.length > 0
                                ? workout.exercises.map(ex => ex.exercise).filter(Boolean).join(', ')
                                : '';

                            return (
                                <div
                                    key={workout._id}
                                    className={`flex items-center gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 ${
                                        idx > 2 ? "opacity-70" : ""
                                    }`}
                                >
                                    <div className={`size-12 rounded-lg flex items-center justify-center ${
                                        isRunning ? "bg-emerald-500/10" : "bg-primary/10"
                                    }`}>
                                        <span className={`material-symbols-outlined ${
                                            isRunning ? "text-emerald-500" : "text-primary"
                                        }`}>
                                            {isRunning ? "directions_run" : "fitness_center"}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold">{category}</h4>
                                        <p className="text-slate-400 text-sm">
                                            {new Date(workout.date).toLocaleDateString()}
                                            {exerciseNames && (
                                                <span className="text-slate-500"> • {exerciseNames.substring(0, 30)}{exerciseNames.length > 30 ? '...' : ''}</span>
                                            )}
                                        </p>
                                    </div>
                                    {isRunning && distance > 0 && (
                                        <div className="text-right">
                                            <p className="font-bold">{distance.toFixed(1)} km</p>
                                            <p className="text-slate-500 text-[10px] uppercase font-bold">
                                                Distance
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {workouts.length === 0 && (
                            <div className="text-center py-8 text-slate-500">
                                <p>No workouts logged yet</p>
                                <p className="text-sm mt-2">Start tracking your training!</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Dashboard;