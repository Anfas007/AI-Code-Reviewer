
import { createContext, useState } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => {
        return localStorage.getItem('token');
    });

    // --------------------------------------------------
    // Login
    // --------------------------------------------------

    const login = (newToken) => {
        if (!newToken) {
            console.error('Login failed: No token received.');
            return;
        }

        localStorage.setItem('token', newToken);
        setToken(newToken);
    };

    // --------------------------------------------------
    // Logout
    // --------------------------------------------------

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
    };

    // --------------------------------------------------
    // Authentication state
    // --------------------------------------------------

    const isAuthenticated = Boolean(token);

    return (
        <AuthContext.Provider
            value={{
                token,
                login,
                logout,
                isAuthenticated
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
