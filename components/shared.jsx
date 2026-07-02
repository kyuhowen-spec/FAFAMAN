// Shared utilities
const getEmployee = (id) => {
  const found = window.PAPA_DATA.employees.find(e => e.id === id) || (window.PAPA_DATA.externalUsers || []).find(e => e.id === id);
  return found || { id, name: '(알 수 없음)', en: 'Unknown', role: 'member', title: '', team: '', initials: '?', color: 'av-0' };
};
// Cleanup old photo data if any exists
(function cleanupOldPhotos() {
  try {
    localStorage.removeItem('papa.profilePhotos');
  } catch {}
  
  if (window.PAPA_DATA && window.PAPA_DATA.employees) {
    let cleaned = false;
    window.PAPA_DATA.employees.forEach(e => {
      if (e.photo) {
        delete e.photo;
        cleaned = true;
      }
    });
    if (cleaned && window.savePapaData) {
      // Trigger a save to clear out the photo strings from Firestore and free space
      window.savePapaData();
    }
  }
})();

const Avatar = ({ empId, size = 'md', className = '' }) => {
  const emp = getEmployee(empId);
  if (!emp) return null;

  return (
    <div className={`avatar avatar-${size} ${emp.color} ${className}`}>
      {emp.name ? emp.name.slice(-2) : ''}
    </div>
  );
};

const StatusChip = ({ status }) => {
  const map = {
    working:        { label: '근무중',   cls: 'status-in',       pill: 'pill-ok' },
    not_checked_in: { label: '출근 전',  cls: 'status-off',      pill: 'pill-mute' },
    checked_out:    { label: '퇴근',     cls: 'status-off',      pill: 'pill-mute' },
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

// Format HH:MM from seconds (초 단위 제거)
const fmtClock = (totalSecs) => {
  const h = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
  return `${h}:${m}`;
};

// Calculate tenure in years from join date
const getTenureYears = (joinDate) => {
  const join = new Date(joinDate);
  const today = new Date('2026-04-21');
  return ((today - join) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
};

Object.assign(window, { getEmployee, Avatar, StatusChip, fmtDuration, fmtClock, getTenureYears });
