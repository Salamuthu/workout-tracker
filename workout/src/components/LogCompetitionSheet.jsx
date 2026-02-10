import { useState, useRef } from "react";
import axios from "axios";
import API_URL from "../config/api.js";

const LogCompetitionSheet = ({ isOpen, onClose, onSave }) => {
    const [raceTime, setRaceTime] = useState("00:00:00");
    const [competitionName, setCompetitionName] = useState("");
    const [date, setDate] = useState("");
    const [location, setLocation] = useState("");
    const [distance, setDistance] = useState("100m");
    const [roundType, setRoundType] = useState("Final");
    const [wind, setWind] = useState("");
    const [position, setPosition] = useState("");
    const [lane, setLane] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const inputRef = useRef(null);

    const distances = {
        Sprints: ["60m", "100m", "200m", "400m"],
        "Middle Distance": ["600m", "800m", "1000m", "1500m"],
        "Long Distance": ["3000m", "5000m", "10000m"]
    };

    const handleTimeChange = (e) => {
        const value = e.target.value;
        const digitsOnly = value.replace(/[^0-9]/g, '');
        const padded = digitsOnly.padStart(6, '0').slice(0, 6);
        // Format as mm:ss:ms (with colons)
        const formatted = `${padded[0]}${padded[1]}:${padded[2]}${padded[3]}:${padded[4]}${padded[5]}`;
        setRaceTime(formatted);
    };

    const handleTimeKeyDown = (e) => {
        if (e.key === 'Backspace') {
            e.preventDefault();
            const digitsOnly = raceTime.replace(/[^0-9]/g, '');
            const newDigits = ('0' + digitsOnly.slice(0, -1)).slice(-6);
            const formatted = `${newDigits[0]}${newDigits[1]}:${newDigits[2]}${newDigits[3]}:${newDigits[4]}${newDigits[5]}`;
            setRaceTime(formatted);
            return;
        }

        if (/^[0-9]$/.test(e.key)) {
            e.preventDefault();
            const digitsOnly = raceTime.replace(/[^0-9]/g, '');
            const newDigits = (digitsOnly + e.key).slice(-6);
            const formatted = `${newDigits[0]}${newDigits[1]}:${newDigits[2]}${newDigits[3]}:${newDigits[4]}${newDigits[5]}`;
            setRaceTime(formatted);
        }
    };

    const handleSave = async () => {
        // Frontend validation
        const missingFields = [];

        if (!raceTime || raceTime === "00:00:00") {
            missingFields.push("Race Time");
        }
        if (!date) {
            missingFields.push("Date");
        }
        if (!location || location.trim() === "") {
            missingFields.push("Location");
        }

        if (missingFields.length > 0) {
            if (onSave) {
                onSave({
                    success: false,
                    message: `Please fill in: ${missingFields.join(", ")}`
                });
            }
            return;
        }

        setIsSaving(true);

        try {
            const token = localStorage.getItem("token");

            if (!token) {
                if (onSave) {
                    onSave({
                        success: false,
                        message: "Please log in to save competition results"
                    });
                }
                return;
            }

            const competitionData = {
                raceTime,
                competitionName,
                date,
                location,
                distance,
                roundType,
                wind,
                position,
                lane
            };

            const response = await axios.post(
                `${API_URL}/api/competitions`,
                competitionData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            console.log("Competition saved:", response.data);

            // Success
            if (onSave) {
                onSave({
                    success: true,
                    message: response.data.message || "Competition result saved successfully!"
                });
            }

            // Reset form
            setRaceTime("00:00:00");
            setCompetitionName("");
            setDate("");
            setLocation("");
            setDistance("100m");
            setRoundType("Final");
            setWind("");
            setPosition("");
            setLane("");

            onClose();
        } catch (error) {
            console.error("Error saving competition:", error);

            const errorMessage = error.response?.data?.message || "Failed to save competition result";

            if (onSave) {
                onSave({
                    success: false,
                    message: errorMessage
                });
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                onClick={onClose}
            />

            {/* Sheet */}
            <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center">
                <div className="w-full max-w-[480px] h-[90vh] bg-background-dark rounded-t-3xl shadow-2xl overflow-hidden flex flex-col animate-slide-up">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-800 sticky top-0 bg-background-dark z-10">
                        <button
                            onClick={onClose}
                            className="flex size-10 items-center justify-center rounded-full hover:bg-slate-800"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                        <h2 className="text-lg font-bold flex-1 text-center pr-10">
                            Log Competition
                        </h2>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto">
                        {/* Race Time Input */}
                        <div className="flex flex-col items-center justify-center pt-8 pb-6 px-4">
                            <div className="text-primary text-xs font-bold uppercase tracking-widest mb-1">
                                Race Time (mm:ss:ms) *
                            </div>
                            <input
                                ref={inputRef}
                                type="text"
                                value={raceTime}
                                onChange={handleTimeChange}
                                onKeyDown={handleTimeKeyDown}
                                className="bg-transparent border-none text-center text-white tracking-tight text-[56px] font-bold leading-none py-2 font-mono w-full focus:ring-0 focus:outline-none"
                            />
                        </div>

                        <div className="flex flex-col gap-6 px-4 pb-32">
                            {/* General Information */}
                            <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50">
                                <h3 className="text-white text-base font-bold mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">info</span>
                                    General Information
                                </h3>
                                <div className="space-y-4">
                                    <label className="flex flex-col">
                                        <p className="text-slate-400 text-xs font-medium pb-1.5 uppercase tracking-wider">
                                            Competition Name
                                        </p>
                                        <input
                                            type="text"
                                            value={competitionName}
                                            onChange={(e) => setCompetitionName(e.target.value)}
                                            placeholder="e.g. Diamond League"
                                            className="flex w-full rounded-lg text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary border border-slate-700 bg-slate-900/50 h-12 px-4 text-base"
                                        />
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <label className="flex flex-col">
                                            <p className="text-slate-400 text-xs font-medium pb-1.5 uppercase tracking-wider">
                                                Date *
                                            </p>
                                            <input
                                                type="date"
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                                className="flex w-full rounded-lg text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary border border-slate-700 bg-slate-900/50 h-12 px-4 text-base"
                                            />
                                        </label>
                                        <label className="flex flex-col">
                                            <p className="text-slate-400 text-xs font-medium pb-1.5 uppercase tracking-wider">
                                                Location *
                                            </p>
                                            <input
                                                type="text"
                                                value={location}
                                                onChange={(e) => setLocation(e.target.value)}
                                                placeholder="City"
                                                className="flex w-full rounded-lg text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary border border-slate-700 bg-slate-900/50 h-12 px-4 text-base"
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Event Details */}
                            <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50">
                                <h3 className="text-white text-base font-bold mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">speed</span>
                                    Event Details
                                </h3>
                                <div className="space-y-6">
                                    {/* Distance Selection */}
                                    <div>
                                        <p className="text-slate-400 text-xs font-medium pb-2 uppercase tracking-wider">
                                            Distance Selection
                                        </p>
                                        <div className="flex flex-col gap-4">
                                            {Object.entries(distances).map(([category, dists]) => (
                                                <div key={category}>
                                                    <span className="text-[10px] text-slate-500 uppercase font-bold mb-2 block">
                                                        {category}
                                                    </span>
                                                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                                        {dists.map((dist) => (
                                                            <button
                                                                key={dist}
                                                                onClick={() => setDistance(dist)}
                                                                className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                                                                    distance === dist
                                                                        ? "bg-primary text-white border-primary"
                                                                        : "bg-slate-900/50 border-slate-700 text-slate-300"
                                                                }`}
                                                            >
                                                                {dist}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Round Type */}
                                    <div>
                                        <p className="text-slate-400 text-xs font-medium pb-1.5 uppercase tracking-wider">
                                            Round Type
                                        </p>
                                        <div className="flex p-1 bg-slate-900/50 rounded-lg border border-slate-700">
                                            {["Heats", "Semis", "Final"].map((round) => (
                                                <button
                                                    key={round}
                                                    onClick={() => setRoundType(round)}
                                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                                                        roundType === round
                                                            ? "bg-primary text-white shadow"
                                                            : "text-slate-400"
                                                    }`}
                                                >
                                                    {round}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Technical Data */}
                            <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50">
                                <h3 className="text-white text-base font-bold mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">analytics</span>
                                    Technical Data
                                </h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <label className="flex flex-col">
                                        <p className="text-slate-400 text-[10px] font-medium pb-1.5 uppercase tracking-wider text-center">
                                            Wind (m/s)
                                        </p>
                                        <input
                                            type="text"
                                            value={wind}
                                            onChange={(e) => setWind(e.target.value)}
                                            placeholder="+0.0"
                                            className="flex w-full rounded-lg text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary border border-slate-700 bg-slate-900/50 h-12 px-3 text-center text-base"
                                        />
                                    </label>
                                    <label className="flex flex-col">
                                        <p className="text-slate-400 text-[10px] font-medium pb-1.5 uppercase tracking-wider text-center">
                                            Position
                                        </p>
                                        <input
                                            type="text"
                                            value={position}
                                            onChange={(e) => setPosition(e.target.value)}
                                            placeholder="1st"
                                            className="flex w-full rounded-lg text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary border border-slate-700 bg-slate-900/50 h-12 px-3 text-center text-base"
                                        />
                                    </label>
                                    <label className="flex flex-col">
                                        <p className="text-slate-400 text-[10px] font-medium pb-1.5 uppercase tracking-wider text-center">
                                            Lane
                                        </p>
                                        <input
                                            type="text"
                                            value={lane}
                                            onChange={(e) => setLane(e.target.value)}
                                            placeholder="4"
                                            className="flex w-full rounded-lg text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary border border-slate-700 bg-slate-900/50 h-12 px-3 text-center text-base"
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Save Button - Fixed at Bottom */}
                    <div className="p-4 bg-background-dark/80 backdrop-blur-lg border-t border-slate-800">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined">
                                {isSaving ? "hourglass_empty" : "save"}
                            </span>
                            {isSaving ? "Saving..." : "Save Competition Result"}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LogCompetitionSheet;