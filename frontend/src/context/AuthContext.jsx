import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signOut 
} from 'firebase/auth';
import { auth } from '../firebase/config';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                // Fetch custom claims to know if they are Member, Treasurer or Admin
                const idTokenResult = await user.getIdTokenResult();
                setUserRole(idTokenResult.claims.role || 'Member');
            } else {
                setUserRole(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    /**
     * Instead of raw createUserWithEmailAndPassword, we should actually 
     * call our backend endpoint `/api/auth/register` to safely assign claims in the backend
     */
    const registerViaBackend = async (email, password, displayName, role) => {
        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, displayName, role })
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to register');
        }
        
        // After backend creates user, we explicitly log them in on the client
        return login(email, password);
    };

    const logout = () => {
        return signOut(auth);
    };

    const value = {
        currentUser,
        userRole,
        login,
        registerViaBackend,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
