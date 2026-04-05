import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '../services/api';

/* eslint-disable react-refresh/only-export-components */

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initialize auth state from localStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                setCurrentUser(user);
                setUserRole(user.role || 'member');
            } catch (e) {
                console.error('Failed to parse stored user:', e);
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const register = async (email, password, displayName, role = 'Member') => {
        setError(null);
        try {
            const response = await authAPI.register(email, password, displayName, role);
            
            // Normalize the response: idToken -> token, localId -> uid
            const normalizedUser = {
                uid: response.localId || response.uid || response.user?.uid,
                email: response.email || email,
                displayName: response.user?.displayName || displayName,
                token: response.idToken || response.token,
                role: response.user?.role || response.role || role,
            };

            localStorage.setItem('user', JSON.stringify(normalizedUser));
            setCurrentUser(normalizedUser);
            setUserRole(normalizedUser.role);
            
            return normalizedUser;
        } catch (err) {
            const errorMsg = err.message || 'Registration failed';
            setError(errorMsg);
            throw err;
        }
    };

    const login = async (email, password) => {
        setError(null);
        try {
            const response = await authAPI.login(email, password);
            
            // Normalize the response: idToken -> token, localId -> uid
            const normalizedUser = {
                uid: response.localId || response.uid,
                email: response.email,
                displayName: response.displayName || email.split('@')[0],
                token: response.idToken || response.token,
                role: response.role || 'member',
            };

            localStorage.setItem('user', JSON.stringify(normalizedUser));
            setCurrentUser(normalizedUser);
            setUserRole(normalizedUser.role);
            
            return normalizedUser;
        } catch (err) {
            const errorMsg = err.message || 'Login failed';
            setError(errorMsg);
            throw err;
        }
    };

    const updateUserProfile = async (updates) => {
        setError(null);
        try {
            if (!currentUser?.uid) {
                throw new Error('No user logged in');
            }

            const response = await authAPI.updateUserProfile(currentUser.uid, updates);
            
            const updatedUser = {
                ...currentUser,
                ...updates,
                displayName: updates.displayName || currentUser.displayName,
            };

            localStorage.setItem('user', JSON.stringify(updatedUser));
            setCurrentUser(updatedUser);
            
            return updatedUser;
        } catch (err) {
            const errorMsg = err.message || 'Profile update failed';
            setError(errorMsg);
            throw err;
        }
    };

    const logout = async () => {
        setError(null);
        try {
            localStorage.removeItem('user');
            setCurrentUser(null);
            setUserRole(null);
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    const value = {
        currentUser,
        userRole,
        login,
        register,
        updateUserProfile,
        logout,
        loading,
        error,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
