import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { initializeSupabase, getSupabaseClient } from '../lib/database';
import './Dashboard.css';

interface Medication {
  id: string;
  medication_id: string;
  name: string;
  dosage: string;
  time: string;
  period: 'A.M.' | 'P.M.';
  label: 'Maintenance' | 'Prescription' | 'Vitamins' | 'Supplements';
  scheduled_date: string;
  status: 'on_time' | 'late' | 'missed' | null;
  reminder_enabled: boolean;
}

// Status button config
const STATUS_OPTIONS: { value: 'on_time' | 'late' | 'missed'; label: string; emoji: string; color: string }[] = [
  { value: 'on_time', label: 'On Time', emoji: '✓', color: '#0f6e56' },
  { value: 'late',    label: 'Late',    emoji: '⏱', color: '#e6a817' },
  { value: 'missed',  label: 'Missed',  emoji: '✕', color: '#d45050' },
];

interface MedicineIntake {
  id: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  takenTime: string;
  status: 'on_time' | 'late' | 'missed';
  label: 'Maintenance' | 'Prescription' | 'Vitamins' | 'Supplements';
  date: string;
}

// ─── AddMedicationForm moved OUTSIDE Dashboard to prevent remount on every render ───
interface AddMedicationFormProps {
  formData: {
    name: string;
    dosage: string;
    time: string;
    period: 'A.M.' | 'P.M.';
    label: 'Maintenance' | 'Prescription' | 'Vitamins' | 'Supplements';
  };
  selectedDate: Date;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  onChange: (field: string, value: string) => void;
}

