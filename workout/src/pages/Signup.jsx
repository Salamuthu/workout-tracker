import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Signup.css";
import API_URL from "../config/api.js";

const Signup = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            setLoading(true);

            // ✅ Signup request
            const res = await axios.post(`${API_URL}/api/signup`, {
                username: form.username,
                email: form.email,
                password: form.password,
            });

            // ✅ Save JWT returned by backend
            localStorage.setItem("token", res.data.token);

            // ✅ Redirect to profile setup
            navigate("/setup-profile");
        } catch (err) {
            setError(
                err.response?.data?.message || "Signup failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="signup-container">
            <form className="signup-form" onSubmit={handleSubmit}>
                <h1>Create Account</h1>
                <p className="subtitle">
                    Track workouts. Improve performance.
                </p>

                <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={form.username}
                    onChange={handleChange}
                    required
                />

                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    required
                />

                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                    required
                />

                <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                />

                {error && <p className="error-message">{error}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? "Creating account..." : "Sign Up"}
                </button>

                <div className="login-link">
                    <span>Already have an account?</span>
                    <a href="/login">Login</a>
                </div>
            </form>
        </div>
    );
};

export default Signup;
