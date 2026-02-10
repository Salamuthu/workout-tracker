import { useEffect, useState } from "react";
import "./LogWorkoutSheet.css"
import API_URL from "../config/api.js";



const GYM_EXERCISES = [
    "Bench Press",
    "Incline Bench Press",
    "Squat",
    "Front Squat",
    "Deadlift",
    "Romanian Deadlift",
    "Shoulder Press",
    "Pull Up",
    "Lat Pulldown",
    "Barbell Row",
    "Dumbbell Row",
    "Bicep Curl",
    "Tricep Extension",
    "Leg Press",
    "Leg Curl",
    "Calf Raise",
];

const LogWorkoutSheet = ({ open, onClose, onSave }) => {
    /* =========================
       🔒 HOOKS — ALWAYS AT TOP
       ========================= */

    const today = new Date().toISOString().split("T")[0];

    // 🔹 NEW: workout type state
    const [showHelp, setShowHelp] = useState(false);

    const [workoutType, setWorkoutType] = useState("Sprint");

    const [sets, setSets] = useState([
        {
            reps: [{ distance: "", time: "" }],
            repRest: "",
            setRest: "",
        },
    ]);

    // 🔹 NEW: strength exercises
    const [strengthExercises, setStrengthExercises] = useState([
        { exercise: "", weight: "", reps: "" },
    ]);

    const [activeSearch, setActiveSearch] = useState(null);

    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "auto";
        return () => (document.body.style.overflow = "auto");
    }, [open]);

    const [date, setDate] = useState(today);
    const [session, setSession] = useState("");
    const [notes, setNotes] = useState("");


    /* =========================
       🔁 ACTIONS
       ========================= */

    const resetForm = () => {
        setDate(new Date().toISOString().split("T")[0]);
        setSession("");
        setWorkoutType("Sprint");
        setNotes("");
        setSets([
            {
                reps: [{ distance: "", time: "" }],
                repRest: "",
                setRest: "",
            },
        ]);
        setStrengthExercises([
            { exercise: "", weight: "", reps: "" },
        ]);
        setActiveSearch(null);
        setShowHelp(false);
    };

    const addRepetition = (setIndex) => {
        setSets(prev => {
            const updated = [...prev];
            updated[setIndex] = {
                ...updated[setIndex],
                reps: [...updated[setIndex].reps, { distance: "", time: "" }]
            };
            return updated;
        });
    };

    const addSet = () => {
        setSets(prev => {
            const lastSet = prev[prev.length - 1];
            return [
                ...prev,
                {
                    reps: lastSet.reps.map(r => ({ distance: r.distance, time: "" })),
                    repRest: lastSet.repRest,
                    setRest: "",
                },
            ];
        });
    };

    // 🔹 NEW
    const addStrengthExercise = () => {
        setStrengthExercises(prev => [
            ...prev,
            { exercise: "", weight: "", reps: "" },
        ]);
    };

    const handleSaveWorkout = async () => {
        const token = localStorage.getItem("token");

        const payload = {
            date: date,
            session,
            workoutType,
            notes,
        };

        if (workoutType === "Strength") {
            payload.exercises = strengthExercises;
        } else {
            payload.sets = sets;
        }

        try {
            const response = await fetch(`${API_URL}/api/workouts`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            resetForm();
            onClose();

            // Call onSave callback with success
            if (onSave) {
                onSave({ success: true, message: "Workout logged successfully!" });
            }
        } catch (err) {
            console.error("Save error:", err);

            // Call onSave callback with error
            if (onSave) {
                onSave({ success: false, message: "Failed to save workout. Please try again." });
            }
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };


    if (!open) return null;

    return (
        <>
            {/* BACKDROP */}
            <div
                onClick={handleClose}
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />

            {/* BOTTOM SHEET */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-background-dark text-white rounded-t-2xl max-h-[95dvh] flex flex-col animate-slideUp">
                {/* HEADER */}
                <header className="flex items-center px-4 py-4 border-b border-slate-800">
                    <button onClick={handleClose} className="text-slate-400">
                        <span className="material-symbols-outlined">close</span>
                    </button>

                    <h1 className="flex-1 text-center text-lg font-bold">
                        Log New Workout
                    </h1>

                    <button
                        onClick={() => setShowHelp(prev => !prev)}
                        className="text-primary text-sm font-semibold relative"
                    >
                        Help
                    </button>
                </header>

                {/* HELP POPOVER */}
                {showHelp && (
                    <div
                        onClick={() => setShowHelp(false)}
                        className="
                            absolute top-16 right-4 z-50
                            bg-[#182234]
                            border border-slate-700
                            rounded-xl
                            px-4 py-3
                            w-[260px]
                            text-sm text-slate-300
                            shadow-xl
                            animate-helpPop
                        "
                    >
                        <p className="font-semibold text-white mb-1">
                            How to log workouts
                        </p>
                        <p>
                            • Sprint/Endurance: add distances, times, reps & sets
                            <br />
                            • Strength: select exercises, weight & reps
                            <br />
                            • Notes help improve future analysis
                        </p>
                    </div>
                )}


                {/* CONTENT */}
                <main className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
                    {/* DATE */}
                    <label className="block">
                        <span className="text-sm font-semibold text-slate-300 ml-1">
                            Date
                        </span>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="mt-1 w-full h-14 rounded-xl border border-slate-800 bg-[#182234] px-4"
                        />
                    </label>

                    {/* SESSION */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-slate-300 ml-1">
                            Session
                        </h3>
                        <div className="flex h-12 rounded-xl bg-[#222f49] p-1.5">
                            {["Morning", "Evening"].map(t => (
                                <label
                                    key={t}
                                    className="flex-1 flex items-center justify-center cursor-pointer rounded-lg text-sm font-medium text-[#90a4cb] has-[:checked]:bg-background-dark has-[:checked]:text-white"
                                >
                                    {t}
                                    <input
                                        type="radio"
                                        name="session"
                                        className="hidden"
                                        checked={session === t}
                                        onChange={() => setSession(t)}
                                    />

                                </label>
                            ))}
                        </div>
                    </div>

                    {/* WORKOUT TYPE */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-slate-300 ml-1">
                            Workout Type
                        </h3>
                        <div className="flex h-12 rounded-xl bg-[#222f49] p-1.5">
                            {["Sprint", "Endurance", "Strength"].map(type => (
                                <label
                                    key={type}
                                    className="flex-1 flex items-center justify-center cursor-pointer rounded-lg text-sm font-medium text-[#90a4cb] has-[:checked]:bg-background-dark has-[:checked]:text-white"
                                >
                                    {type}
                                    <input
                                        type="radio"
                                        name="type"
                                        className="hidden"
                                        checked={workoutType === type}
                                        onChange={() => setWorkoutType(type)}
                                    />
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* =====================
                        SPRINT / ENDURANCE
                       ===================== */}
                    {workoutType !== "Strength" && (
                        <>
                            {sets.map((set, setIndex) => (
                                <div key={setIndex} className="space-y-4">
                                    <h3 className="text-sm font-bold text-primary">
                                        Set {setIndex + 1}
                                    </h3>

                                    {set.reps.map((rep, repIndex) => (
                                        <div key={repIndex} className="grid grid-cols-2 gap-4">
                                            <input
                                                type="number"
                                                placeholder="Distance (m)"
                                                value={rep.distance}
                                                onChange={(e) => {
                                                    setSets(prev => {
                                                        const updated = [...prev];
                                                        updated[setIndex].reps[repIndex].distance = e.target.value;
                                                        return updated;
                                                    });
                                                }}
                                                className="h-14 rounded-xl border border-slate-800 bg-[#182234] px-4"
                                            />
                                            <input
                                                placeholder="Time (00:00:00)"
                                                value={rep.time}
                                                onChange={(e) => {
                                                    setSets(prev => {
                                                        const updated = [...prev];
                                                        updated[setIndex].reps[repIndex].time = e.target.value;
                                                        return updated;
                                                    });
                                                }}
                                                className="h-14 rounded-xl border border-slate-800 bg-[#182234] px-4"
                                            />
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={() => addRepetition(setIndex)}
                                        className="flex items-center gap-2 text-primary text-sm font-semibold"
                                    >
                                        <span className="material-symbols-outlined">add_circle</span>
                                        Add another repetition
                                    </button>

                                    <input
                                        placeholder="Rest between repetitions (e.g. 2 min)"
                                        value={set.repRest}
                                        onChange={(e) => {
                                            setSets(prev => {
                                                const updated = [...prev];
                                                updated[setIndex].repRest = e.target.value;
                                                return updated;
                                            });
                                        }}
                                        className="h-12 w-full rounded-xl border border-slate-800 bg-[#182234] px-4 text-sm"
                                    />

                                    {setIndex > 0 && (
                                        <input
                                            placeholder="Rest between sets (e.g. 5 min)"
                                            value={set.setRest}
                                            onChange={(e) => {
                                                setSets(prev => {
                                                    const updated = [...prev];
                                                    updated[setIndex].setRest = e.target.value;
                                                    return updated;
                                                });
                                            }}
                                            className="h-12 w-full rounded-xl border border-slate-800 bg-[#182234] px-4 text-sm"
                                        />
                                    )}
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={addSet}
                                className="flex items-center gap-2 text-primary text-sm font-semibold"
                            >
                                <span className="material-symbols-outlined">add_circle</span>
                                Add another set
                            </button>
                        </>
                    )}

                    {/* =====================
                        STRENGTH (GYM)
                       ===================== */}
                    {workoutType === "Strength" && (
                        <div className="space-y-6">
                            {strengthExercises.map((ex, i) => (
                                <div key={i} className="space-y-3 relative">
                                    <input
                                        placeholder="Exercise"
                                        value={ex.exercise}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setActiveSearch(i);
                                            setStrengthExercises(prev => {
                                                const updated = [...prev];
                                                updated[i].exercise = value;
                                                return updated;
                                            });
                                        }}
                                        className="h-14 w-full rounded-xl border border-slate-800 bg-[#182234] px-4"
                                    />

                                    {activeSearch === i && ex.exercise && (
                                        <div className="absolute z-50 w-full bg-[#182234] border border-slate-700 rounded-xl max-h-40 overflow-y-auto">
                                            {GYM_EXERCISES.filter(name =>
                                                name.toLowerCase().includes(ex.exercise.toLowerCase())
                                            ).map(name => (
                                                <div
                                                    key={name}
                                                    onClick={() => {
                                                        setStrengthExercises(prev => {
                                                            const updated = [...prev];
                                                            updated[i].exercise = name;
                                                            return updated;
                                                        });
                                                        setActiveSearch(null);
                                                    }}
                                                    className="px-4 py-2 hover:bg-primary/20 cursor-pointer"
                                                >
                                                    {name}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            type="number"
                                            placeholder="Weight (kg)"
                                            value={ex.weight}
                                            onChange={(e) => {
                                                setStrengthExercises(prev => {
                                                    const updated = [...prev];
                                                    updated[i].weight = e.target.value;
                                                    return updated;
                                                });
                                            }}
                                            className="h-14 rounded-xl border border-slate-800 bg-[#182234] px-4"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Reps"
                                            value={ex.reps}
                                            onChange={(e) => {
                                                setStrengthExercises(prev => {
                                                    const updated = [...prev];
                                                    updated[i].reps = e.target.value;
                                                    return updated;
                                                });
                                            }}
                                            className="h-14 rounded-xl border border-slate-800 bg-[#182234] px-4"
                                        />
                                    </div>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={addStrengthExercise}
                                className="flex items-center gap-2 text-primary text-sm font-semibold"
                            >
                                <span className="material-symbols-outlined">add_circle</span>
                                Add another exercise
                            </button>
                        </div>
                    )}

                    {/* NOTES */}
                    <label className="block">
                        <span className="text-sm font-semibold text-slate-300 ml-1">
                            Notes
                        </span>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="mt-1 w-full min-h-[120px] rounded-xl border border-slate-800 bg-[#182234] p-4 resize-none"
                            placeholder="How did it feel? (RPE, soreness, fatigue, etc.)"
                        />
                    </label>
                </main>

                {/* SAVE */}
                <footer className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleSaveWorkout}
                        className="w-full bg-primary py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2"
                    >

                        <span className="material-symbols-outlined">save</span>
                        Save Workout
                    </button>
                    <div className="h-6" />
                </footer>
            </div>
        </>
    );
};



export default LogWorkoutSheet;