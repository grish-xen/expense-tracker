import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import PurchasesPage from './pages/PurchasesPage';
import StatsPage from './pages/StatsPage';
import ImportExportPage from './pages/ImportExportPage';

// Защищённый маршрут
const PrivateRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="App">
                    <Navbar />
                    <Routes>
                        {/* Публичные маршруты */}
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />

                        {/* Защищённые маршруты */}
                        <Route path="/" element={
                            <PrivateRoute>
                                <HomePage />
                            </PrivateRoute>
                        } />

                        <Route path="/purchases" element={
                            <PrivateRoute>
                                <PurchasesPage />
                            </PrivateRoute>
                        } />

                        <Route path="/stats" element={
                            <PrivateRoute>
                                <StatsPage />
                            </PrivateRoute>
                        } />

                        <Route path="/import-export" element={
                            <PrivateRoute>
                                <ImportExportPage />
                            </PrivateRoute>
                        } />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;