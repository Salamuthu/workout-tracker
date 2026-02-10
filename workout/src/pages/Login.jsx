import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";
import API_URL from "../config/api.js";

const Login = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // 🔐 If token already exists, go to dashboard
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            navigate("/dashboard");
        }
    }, [navigate]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);

            const res = await axios.post(`${API_URL}/api/login`, {
                email: form.email,
                password: form.password,
            });

            // ✅ Save JWT
            localStorage.setItem("token", res.data.token);

            // ✅ Redirect to dashboard
            navigate("/dashboard");
        } catch (err) {
            setError(
                err.response?.data?.message || "Invalid email or password"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleSubmit}>
                <h1>Welcome Back</h1>
                <p className="subtitle">Log in to track your performance</p>

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

                {error && <p className="error-message">{error}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                </button>

                <div className="signup-link"> <span>Don’t have an account?</span> <a href="/signup">Sign Up</a> </div>
            </form>
        </div>
    );
};

export default Login;
