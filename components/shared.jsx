// Shared utilities
const getEmployee = (id) => window.PAPA_DATA.employees.find(e => e.id === id)
  || (window.PAPA_DATA.externalUsers || []).find(e => e.id === id);

// Photo override store (localStorage-backed) — keyed by empId
const PHOTO_KEY = 'papa.profilePhotos';
const loadPhotos = () => {
  try { return JSON.parse(localStorage.getItem(PHOTO_KEY) || '{}'); }
  catch { return {}; }
};
const savePhoto = (empId, dataUrl) => {
  const all = loadPhotos();
  if (dataUrl) all[empId] = dataUrl; else delete all[empId];
  try { localStorage.setItem(PHOTO_KEY, JSON.stringify(all)); } catch {}
  // Apply to runtime data so re-renders pick up the change
  const emp = window.PAPA_DATA.employees.find(e => e.id === empId);
  if (emp) emp.photo = dataUrl || null;
  // Trigger any listeners
  window.dispatchEvent(new CustomEvent('papa:photo-updated', { detail: { empId } }));
};
// Hydrate photos from localStorage on first load
(function hydrate() {
  const all = loadPhotos();
  if (!window.PAPA_DATA) return;
  window.PAPA_DATA.employees.forEach(e => { if (all[e.id]) e.photo = all[e.id]; });
})();

const Avatar = ({ empId, size = 'md', className = '' }) => {
  const emp = getEmployee(empId);
  // Re-render trigger when photo changes elsewhere
  const [, force] = React.useReducer(x => x + 1, 0);
  React.useEffect(() => {
    const handler = (e) => { if (e.detail?.empId === empId) force(); };
    window.addEventListener('papa:photo-updated', handler);
    return () => window.removeEventListener('papa:photo-updated', handler);
  }, [empId]);
  if (!emp) return null;
  if (emp.photo) {
    return (
      <div
        className={`avatar avatar-${size} ${className}`}
        style={{
          backgroundImage: `url(${emp.photo})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: 'transparent',
        }}
        aria-label={emp.name}
      />
    );
  }
  return (
    <div className={`avatar avatar-${size} ${emp.color} ${className}`}>
      {emp.initials}
    </div>
  );
};

const RolePill = ({ role }) => {
  const labels = { admin: '관리자', senior: '시니어', member: '멤버', accountant: '회계법인' };
  if (role === 'accountant') {
    return <span className="pill" style={{ background: '#1f2a44', color: 'white' }}>회계법인</span>;
  }
  return <span className={`pill pill-${role}`}>{labels[role]}</span>;
};

const StatusChip = ({ status }) => {
  const map = {
    working:        { label: '근무중',   cls: 'status-in',       pill: 'pill-ok' },
    not_checked_in: { label: '출근 전',  cls: 'status-off',      pill: 'pill-mute' },
    vacation:       { label: '연차',      cls: 'status-vacation', pill: 'pill-warn' },
    halfday:        { label: '반차',      cls: 'status-halfday',  pill: 'pill-member' },
  };
  const s = map[status] || map.not_checked_in;
  return (
    <span className={`pill ${s.pill}`}>
      <span className={`status-dot ${s.cls}`}></span>
      {s.label}
    </span>
  );
};

// Format minutes as H시간 M분
const fmtDuration = (totalMins) => {
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
};

// Format HH:MM:SS from seconds
const fmtClock = (totalSecs) => {
  const h = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
  const s = String(totalSecs % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
};

// Calculate tenure in years from join date
const getTenureYears = (joinDate) => {
  const join = new Date(joinDate);
  const today = new Date('2026-04-21');
  return ((today - join) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
};

Object.assign(window, { getEmployee, Avatar, RolePill, StatusChip, fmtDuration, fmtClock, getTenureYears, savePhoto, loadPhotos });
