// Attendance Review Page - Admin only
const AttendanceReviewPage = () => {
  const data = window.PAPA_DATA;
  const employees = data.employees;
  
  // Available months (mocked for now)
  const availableMonths = ['2026-04', '2026-03'];
  const [selectedMonth, setSelectedMonth] = React.useState('2026-04');
  const [selectedEmp, setSelectedEmp] = React.useState(null);
  
  const history = data.attendanceHistory?.[selectedMonth] || {};

  const handleDownloadExcel = () => {
    // Generate CSV content
    const headers = ['이름', '부서', '근무 일수', '총 근무 시간 (시간)', '총 야근/연장 시간 (분)'];
    const rows = employees.map(emp => {
      const record = history[emp.id] || { days: 0, hours: 0, overtime: 0 };
      return [
        emp.name,
        (emp.team || (emp.department === 'EX' ? '디렉터' : emp.department)),
        record.days,
        record.hours,
        record.overtime
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    // Add BOM for Excel UTF-8
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `근태리뷰_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 60 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div className="eyebrow">ATTENDANCE REVIEW</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginTop: 8, letterSpacing: '-.02em' }}>
            근태 리뷰
          </h1>
          <div style={{ marginTop: 8, color: 'var(--ink-mute)', fontSize: 14, fontWeight: 500 }}>
            구성원들의 월별 근무 일수 및 시간을 확인하고 다운로드할 수 있습니다.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select 
            className="input" 
            style={{ width: 140, fontWeight: 600 }}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {availableMonths.map(m => (
              <option key={m} value={m}>{m.split('-')[0]}년 {m.split('-')[1]}월</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={handleDownloadExcel}>
            <Icon name="download" size={14} /> 엑셀 다운로드
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
          <thead style={{ background: 'var(--bg)', borderBottom: '1px solid var(--line)' }}>
            <tr>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--ink-mute)' }}>이름</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--ink-mute)' }}>부서 / 직급</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--ink-mute)' }}>근무 일수</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--ink-mute)' }}>총 근무 시간</th>
              <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--ink-mute)' }}>총 야근/연장</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp, i) => {
              const record = history[emp.id] || { days: 0, hours: 0, overtime: 0 };
              return (
                <tr 
                  key={emp.id} 
                  style={{ 
                    borderBottom: i === employees.length - 1 ? 'none' : '1px solid var(--line)',
                    cursor: 'pointer',
                    transition: 'background .15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  onClick={() => setSelectedEmp(emp.id)}
                >
                  <td style={{ padding: '16px 20px', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar empId={emp.id} size="sm" />
                      {emp.name}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', color: 'var(--ink-soft)' }}>{(emp.team || (emp.department === 'EX' ? '디렉터' : emp.department))} · {emp.title}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{record.days}</span>일
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ fontWeight: 600 }}>{record.hours}</span>시간
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    {record.overtime > 0 ? (
                      <span style={{ fontWeight: 600, color: 'var(--danger)' }}>
                        {Math.floor(record.overtime / 60)}시간 {record.overtime % 60}분
                      </span>
                    ) : (
                      <span style={{ color: 'var(--ink-mute)' }}>-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedEmp && (
        <MemberAttendanceModal 
          empId={selectedEmp} 
          monthStr={selectedMonth} 
          record={history[selectedEmp] || { days: 0, hours: 0, overtime: 0, daily: [] }}
          onClose={() => setSelectedEmp(null)} 
        />
      )}
    </div>
  );
};

const MemberAttendanceModal = ({ empId, monthStr, record, onClose }) => {
  const emp = window.getEmployee(empId);
  const [year, month] = monthStr.split('-').map(Number);
  
  // Calculate calendar
  const daysInMonth = new Date(year, month, 0).getDate(); // month is 1-indexed here, so 0 gets last day of previous month = current month
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0 (Sun) to 6 (Sat)
  
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  // Map daily records by date
  const dailyMap = {};
  (record.daily || []).forEach(d => {
    const day = parseInt(d.date.slice(8), 10);
    dailyMap[day] = d;
  });

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(20,22,32,.55)',
      backdropFilter: 'blur(6px)', zIndex: 110,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div onClick={e => e.stopPropagation()} className="fade-in" style={{
        background: 'var(--surface)', borderRadius: 20,
        width: 800, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 64px rgba(0,0,0,.15), 0 0 0 1px var(--line)',
      }}>
        <div style={{ padding: '32px 32px 24px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Avatar empId={emp.id} size="xl" />
            <div>
              <div className="eyebrow">{monthStr.replace('-', '년 ')}월 상세 근태</div>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>
                {emp.name} <span style={{ color: 'var(--ink-mute)', fontWeight: 600, fontSize: 16 }}>{emp.title} · {(emp.team || (emp.department === 'EX' ? '디렉터' : emp.department))}</span>
              </h2>
              <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)' }}>
                <div>근무 <span style={{ color: 'var(--ink)' }}>{record.days}일</span></div>
                <div>총 <span style={{ color: 'var(--ink)' }}>{record.hours}시간</span></div>
                <div>연장 <span style={{ color: 'var(--danger)' }}>{Math.floor(record.overtime / 60)}시간 {record.overtime % 60}분</span></div>
              </div>
            </div>
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: 8, margin: -8 }}><Icon name="x" size={20}/></button>
        </div>
        
        <div style={{ padding: 32, background: 'var(--bg)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 8, textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--ink-mute)' }}>
            <div style={{ color: 'var(--danger)' }}>일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div style={{ color: 'var(--accent)' }}>토</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
            {cells.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} style={{ minHeight: 100, background: 'rgba(0,0,0,.02)', borderRadius: 12 }} />;
              const isWeekend = idx % 7 === 0 || idx % 7 === 6;
              const log = dailyMap[day];
              
              return (
                <div key={day} style={{
                  minHeight: 100, padding: 10, borderRadius: 12,
                  background: log ? 'var(--surface)' : (isWeekend ? 'rgba(0,0,0,.02)' : 'var(--surface)'),
                  border: log ? '1px solid var(--accent)' : '1px solid var(--line)',
                  boxShadow: log ? '0 4px 12px rgba(61, 207, 166, 0.1)' : 'none',
                  display: 'flex', flexDirection: 'column'
                }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: idx % 7 === 0 ? 'var(--danger)' : idx % 7 === 6 ? 'var(--accent)' : 'var(--ink)' }}>
                    {day}
                  </div>
                  <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {log ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)' }}>
                          <span>출근</span>
                          <span style={{ color: 'var(--ink)' }}>{log.in}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)' }}>
                          <span>퇴근</span>
                          <span style={{ color: 'var(--ink)' }}>{log.out}</span>
                        </div>
                        <div style={{ marginTop: 4, paddingTop: 4, borderTop: '1px solid var(--line-soft)', textAlign: 'right', fontSize: 10, fontWeight: 700, color: 'var(--accent)' }}>
                          {log.hours}h
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-mute)', textAlign: 'center', marginTop: 12 }}>
                        {isWeekend ? '휴무' : '-'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

window.AttendanceReviewPage = AttendanceReviewPage;
