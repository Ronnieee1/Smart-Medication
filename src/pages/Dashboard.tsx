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

interface MedicineIntake {
  id: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  takenTime: string;
  status: 'on-time' | 'late' | 'missed';
  date: string;
}

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDayView, setShowDayView] = useState(false);
  const [showAddMedication, setShowAddMedication] = useState(false);
  const [activeTab, setActiveTab] = useState('main');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medicineIntakeHistory, setMedicineIntakeHistory] = useState<MedicineIntake[]>([]);
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    time: '',
    period: 'Morning' as const,
  });

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    const initSupabase = async () => {
      try {
        initializeSupabase();
        const client = getSupabaseClient();
        if (client) {
          setSupabaseConnected(true);
          setConnectionError(null);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to connect to Supabase';
        setConnectionError(message);
        setSupabaseConnected(false);
      }
    };
    initSupabase();
  }, []);

  const getDaysInMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  const getFirstDayOfMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handleAddMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.dosage && formData.time) {
      setMedications([...medications, { id: Date.now().toString(), ...formData }]);
      setFormData({ name: '', dosage: '', time: '', period: 'Morning' });
      setShowAddMedication(false);
    }
  };

  const handleDeleteMedication = (id: string) =>
    setMedications(medications.filter(med => med.id !== id));

  const handleMonthSelect = (monthIndex: number) => {
    setSelectedDate(new Date(selectedDate.getFullYear(), monthIndex, 1));
    setShowMonthDropdown(false);
  };

  const recordMedicineIntake = (
    medicationName: string,
    dosage: string,
    scheduledTime: string,
    takenTime: string,
    status: 'on-time' | 'late' | 'missed'
  ) => {
    const newIntake: MedicineIntake = {
      id: Date.now().toString(),
      medicationName,
      dosage,
      scheduledTime,
      takenTime,
      status,
      date: new Date().toISOString(),
    };
    setMedicineIntakeHistory([...medicineIntakeHistory, newIntake]);
  };

  // Sample data - you can remove this after connecting to Arduino
  const addSampleData = () => {
    recordMedicineIntake('Aspirin', '1 tablet', '08:00', '08:05', 'on-time');
    recordMedicineIntake('Vitamin D', '1 capsule', '12:00', '12:35', 'late');
    recordMedicineIntake('Blood Pressure Med', '1 tablet', '20:00', '---', 'missed');
  };

  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];

  const medicationsByPeriod = {
    Morning: medications.filter(m => m.period === 'Morning'),
    Noon: medications.filter(m => m.period === 'Noon'),
    Evening: medications.filter(m => m.period === 'Evening'),
  };

  const daysInMonth = getDaysInMonth(selectedDate);
  const firstDay = getFirstDayOfMonth(selectedDate);
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const sidebarItems = [
    { key: 'main',     icon: '⊞', label: 'Main' },
    { key: 'progress', icon: '☰', label: 'Progress'  },
    { key: 'profile',  icon: '◈', label: 'Profile'     },
  ];

  const AddMedicationForm = () => (
    <div className="add-med-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Add New Medication</h2>
          <button className="close-btn" onClick={() => setShowAddMedication(false)}>✕</button>
        </div>
        <form onSubmit={handleAddMedication}>
          <div className="form-group">
            <label>Medication Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Aspirin"
              required
            />
          </div>
          <div className="form-group">
            <label>Dosage</label>
            <input
              type="text"
              value={formData.dosage}
              onChange={e => setFormData({ ...formData, dosage: e.target.value })}
              placeholder="e.g., 1 tablet"
              required
            />
          </div>
          <div className="form-group">
            <label>Time</label>
            <input
              type="time"
              value={formData.time}
              onChange={e => setFormData({ ...formData, time: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Period</label>
            <select
              value={formData.period}
              onChange={e => setFormData({ ...formData, period: e.target.value as typeof formData.period })}
            >
              <option>Morning</option>
              <option>Noon</option>
              <option>Evening</option>
            </select>
          </div>
          <button type="submit" className="submit-btn">Add Medication</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="dashboard-container">

      {/* ════════════════════════════
          SIDEBAR
      ════════════════════════════ */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">💊</span>
          Smart Med
        </div>

        <nav className="sidebar-nav">
          {sidebarItems.map(item => (
            <button
              key={item.key}
              className={`sidebar-nav-item ${activeTab === item.key ? 'active' : ''}`}
              onClick={() => setActiveTab(item.key)}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Logout pinned to bottom */}
        <div className="sidebar-bottom">
          <button className="sidebar-logout-btn" onClick={logout}>
            ↩ Logout
          </button>
        </div>
      </aside>

      {/* ════════════════════════════
          MAIN AREA
      ════════════════════════════ */}
      <div className="dashboard-main">

        {/* ── Top Header ── */}
        <div className="dashboard-header">
          <div className="month-selector">
            <div onClick={() => setShowMonthDropdown(!showMonthDropdown)}>
              {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} ▾
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

          <div
            className="connection-status"
            style={{
              backgroundColor: supabaseConnected ? '#d4f5f0' : '#fff0f0',
              color: supabaseConnected ? '#0f6e56' : '#d45050',
            }}
          >
            <span style={{ fontSize: 9 }}>●</span>
            {supabaseConnected ? 'Live' : 'Offline'}
          </div>

          <div className="user-avatar">{avatarLetter}</div>
        </div>

        {/* ── Scrollable Content ── */}
        <div className="main-content">
          {connectionError && (
            <div className="error-banner">
              <strong>Connection Error:</strong> {connectionError}
            </div>
          )}

          {/* ── Main Tab ── */}
          {activeTab === 'main' && !showDayView && (
            <div className="main-grid">

              {/* Big Calendar — left, spans 2 rows */}
              <div className="calendar-section">
                <div className="calendar-label">
                  {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
                <div className="calendar-grid">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={`h-${i}`} className="calendar-header">{day}</div>
                  ))}
                  {days.map((day, idx) => (
                    <div
                      key={`d-${idx}`}
                      className={`calendar-day${day === selectedDate.getDate() ? ' active' : ''}${day === null ? ' empty' : ''}`}
                      onClick={() => {
                        if (day) {
                          setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day));
                          setShowDayView(true);
                        }
                      }}
                    >
                      {day}
                    </div>
                  ))}
                </div>
              </div>

              {/* Mood — right, row 1 */}
              <div className="mood-section">
                <span>
                  <span className="mood-icon">🌤️</span>
                  How do you feel today?
                </span>
                <span className="arrow">→</span>
              </div>

              {/* Medications — right, row 2 */}
              <div className="medications-container">
                {(['Morning', 'Noon', 'Evening'] as const).map(period => (
                  <div key={period} className="period-section">
                    <div className="period-header">
                      <span className="period-icon">
                        {period === 'Morning' && '🌅'}
                        {period === 'Noon'    && '☀️'}
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
                            <button className="delete-btn" onClick={() => handleDeleteMedication(med.id)}>✕</button>
                          </div>
                        ))
                      ) : (
                        <div className="no-meds">No medications</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add button — full width, row 3 */}
              {!showAddMedication && (
                <button className="add-medication-btn" onClick={() => setShowAddMedication(true)}>
                  + Add new medication
                </button>
              )}
            </div>
          )}

          {showAddMedication && <AddMedicationForm />}

          {/* ── Day View ── */}
          {activeTab === 'main' && showDayView && (
            <div className="day-view">
              <button className="back-btn" onClick={() => setShowDayView(false)}>← Back</button>
              <div className="selected-date">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
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
                                {period === 'Noon'    && '☀️'}
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
                                  <button className="delete-btn" onClick={() => handleDeleteMedication(med.id)}>✕</button>
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
              {!showAddMedication && (
                <button className="add-medication-btn" onClick={() => setShowAddMedication(true)}>
                  + Add new medication
                </button>
              )}
              {showAddMedication && <AddMedicationForm />}
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="progress-container">
              <h2>Progress Tracking</h2>
              <p>Track your medication adherence and health progress here.</p>
              
              {medicineIntakeHistory.length === 0 && (
                <button className="add-sample-btn" onClick={addSampleData}>
                  Add Sample Data (Demo)
                </button>
              )}
              
              {/* Status Cards */}
              <div className="status-cards">
                <div className="status-card on-time">
                  <div className="status-icon">✓</div>
                  <div className="status-count">{medicineIntakeHistory.filter(m => m.status === 'on-time').length}</div>
                  <div className="status-label">On Time</div>
                </div>
                
                <div className="status-card late">
                  <div className="status-icon">⏱</div>
                  <div className="status-count">{medicineIntakeHistory.filter(m => m.status === 'late').length}</div>
                  <div className="status-label">Late</div>
                </div>
                
                <div className="status-card missed">
                  <div className="status-icon">✕</div>
                  <div className="status-count">{medicineIntakeHistory.filter(m => m.status === 'missed').length}</div>
                  <div className="status-label">Missed</div>
                </div>
              </div>

              {/* Medicine History */}
              <div className="medicine-history">
                <h3>Medicine History</h3>
                {medicineIntakeHistory.length > 0 ? (
                  <div className="history-list">
                    {[...medicineIntakeHistory].reverse().map((intake) => (
                      <div key={intake.id} className={`history-item status-${intake.status}`}>
                        <div className="history-item-left">
                          <div className="history-med-name">{intake.medicationName}</div>
                          <div className="history-med-dosage">{intake.dosage}</div>
                          <div className="history-med-date">{new Date(intake.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        </div>
                        <div className="history-item-middle">
                          <div className="history-time">Scheduled: {intake.scheduledTime}</div>
                          <div className="history-time">Taken: {intake.takenTime}</div>
                        </div>
                        <div className={`history-status status-badge-${intake.status}`}>
                          {intake.status === 'on-time' && 'On Time'}
                          {intake.status === 'late' && 'Late'}
                          {intake.status === 'missed' && 'Missed'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-history">
                    <p>No medicine intake history yet. Start tracking your medication!</p>
                  </div>
                )}
              </div>
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
      </div>
    </div>
  );
};