import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./ProfileSetup.css";
import API_URL from "../config/api.js";

const ProfileSetup = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        fullName: "",
        mainEvent: "",
        otherEvents: "",
        personalBestValue: "",
        height: "",
        weight: "",
        trainingDays: "",
    });

    const [bmi, setBmi] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Load existing profile data
    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/login");
                return;
            }

            try {
                const res = await axios.get(
                    `${API_URL}/api/profile/me`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const profile = res.data;

                // Pre-fill form with existing data
                setForm({
                    fullName: profile.fullName || "",
                    mainEvent: profile.mainEvent || "",
                    otherEvents: profile.otherEvents?.join(", ") || "",
                    personalBestValue: profile.personalBestValue || "",
                    height: profile.heightCm || "",
                    weight: profile.weightKg || "",
                    trainingDays: profile.trainingDaysPerWeek || "",
                });

                // Calculate BMI if height and weight exist
                if (profile.heightCm && profile.weightKg) {
                    setBmi(calculateBMI(profile.heightCm, profile.weightKg));
                }

                setIsEditing(true);
            } catch (err) {
                console.log("No existing profile, creating new one");
                setIsEditing(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    // 🧮 BMI calculation
    const calculateBMI = (h, w) => {
        if (!h || !w) return null;
        const hm = h / 100;
        return Number((w / (hm * hm)).toFixed(1));
    };

    // 🎨 BMI color class
    const getBmiClass = (bmi) => {
        if (bmi < 18.5) return "bmi-yellow";
        if (bmi < 25) return "bmi-green";
        if (bmi < 30) return "bmi-yellow";
        return "bmi-red";
    };

    // 🧠 Normalize event (add 'm' if missing)
    const normalizeEvent = (value) => {
        if (!value) return value;
        const v = value.trim();
        return /\d$/.test(v) ? `${v}m` : v;
    };

    // 🧠 Normalize PB value (add 's' if missing)
    const normalizePB = (value) => {
        if (!value) return value;
        const v = value.trim();
        return /\d$/.test(v) ? `${v}s` : v;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const updated = { ...form, [name]: value };
        setForm(updated);

        if (name === "height" || name === "weight") {
            setBmi(calculateBMI(updated.height, updated.weight));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            const mainEvent = normalizeEvent(form.mainEvent);

            const otherEvents = form.otherEvents
                .split(",")
                .map(e => normalizeEvent(e))
                .filter(Boolean);

            const personalBestValue = normalizePB(form.personalBestValue);

            await axios.post(
                `${API_URL}/api/profile`,
                {
                    fullName: form.fullName,
                    mainEvent,
                    otherEvents,
                    personalBestValue,
                    heightCm: Number(form.height),
                    weightKg: Number(form.weight),
                    trainingDaysPerWeek: Number(form.trainingDays),
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            navigate("/dashboard");
        } catch (err) {
            setError("Failed to save profile");
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        navigate("/profile");
    };

    return (
        <div className="profile-container">
            <form className="profile-form" onSubmit={handleSubmit}>
                {/* Back Button */}
                {isEditing && (
                    <button
                        type="button"
                        onClick={handleBack}
                        className="back-button"
                        style={{
                            position: 'absolute',
                            top: '20px',
                            left: '20px',
                            background: 'rgba(37, 106, 244, 0.1)',
                            border: '1px solid rgba(37, 106, 244, 0.3)',
                            color: '#256af4',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '20px'
                        }}
                    >
                        ←
                    </button>
                )}

                <h1>{isEditing ? "Edit Your Profile" : "Set Up Your Profile"}</h1>
                <p className="subtitle">Help us personalize your training</p>

                <input
                    name="fullName"
                    placeholder="Full Name"
                    value={form.fullName}
                    required
                    onChange={handleChange}
                />

                <input
                    name="mainEvent"
                    placeholder="Main Event (e.g. 100m)"
                    value={form.mainEvent}
                    required
                    onChange={handleChange}
                />

                <input
                    name="otherEvents"
                    placeholder="Other Events (comma separated)"
                    value={form.otherEvents}
                    onChange={handleChange}
                />

                <input
                    name="personalBestValue"
                    placeholder="Personal Best (e.g. 10.45s)"
                    value={form.personalBestValue}
                    onChange={handleChange}
                />

                <div className="row">
                    <input
                        type="number"
                        name="height"
                        placeholder="Height (cm)"
                        value={form.height}
                        required
                        onChange={handleChange}
                    />
                    <input
                        type="number"
                        name="weight"
                        placeholder="Weight (kg)"
                        value={form.weight}
                        required
                        onChange={handleChange}
                    />
                </div>

                {bmi && (
                    <div className={`bmi-box ${getBmiClass(bmi)}`}>
                        <span>BMI</span>
                        <strong>{bmi}</strong>
                    </div>
                )}

                <input
                    type="number"
                    name="trainingDays"
                    placeholder="Training Days per Week"
                    value={form.trainingDays}
                    required
                    onChange={handleChange}
                />

                {error && <p className="error-message">{error}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? "Saving..." : isEditing ? "Update Profile" : "Complete Setup"}
                </button>
            </form>
        </div>
    );
};

export default ProfileSetup;