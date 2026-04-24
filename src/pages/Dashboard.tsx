import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { initializeSupabase, getSupabaseClient } from '../lib/database';
import './Dashboard.css';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  time: string;
  period: 'Morning' | 'Noon' | 'Evening';
}

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDayView, setShowDayView] = useState(false);
  const [showAddMedication, setShowAddMedication] = useState(false);
  const [activeTab, setActiveTab] = useState('main');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    time: '',
    period: 'Morning' as const,
  });

  // Get display name safely
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  // Initialize Supabase on component mount
  useEffect(() => {
    const initSupabase = async () => {
      try {
        initializeSupabase();
        const client = getSupabaseClient();
        if (client) {
          setSupabaseConnected(true);
          setConnectionError(null);
          console.log('✓ Connected to Supabase');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to connect to Supabase';
        setConnectionError(message);
        setSupabaseConnected(false);
        console.error('Supabase connection error:', message);
      }
    };

    initSupabase();
  }, []);

  // Debug user object
  useEffect(() => {
    console.log('👤 User object:', user);
    console.log('📝 User metadata:', user?.user_metadata);
  }, [user]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleAddMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.dosage && formData.time) {
      setMedications([
        ...medications,
        {
          id: Date.now().toString(),
          ...formData,
        },
      ]);
      setFormData({ name: '', dosage: '', time: '', period: 'Morning' });
      setShowAddMedication(false);
    }
  };

  const handleDeleteMedication = (id: string) => {
    setMedications(medications.filter(med => med.id !== id));
  };

  const handleMonthSelect = (monthIndex: number) => {
    setSelectedDate(new Date(selectedDate.getFullYear(), monthIndex, 1));
    setShowMonthDropdown(false);
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const medicationsByPeriod = {
    Morning: medications.filter(m => m.period === 'Morning'),
    Noon: medications.filter(m => m.period === 'Noon'),
    Evening: medications.filter(m => m.period === 'Evening'),
  };

  const daysInMonth = getDaysInMonth(selectedDate);
  const firstDay = getFirstDayOfMonth(selectedDate);
  const days = [];
  
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="user-info">
          <div className="user-avatar">{avatarLetter}</div>
          <span className="user-name">{displayName}</span>
        </div>
        <div className="month-selector" style={{ position: 'relative', cursor: 'pointer' }}>
          <div onClick={() => setShowMonthDropdown(!showMonthDropdown)}>
            {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
          {showMonthDropdown && (
            <div className="month-dropdown">
              {months.map((month, index) => (
                <div
                  key={month}
                  className={`month-option ${index === selectedDate.getMonth() ? 'active' : ''}`}
                  onClick={() => handleMonthSelect(index)}
                >
                  {month}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              padding: '4px 8px',
              borderRadius: '6px',
              backgroundColor: supabaseConnected ? '#e8f5e9' : '#ffebee',
              color: supabaseConnected ? '#2e7d32' : '#c62828',
            }}
          >
          </div>
          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {connectionError && (
          <div
            style={{
              background: '#ffebee',
              border: '1px solid #f48fb1',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              color: '#c62828',
              fontSize: '14px',
            }}
          >
            <strong>Supabase Connection Error:</strong> {connectionError}
          </div>
        )}
        {activeTab === 'main' && !showDayView && (
          <>
            {/* Calendar */}
            <div className="calendar-section">
              <div className="calendar-grid">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                  <div key={day} className="calendar-header">
                    {day}
                  </div>
                ))}
                {days.map((day, idx) => (
                  <div
                    key={`day-${idx}`}
                    className={`calendar-day ${
                      day === selectedDate.getDate() ? 'active' : ''
                    } ${day === null ? 'empty' : ''}`}
                    onClick={() => {
                      if (day) {
                        setSelectedDate(
                          new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day)
                        );
                        setShowDayView(true);
                      }
                    }}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>

            {/* Mood Check */}
            <div className="mood-section">
              <span className="mood-icon">🌤️</span>
              How do you feel today?
              <span className="arrow">→</span>
            </div>

            {/* Medications by Period */}
            <div className="medications-container">
              {(['Morning', 'Noon', 'Evening'] as const).map(period => (
                <div key={period} className="period-section">
                  <div className="period-header">
                    <span className="period-icon">
                      {period === 'Morning' && '🌅'}
                      {period === 'Noon' && '☀️'}
                      {period === 'Evening' && '🌙'}
                    </span>
                    {period}
                  </div>
                  <div className="medications-list">
                    {medicationsByPeriod[period].length > 0 ? (
                      medicationsByPeriod[period].map(med => (
                        <div key={med.id} className="medication-item">
                          <div className="med-avatar">💊</div>
                          <div className="med-info">
                            <div className="med-name">{med.name}</div>
                            <div className="med-dosage">{med.dosage}</div>
                          </div>
                          <div className="med-time">{med.time}</div>
                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteMedication(med.id)}
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="no-meds">No medications</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Medication Button */}
            {!showAddMedication && (
              <button
                className="add-medication-btn"
                onClick={() => setShowAddMedication(true)}
              >
                Add new medication
              </button>
            )}

            {/* Add Medication Form */}
            {showAddMedication && (
              <div className="add-med-modal">
                <div className="modal-content">
                  <div className="modal-header">
                    <h2>Add New Medication</h2>
                    <button
                      className="close-btn"
                      onClick={() => setShowAddMedication(false)}
                    >
                      ✕
                    </button>
                  </div>
                  <form onSubmit={handleAddMedication}>
                    <div className="form-group">
                      <label>Medication Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="e.g., Aspirin"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Dosage</label>
                      <input
                        type="text"
                        value={formData.dosage}
                        onChange={(e) =>
                          setFormData({ ...formData, dosage: e.target.value })
                        }
                        placeholder="e.g., 1 tablet"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Time</label>
                      <input
                        type="time"
                        value={formData.time}
                        onChange={(e) =>
                          setFormData({ ...formData, time: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Period</label>
                      <select
                        value={formData.period}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            period: e.target.value as typeof formData.period,
                          })
                        }
                      >
                        <option>Morning</option>
                        <option>Noon</option>
                        <option>Evening</option>
                      </select>
                    </div>
                    <button type="submit" className="submit-btn">
                      Add Medication
                    </button>
                  </form>
                </div>
              </div>
            )}
          </>
        )}

        {/* Day View */}
        {activeTab === 'main' && showDayView && (
          <div className="day-view">
            <button className="back-btn" onClick={() => setShowDayView(false)}>
              ← Back
            </button>
            
            <div className="day-header">
              <div className="selected-date">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  day: 'numeric' 
                })}
              </div>
            </div>

            <div className="day-content">
              <div className="star-placeholder">⭐</div>
              {medications.length === 0 ? (
                <>
                  <h2 className="no-meds-title">No added medications</h2>
                  <p className="no-meds-subtitle">Here will be your medication schedule for the day</p>
                </>
              ) : (
                <>
                  <h2 className="day-title">Your medications today</h2>
                  <div className="day-medications">
                    {(['Morning', 'Noon', 'Evening'] as const).map(period => {
                      const periodMeds = medicationsByPeriod[period];
                      if (periodMeds.length === 0) return null;
                      return (
                        <div key={period} className="day-period">
                          <div className="day-period-header">
                            <span className="period-icon">
                              {period === 'Morning' && '🌅'}
                              {period === 'Noon' && '☀️'}
                              {period === 'Evening' && '🌙'}
                            </span>
                            {period}
                          </div>
                          <div className="day-period-meds">
                            {periodMeds.map(med => (
                              <div key={med.id} className="day-med-item">
                                <div className="day-med-info">
                                  <div className="day-med-name">{med.name}</div>
                                  <div className="day-med-dosage">{med.dosage}</div>
                                </div>
                                <div className="day-med-time">{med.time}</div>
                                <button
                                  className="delete-btn"
                                  onClick={() => handleDeleteMedication(med.id)}
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Add Medication Button for Day View */}
            {!showAddMedication && (
              <button
                className="add-medication-btn day-add-btn"
                onClick={() => setShowAddMedication(true)}
              >
                Add new medication
              </button>
            )}

            {/* Add Medication Form for Day View */}
            {showAddMedication && (
              <div className="add-med-modal">
                <div className="modal-content">
                  <div className="modal-header">
                    <h2>Add New Medication</h2>
                    <button
                      className="close-btn"
                      onClick={() => setShowAddMedication(false)}
                    >
                      ✕
                    </button>
                  </div>
                  <form onSubmit={handleAddMedication}>
                    <div className="form-group">
                      <label>Medication Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="e.g., Aspirin"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Dosage</label>
                      <input
                        type="text"
                        value={formData.dosage}
                        onChange={(e) =>
                          setFormData({ ...formData, dosage: e.target.value })
                        }
                        placeholder="e.g., 1 tablet"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Time</label>
                      <input
                        type="time"
                        value={formData.time}
                        onChange={(e) =>
                          setFormData({ ...formData, time: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Period</label>
                      <select
                        value={formData.period}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            period: e.target.value as typeof formData.period,
                          })
                        }
                      >
                        <option>Morning</option>
                        <option>Noon</option>
                        <option>Evening</option>
                      </select>
                    </div>
                    <button type="submit" className="submit-btn">
                      Add Medication
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="tab-content">
            <h2>Progress Tracking</h2>
            <p>Track your medication adherence and health progress here.</p>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="tab-content">
            <h2>Profile</h2>
            <div className="profile-info">
              <p><strong>Name:</strong> {user?.user_metadata?.full_name || displayName}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>User ID:</strong> {user?.id}</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <button
          className={`nav-item ${activeTab === 'main' ? 'active' : ''}`}
          onClick={() => setActiveTab('main')}
        >
          <span className="nav-icon">📝</span>
          <span className="nav-label">Main</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('progress')}
        >
          <span className="nav-icon">📊</span>
          <span className="nav-label">Progress</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <span className="nav-icon">👤</span>
          <span className="nav-label">Profile</span>
        </button>
      </div>
    </div>
  );
};