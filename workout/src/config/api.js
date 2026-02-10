// src/config/api.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
    // Auth
    SIGNUP: `${API_URL}/api/signup`,
    LOGIN: `${API_URL}/api/login`,

    // Profile
    PROFILE: `${API_URL}/api/profile`,
    PROFILE_ME: `${API_URL}/api/profile/me`,

    // Workouts
    WORKOUTS: `${API_URL}/api/workouts`,

    // Competitions
    COMPETITIONS: `${API_URL}/api/competitions`,
};

export default API_URL;