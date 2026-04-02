import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [primeRate, setPrimeRate] = useState(null);

  // Mock fetching rate for aesthetic purposes
  useEffect(() => {
    setTimeout(() => {
      setPrimeRate(11.75); // Mock SA Rate
    }, 1000);
  }, []);

  return (
    <div className="app-container">
      <header className="header animate-slide-up">
        <div className="logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#paint0_linear)"/>
            <path d="M2 17L12 22L22 17" stroke="url(#paint1_linear)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="url(#paint2_linear)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <defs>
              <linearGradient id="paint0_linear" x1="2" y1="7" x2="22" y2="7" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366F1"/>
                <stop offset="1" stopColor="#14B8A6"/>
              </linearGradient>
              <linearGradient id="paint1_linear" x1="2" y1="19.5" x2="22" y2="19.5" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366F1"/>
                <stop offset="1" stopColor="#14B8A6"/>
              </linearGradient>
              <linearGradient id="paint2_linear" x1="2" y1="14.5" x2="22" y2="14.5" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366F1"/>
                <stop offset="1" stopColor="#14B8A6"/>
              </linearGradient>
            </defs>
          </svg>
          Stokvel Pro
        </div>
        <nav className="nav-links">
          <a href="#" className="nav-link">Dashboard</a>
          <a href="#" className="nav-link">My Groups</a>
          <a href="#" className="nav-link">Analytics</a>
        </nav>
      </header>

      <main>
        <section className="hero animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h1 className="hero-title">Empower Your Savings Community</h1>
          <p className="hero-subtitle">
            Modernize your rotating savings. Track contributions, schedule payouts, 
            and keep your Stokvel transparent and thriving.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary">Create Stokvel</button>
            <button className="btn btn-secondary">Join Existing</button>
          </div>
        </section>

        <section className="dashboard-grid">
          <div className="glass-panel stat-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="stat-title">Total Group Savings</div>
            <div className="stat-value">R 125,400</div>
            <div className="stat-change">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
              +12.5% this month
            </div>
          </div>

          <div className="glass-panel stat-card animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="stat-title">Your Next Payout</div>
            <div className="stat-value">R 15,000</div>
            <div className="stat-change" style={{ color: "var(--text-muted)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              Expected on 15 Nov
            </div>
          </div>

          <div className="glass-panel stat-card animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="stat-title">SA Prime Lending Rate</div>
            <div className="stat-value">{primeRate ? `${primeRate}%` : '...'}</div>
            <div className="stat-change" style={{ color: "var(--text-muted)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              Live SARB Data feed
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
