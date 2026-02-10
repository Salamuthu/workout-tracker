import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ProfileSetup from './pages/ProfileSetup';
import Records from './pages/Records';
import MainLayout from './components/MainLayout';

function App() {
    return (
        <Router>
            <Routes>
                {/* Landing page at root */}
                <Route path="/" element={<Landing />} />

                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/setup-profile" element={<ProfileSetup />} />

                {/* Protected routes with MainLayout */}
                <Route element={<MainLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/records" element={<Records />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;