const AddMedicationForm: React.FC<AddMedicationFormProps> = ({
  formData,
  selectedDate,
  onSubmit,
  onClose,
  onChange,
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  return (
    <div className="add-med-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Add New Medication</h2>
          <button type="button" className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Show which date this medication will be scheduled for */}
        <div className="scheduled-date-info">
          <span>📅 Scheduling for: </span>
          <strong>
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </strong>
        </div>

        <form onSubmit={onSubmit} noValidate>
          <div className="form-group">
            <label>Medication Name</label>
            <input
              ref={inputRef}
              type="text"
              value={formData.name}
              onChange={e => onChange('name', e.target.value)}
              placeholder="e.g., Aspirin"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Dosage</label>
            <input
              type="text"
              value={formData.dosage}
              onChange={e => onChange('dosage', e.target.value)}
              placeholder="e.g., 1 tablet"
              required
            />
          </div>
          <div className="form-group">
            <label>Time</label>
            <input
              type="time"
              value={formData.time}
              onChange={e => onChange('time', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Period</label>
            <select
              value={formData.period}
              onChange={e => onChange('period', e.target.value)}
            >
              <option>A.M.</option>
              <option>P.M.</option>
            </select>
          </div>
          <div className="form-group">
            <label>Category</label>
            <select
              value={formData.label}
              onChange={e => onChange('label', e.target.value)}
            >
              <option>Maintenance</option>
              <option>Prescription</option>
              <option>Vitamins</option>
              <option>Supplements</option>
            </select>
          </div>
          <button type="submit" className="submit-btn">
            Add Medication
          </button>
        </form>
      </div>
    </div>
  );
};

// ─── Main Dashboard Component ────────────────────────────────────────────────
export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDayView, setShowDayView] = useState(false);
  const [showAddMedication, setShowAddMedication] = useState(false);
  const [activeTab, setActiveTab] = useState('main');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medicineIntakeHistory, setMedicineIntakeHistory] = useState<MedicineIntake[]>([]);
  const [progressFilter, setProgressFilter] = useState<
    'All' | 'Maintenance' | 'Prescription' | 'Vitamins' | 'Supplements'
  >('All');
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // FIX: removed `scheduled_date` from formData — we now always derive it from `selectedDate`
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    time: '',
    period: 'A.M.' as 'A.M.' | 'P.M.',
    label: 'Maintenance' as 'Maintenance' | 'Prescription' | 'Vitamins' | 'Supplements',
  });

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  // ─── Init Supabase ──────────────────────────────────────────────────────────
  useEffect(() => {
    const initSupabase = async () => {
      try {
        initializeSupabase();
        const client = getSupabaseClient();
        if (client) {
          setSupabaseConnected(true);
          setConnectionError(null);
          await loadMedications();
          await loadMedicineHistory();
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to connect to Supabase';
        setConnectionError(message);
        setSupabaseConnected(false);
      } finally {
        setLoading(false);
      }
    };
    initSupabase();
  }, []);

  // ─── Prevent global spacebar from interfering with inputs ───────────────────
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        return;
      }
      if (e.code === 'Space') e.preventDefault();
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // ─── Load medications ───────────────────────────────────────────────────────
  const loadMedications = async () => {
    if (!user) return;
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('medication_schedule')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_date', { ascending: true })
        .order('time_to_take', { ascending: true });

      if (error) throw error;

      const medicationsData: Medication[] = (data || []).map(med => ({
        id: med.id,
        medication_id: med.medication_id,
        // FIX: fall back gracefully if columns don't exist yet
        name: med.medication_name || 'Unknown',
        dosage: med.dosage || '1 tablet',
        time: med.time_to_take,
        period: parseInt(med.time_to_take.split(':')[0]) >= 12 ? 'P.M.' : 'A.M.',
        label: med.label || 'Maintenance',
        scheduled_date: med.scheduled_date,
        status: med.status,
        reminder_enabled: med.reminder_enabled,
      }));

      setMedications(medicationsData);
      setError(null);
    } catch (err) {
      console.error('Error loading medications:', err);
      setError('Failed to load medications');
    }
  };

  // ─── Load medicine history ──────────────────────────────────────────────────
  const loadMedicineHistory = async () => {
    if (!user) return;
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('medication_schedule')
        .select('*')
        .eq('user_id', user.id)
        .not('status', 'is', null)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;

      const historyData: MedicineIntake[] = (data || []).map(history => ({
        id: history.id,
        medicationName: history.medication_name || 'Unknown',
        dosage: history.dosage || '1 tablet',
        scheduledTime: history.time_to_take,
        takenTime: history.taken_at
          ? new Date(history.taken_at).toLocaleTimeString()
          : '---',
        status: history.status || 'missed',
        label: history.label || 'Maintenance',
        date: history.scheduled_date,
      }));

      setMedicineIntakeHistory(historyData);
      setError(null);
    } catch (err) {
      console.error('Error loading medicine history:', err);
      setError('Failed to load medicine history');
    }
  };

  // ─── Calendar helpers ───────────────────────────────────────────────────────
  const getDaysInMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  const getFirstDayOfMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  // ─── Add Medication ─────────────────────────────────────────────────────────
  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('You must be logged in to add medications');
      return;
    }

    if (!formData.name.trim() || !formData.dosage.trim() || !formData.time) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const medicationId = crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

      // Always derive the date from the calendar day the user clicked
      const scheduledDateStr = [
        selectedDate.getFullYear(),
        String(selectedDate.getMonth() + 1).padStart(2, '0'),
        String(selectedDate.getDate()).padStart(2, '0'),
      ].join('-');

      // NOTE: do NOT include `status` in the insert payload.
      // The chk_status constraint only allows 'on_time'|'late'|'missed'.
      // Sending null causes a constraint violation in some Supabase versions.
      // The column default is NULL so omitting it is safe.
      const newMedication = {
        medication_id: medicationId,
        user_id: user.id,
        scheduled_date: scheduledDateStr,
        time_to_take: formData.time,
        reminder_enabled: true,
        medication_name: formData.name.trim(),
        dosage: formData.dosage.trim(),
        label: formData.label,
      };

      console.log('Inserting medication:', newMedication);

      const { data, error: insertError } = await supabase
        .from('medication_schedule')
        .insert([newMedication])
        .select();

      if (insertError) {
        console.error('Supabase insert error details:', insertError);
        // Surface the Supabase hint if available for easier debugging
        const hint = (insertError as any).hint ? ` Hint: ${(insertError as any).hint}` : '';
        throw new Error(`${insertError.message}${hint}`);
      }

      if (data && data.length > 0) {
        const med = data[0];
        const medicationWithId: Medication = {
          id: med.id,
          medication_id: med.medication_id,
          name: med.medication_name || formData.name,
          dosage: med.dosage || formData.dosage,
          time: med.time_to_take,
          period: parseInt(med.time_to_take.split(':')[0]) >= 12 ? 'P.M.' : 'A.M.',
          label: (med.label || formData.label) as Medication['label'],
          scheduled_date: med.scheduled_date,
          status: med.status ?? null,
          reminder_enabled: med.reminder_enabled ?? true,
        };

        setMedications(prev => [...prev, medicationWithId]);
        setFormData({ name: '', dosage: '', time: '', period: 'A.M.', label: 'Maintenance' });
        setShowAddMedication(false);
        setError(null);
        // After saving, navigate to the day view so the user sees the new medication immediately
        setShowDayView(true);
        setSuccessMessage(
          `✓ ${formData.name} added for ${selectedDate.toLocaleDateString('en-US', {
            month: 'long', day: 'numeric',
          })}`
        );
        setTimeout(() => setSuccessMessage(null), 3500);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error adding medication:', msg);
      setError(`Failed to add medication: ${msg}`);
      alert(`Error: ${msg}`);
    }
  };

  // ─── Delete Medication ──────────────────────────────────────────────────────
  const handleDeleteMedication = async (id: string) => {
    if (!user) return;
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('medication_schedule')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setMedications(prev => prev.filter(med => med.id !== id));
      setError(null);
    } catch (err) {
      console.error('Error deleting medication:', err);
      setError('Failed to delete medication');
    }
  };

  // ─── Update Medication Status ───────────────────────────────────────────────
  // Called when user marks a med as on_time / late / missed from the UI
  const handleUpdateMedicationStatus = async (
    id: string,
    status: 'on_time' | 'late' | 'missed'
  ) => {
    if (!user) return;
    try {
      const supabase = getSupabaseClient();
      const takenAt = new Date().toISOString();

      const { error } = await supabase
        .from('medication_schedule')
        .update({ status, taken_at: takenAt })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Status update error:', error);
        throw error;
      }

      // Update local medications list
      setMedications(prev =>
        prev.map(med => (med.id === id ? { ...med, status } : med))
      );

      // Also add/update in history so Progress tab reflects it immediately
      const updatedMed = medications.find(m => m.id === id);
      if (updatedMed) {
        const historyEntry: MedicineIntake = {
          id: updatedMed.id,
          medicationName: updatedMed.name,
          dosage: updatedMed.dosage,
          scheduledTime: updatedMed.time,
          takenTime: new Date(takenAt).toLocaleTimeString(),
          status,
          label: updatedMed.label,
          date: updatedMed.scheduled_date,
        };
        setMedicineIntakeHistory(prev => {
          // Replace if already exists, otherwise prepend
          const exists = prev.some(h => h.id === id);
          return exists
            ? prev.map(h => (h.id === id ? historyEntry : h))
            : [historyEntry, ...prev];
        });
      }

      setError(null);
    } catch (err) {
      console.error('Error updating medication status:', err);
      setError('Failed to update medication status');
    }
  };

  // ─── Month selector ─────────────────────────────────────────────────────────
  const handleMonthSelect = (monthIndex: number) => {
    setSelectedDate(new Date(selectedDate.getFullYear(), monthIndex, 1));
    setShowMonthDropdown(false);
  };

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const convertTo12Hour = (time: string): string => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ─── Record medicine intake (sample data helper) ────────────────────────────
  const recordMedicineIntake = async (
    medicationName: string,
    dosage: string,
    scheduledTime: string,
    takenTime: string,
    status: 'on_time' | 'late' | 'missed',
    label: 'Maintenance' | 'Prescription' | 'Vitamins' | 'Supplements'
  ) => {
    if (!user) return;
    try {
      const supabase = getSupabaseClient();
      const medicationId = crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString();

      const newIntake = {
        medication_id: medicationId,
        user_id: user.id,
        medication_name: medicationName,
        dosage,
        time_to_take: scheduledTime,
        scheduled_date: toLocalDateStr(new Date()),
        status,
        taken_at: takenTime === '---' ? null : new Date().toISOString(),
        reminder_enabled: true,
        label,
      };

      const { data, error } = await supabase
        .from('medication_schedule')
        .insert([newIntake])
        .select()
        .single();

      if (error) throw error;

      const intakeWithId: MedicineIntake = {
        id: data.id,
        medicationName: data.medication_name,
        dosage: data.dosage,
        scheduledTime: data.time_to_take,
        takenTime: data.taken_at
          ? new Date(data.taken_at).toLocaleTimeString()
          : '---',
        status: data.status,
        label,
        date: data.scheduled_date,
      };

      setMedicineIntakeHistory(prev => [intakeWithId, ...prev]);
      setError(null);
    } catch (err) {
      console.error('Error recording medicine intake:', err);
      setError('Failed to record medicine intake');
    }
  };

  const addSampleData = async () => {
    const sampleMeds = [
      {
        name: 'Aspirin',
        dosage: '1 tablet',
        time: '08:00',
        status: 'on_time' as const,
        label: 'Maintenance' as const,
        takenTime: '08:05',
      },
      {
        name: 'Vitamin D',
        dosage: '1 capsule',
        time: '12:00',
        status: 'late' as const,
        label: 'Vitamins' as const,
        takenTime: '12:35',
      },
      {
        name: 'Blood Pressure Med',
        dosage: '1 tablet',
        time: '20:00',
        status: 'missed' as const,
        label: 'Prescription' as const,
        takenTime: '---',
      },
    ];
    for (const med of sampleMeds) {
      await recordMedicineIntake(
        med.name,
        med.dosage,
        med.time,
        med.takenTime,
        med.status,
        med.label
      );
    }
  };

  // ─── Calendar data ──────────────────────────────────────────────────────────
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // ─── Timezone-safe date formatter ─────────────────────────────────────────
  // toISOString() converts to UTC and can shift the date by a day in non-UTC timezones.
  // Always use local year/month/day instead.
  const toLocalDateStr = (date: Date): string => [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');

  const getMedicationsForDate = (date: Date) => {
    const dateStr = toLocalDateStr(date);
    return medications.filter(med => med.scheduled_date === dateStr);
  };

  const medicationsByPeriod = {
    'A.M.': getMedicationsForDate(selectedDate).filter(m => m.period === 'A.M.'),
    'P.M.': getMedicationsForDate(selectedDate).filter(m => m.period === 'P.M.'),
  };

  const daysInMonth = getDaysInMonth(selectedDate);
  const firstDay = getFirstDayOfMonth(selectedDate);
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const sidebarItems = [
    { key: 'main', icon: '⊞', label: 'Main' },
    { key: 'progress', icon: '☰', label: 'Progress' },
    { key: 'profile', icon: '◈', label: 'Profile' },
  ];

  // ─── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your medications...</p>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="dashboard-container">
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
        <div className="sidebar-bottom">
          <button className="sidebar-logout-btn" onClick={logout}>
            ↩ Logout
          </button>
        </div>
      </aside>

      <div className="dashboard-main">
        <div className="dashboard-header">
          <div className="month-selector">
            <div onClick={() => setShowMonthDropdown(!showMonthDropdown)}>
              {selectedDate.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}{' '}
              ▾
            </div>
            {showMonthDropdown && (
              <div className="month-dropdown">
                {months.map((month, index) => (
                  <div
                    key={month}
                    className={`month-option ${
                      index === selectedDate.getMonth() ? 'active' : ''
                    }`}
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

        <div className="main-content">
          {(connectionError || error) && (
            <div className="error-banner">
              <strong>Error:</strong> {connectionError || error}
            </div>
          )}
          {successMessage && (
            <div className="success-banner">{successMessage}</div>
          )}

          {/* ── MAIN TAB (calendar view) ── */}
          {activeTab === 'main' && !showDayView && (
            <div className="main-grid">
              <div className="calendar-section">
                <div className="calendar-label">
                  {selectedDate.toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
                <div className="calendar-grid">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={`h-${i}`} className="calendar-header">
                      {day}
                    </div>
                  ))}
                  {days.map((day, idx) => (
                    <div
                      key={`d-${idx}`}
                      className={`calendar-day${
                        day === selectedDate.getDate() ? ' active' : ''
                      }${day === null ? ' empty' : ''}`}
                      onClick={() => {
                        if (day) {
                          // FIX: update selectedDate so the form uses the correct date
                          setSelectedDate(
                            new Date(
                              selectedDate.getFullYear(),
                              selectedDate.getMonth(),
                              day
                            )
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

              <div className="mood-section">
                <span>
                  <span className="mood-icon">🌤️</span>
                  How do you feel today?
                </span>
                <span className="arrow">→</span>
              </div>

              <div className="medications-container">
                {(['A.M.', 'P.M.'] as const).map(period => (
                  <div key={period} className="period-section">
                    <div className="period-header">
                      <span className="period-icon">
                        {period === 'A.M.' ? '🌅' : '🌙'}
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
                            <div className="med-time">
                              {convertTo12Hour(med.time)}
                            </div>
                            {/* Status buttons - wired to handleUpdateMedicationStatus */}
                            <div className="med-status-btns">
                              {STATUS_OPTIONS.map(opt => (
                                <button
                                  key={opt.value}
                                  title={opt.label}
                                  className={`status-btn ${med.status === opt.value ? 'active' : ''}`}
                                  style={{ color: med.status === opt.value ? opt.color : undefined }}
                                  onClick={() => handleUpdateMedicationStatus(med.id, opt.value)}
                                >
                                  {opt.emoji}
                                </button>
                              ))}
                            </div>
                            <button
                              className="delete-btn"
                              onClick={() => handleDeleteMedication(med.id)}
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="no-meds">
                          No medications for{' '}
                          {selectedDate.toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {!showAddMedication && (
                <button
                  className="add-medication-btn"
                  onClick={() => setShowAddMedication(true)}
                >
                  + Add new medication
                </button>
              )}
            </div>
          )}

          {/* ── ADD MEDICATION FORM (rendered at root level, not nested) ── */}
          {showAddMedication && (
            <AddMedicationForm
              formData={formData}
              selectedDate={selectedDate}
              onSubmit={handleAddMedication}
              onClose={() => setShowAddMedication(false)}
              onChange={handleFormChange}
            />
          )}

          {/* ── DAY VIEW ── */}
          {activeTab === 'main' && showDayView && (
            <div className="day-view">
              <button
                className="back-btn"
                onClick={() => setShowDayView(false)}
              >
                ← Back
              </button>
              <div className="selected-date">
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
              <div className="day-content">
                <div className="star-placeholder">⭐</div>
                {medicationsByPeriod['A.M.'].length === 0 &&
                medicationsByPeriod['P.M.'].length === 0 ? (
                  <>
                    <h2 className="no-meds-title">No medications scheduled</h2>
                    <p className="no-meds-subtitle">
                      Add medications for{' '}
                      {selectedDate.toLocaleDateString()}
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="day-title">Your medications today</h2>
                    <div className="day-medications">
                      {(['A.M.', 'P.M.'] as const).map(period => {
                        const periodMeds = medicationsByPeriod[period];
                        if (periodMeds.length === 0) return null;
                        return (
                          <div key={period} className="day-period">
                            <div className="day-period-header">
                              <span className="period-icon">
                                {period === 'A.M.' ? '🌅' : '🌙'}
                              </span>
                              {period}
                            </div>
                            <div className="day-period-meds">
                              {periodMeds.map(med => (
                                <div key={med.id} className="day-med-item">
                                  <div className="day-med-info">
                                    <div className="day-med-name">
                                      {med.name}
                                    </div>
                                    <div className="day-med-dosage">
                                      {med.dosage}
                                    </div>
                                  </div>
                                  <div className="day-med-time">
                                    {convertTo12Hour(med.time)}
                                  </div>
                                  {/* Status buttons wired to handleUpdateMedicationStatus */}
                                  <div className="med-status-btns">
                                    {STATUS_OPTIONS.map(opt => (
                                      <button
                                        key={opt.value}
                                        title={opt.label}
                                        className={`status-btn ${med.status === opt.value ? 'active' : ''}`}
                                        style={{ color: med.status === opt.value ? opt.color : undefined }}
                                        onClick={() => handleUpdateMedicationStatus(med.id, opt.value)}
                                      >
                                        {opt.emoji}
                                      </button>
                                    ))}
                                  </div>
                                  <button
                                    className="delete-btn"
                                    onClick={() =>
                                      handleDeleteMedication(med.id)
                                    }
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
              {!showAddMedication && (
                <button
                  className="add-medication-btn"
                  onClick={() => setShowAddMedication(true)}
                >
                  + Add new medication
                </button>
              )}
            </div>
          )}

          {/* ── PROGRESS TAB ── */}
          {activeTab === 'progress' && (
            <div className="progress-container">
              <h2>Progress Tracking</h2>
              <p>Track your medication adherence and health progress here.</p>

              {medicineIntakeHistory.length === 0 && (
                <button className="add-sample-btn" onClick={addSampleData}>
                  Add Sample Data (Demo)
                </button>
              )}

              {medicineIntakeHistory.length > 0 && (
                <div className="filter-buttons">
                  {(['All', 'Maintenance', 'Prescription', 'Vitamins', 'Supplements'] as const).map(
                    f => (
                      <button
                        key={f}
                        className={`filter-btn ${progressFilter === f ? 'active' : ''}`}
                        onClick={() => setProgressFilter(f)}
                      >
                        {f}
                      </button>
                    )
                  )}
                </div>
              )}

              <div className="status-cards">
                {(['on_time', 'late', 'missed'] as const).map(s => (
                  <div key={s} className={`status-card ${s.replace('_', '-')}`}>
                    <div className="status-icon">
                      {s === 'on_time' ? '✓' : s === 'late' ? '⏱' : '✕'}
                    </div>
                    <div className="status-count">
                      {
                        medicineIntakeHistory.filter(
                          m =>
                            m.status === s &&
                            (progressFilter === 'All' ||
                              m.label === progressFilter)
                        ).length
                      }
                    </div>
                    <div className="status-label">
                      {s === 'on_time' ? 'On Time' : s === 'late' ? 'Late' : 'Missed'}
                    </div>
                  </div>
                ))}
              </div>

              <div className="medicine-history">
                <h3>Medicine History</h3>
                {medicineIntakeHistory.length > 0 ? (
                  <div className="history-list">
                    {medicineIntakeHistory
                      .filter(
                        intake =>
                          progressFilter === 'All' ||
                          intake.label === progressFilter
                      )
                      .map(intake => (
                        <div
                          key={intake.id}
                          className={`history-item status-${intake.status}`}
                        >
                          <div className="history-item-left">
                            <div className="history-med-name">
                              {intake.medicationName}
                            </div>
                            <div className="history-med-dosage">
                              {intake.dosage}
                            </div>
                            <div className="history-med-date">
                              {new Date(intake.date).toLocaleDateString(
                                'en-US',
                                {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                }
                              )}
                            </div>
                            <div className="history-med-label">
                              {intake.label}
                            </div>
                          </div>
                          <div className="history-item-middle">
                            <div className="history-time">
                              Scheduled: {convertTo12Hour(intake.scheduledTime)}
                            </div>
                            <div className="history-time">
                              Taken:{' '}
                              {intake.takenTime === '---'
                                ? '---'
                                : intake.takenTime}
                            </div>
                          </div>
                          <div
                            className={`history-status status-badge-${intake.status}`}
                          >
                            {intake.status === 'on_time'
                              ? 'On Time'
                              : intake.status === 'late'
                              ? 'Late'
                              : 'Missed'}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="no-history">
                    <p>
                      No medicine intake history yet. Start tracking your
                      medication!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── PROFILE TAB ── */}
          {activeTab === 'profile' && (
            <div className="tab-content">
              <h2>Profile</h2>
              <div className="profile-info">
                <p>
                  <strong>Name:</strong>{' '}
                  {user?.user_metadata?.full_name || displayName}
                </p>
                <p>
                  <strong>Email:</strong> {user?.email}
                </p>
                <p>
                  <strong>User ID:</strong> {user?.id}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};