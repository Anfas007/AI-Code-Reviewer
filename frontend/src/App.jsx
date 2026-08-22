
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ReviewHistory from './pages/ReviewHistory';
import ReviewDetails from './pages/ReviewDetails';

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>

                <Routes>

                    {/* =========================================
                        Public Routes
                    ========================================= */}

                    <Route
                        path="/login"
                        element={<Login />}
                    />

                    <Route
                        path="/register"
                        element={<Register />}
                    />


                    {/* =========================================
                        Protected Routes
                    ========================================= */}

                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/history"
                        element={
                            <ProtectedRoute>
                                <ReviewHistory />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/history/:id"
                        element={
                            <ProtectedRoute>
                                <ReviewDetails />
                            </ProtectedRoute>
                        }
                    />


                    {/* =========================================
                        Default Route
                    ========================================= */}

                    <Route
                        path="/"
                        element={
                            <Navigate
                                to="/dashboard"
                                replace
                            />
                        }
                    />


                    {/* =========================================
                        Unknown Route
                    ========================================= */}

                    <Route
                        path="*"
                        element={
                            <Navigate
                                to="/dashboard"
                                replace
                            />
                        }
                    />

                </Routes>

            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
