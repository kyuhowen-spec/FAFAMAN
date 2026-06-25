// Attendance Review Page - Admin only
const AttendanceReviewPage = () => {
  const data = window.PAPA_DATA;
  const employees = data.employees;
  
  // Available months (mocked for now)
  const availableMonths = ['2026-04', '2026-03'];
  const [selectedMonth, setSelectedMonth] = React.useState('2026-04');
  
  const history = data.attendanceHistory?.[selectedMonth] || {};

  const handleDownloadExcel = () => {
    // Generate CSV content
    const headers = ['이름', '부서', '근무 일수', '총 근무 시간 (시간)', '총 야근/연장 시간 (분)'];
    const rows = employees.map(emp => {
      const record = history[emp.id] || { days: 0, hours: 0, overtime: 0 };
      return [
        emp.name,
        emp.team,
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
                <tr key={emp.id} style={{ borderBottom: i === employees.length - 1 ? 'none' : '1px solid var(--line)' }}>
                  <td style={{ padding: '16px 20px', fontWeight: 600 }}>{emp.name}</td>
                  <td style={{ padding: '16px 20px', color: 'var(--ink-soft)' }}>{emp.team} · {emp.title}</td>
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
    </div>
  );
};

window.AttendanceReviewPage = AttendanceReviewPage;
