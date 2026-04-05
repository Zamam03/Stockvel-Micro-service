import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [role, setRole] = useState('member');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { register } = useAuth();

    async function handleRegister(e) {
        e.preventDefault();
        setError('');
        
        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);

        try {
            // Capitalize role for backend (Member, Treasurer, Admin)
            const capitalizedRole = role.charAt(0).toUpperCase() + role.slice(1);
            await register(email, password, displayName, capitalizedRole);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>Stockvel Pro</h1>
                    <p>Community Financial Management</p>
                </div>
                
                <h2>Create Your Account</h2>
                
                {error && (
                    <div className="error-message">
                        <strong>Error:</strong> {error}
                    </div>
                )}
                
                <form onSubmit={handleRegister}>
                    <div className="form-group">
                        <label htmlFor="displayName">Full Name</label>
                        <input
                            id="displayName"
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="John Doe"
                            required
                            disabled={loading}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            disabled={loading}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            required
                            disabled={loading}
                            minLength="6"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="role">Account Role</label>
                        <select
                            id="role"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            disabled={loading}
                        >
                            <option value="member">Member</option>
                            <option value="treasurer">Treasurer</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="btn-primary"
                    >
                        {loading ? 'Creating Account...' : 'Register'}
                    </button>
                </form>
                
                <div className="auth-footer">
                    <p>
                        Already have an account? <Link to="/login">Login here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
