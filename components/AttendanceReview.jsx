// Attendance Review Page - Admin & HR
const AttendanceReviewPage = () => {
  const data = window.PAPA_DATA;
  const employees = data.employees;
  
  const currentMonthStr = data.today?.date?.slice(0, 7) || '2026-04';
  
  const availableMonths = React.useMemo(() => {
    let months = Object.keys(data.attendanceHistory || {});
    if (!months.includes(currentMonthStr)) {
      months.push(currentMonthStr);
    }
    return months.sort().reverse();
  }, [data.attendanceHistory, currentMonthStr]);

  const [selectedMonth, setSelectedMonth] = React.useState(availableMonths[0]);
  const [selectedEmp, setSelectedEmp] = React.useState(null);
  
  // Get today's live attendance info for an employee
  const getTodayInfo = (empId) => {
    if (selectedMonth !== currentMonthStr) return null;
    const att = data.attendance?.[empId];
    if (!att) return null;
    return {
      status: att.status,
      checkIn: att.firstCheckIn || att.checkIn || null,
      wasLate: att.wasLate || false,
      lateMins: att.lateMins || 0,
    };
  };

  const getLiveRecord = (empId) => {
    const history = data.attendanceHistory?.[selectedMonth] || {};
    const record = history[empId] ? { ...history[empId] } : { days: 0, hours: 0, overtime: 0, daily: [] };
    
    if (selectedMonth === currentMonthStr) {
      const att = data.attendance?.[empId];
      if (att && att.status !== 'not_checked_in') {
        let hrs = 0;
        if (att.accumulatedSecs) {
          hrs = att.accumulatedSecs / 3600;
        } else if (att.checkIn) {
          const [h, m] = att.checkIn.split(':').map(Number);
          const now = new Date();
          const kst = new Date(now.getTime() + now.getTimezoneOffset()*60000 + 9*3600000);
          hrs = Math.max(0, (kst.getHours()*3600 + kst.getMinutes()*60 + kst.getSeconds()) - (h*3600 + m*60)) / 3600;
        }
        hrs = parseFloat(hrs.toFixed(1));
        if (hrs > 0) {
          record.days += 1;
          record.hours = parseFloat((record.hours + hrs).toFixed(1));
        }
      }
    }

    // Add weekend work from approvals
    record.weekendHalf = 0;
    record.weekendFull = 0;
    const weekendApprovals = (window.PAPA_DATA.approvals || []).filter(a => 
      a.empId === empId && a.isWeekendWork && a.stage === 'approved' && a.start && a.start.startsWith(selectedMonth)
    );
    weekendApprovals.forEach(a => {
      if (a.duration === 'halfday') record.weekendHalf += 1;
      else record.weekendFull += 1;
    });

    // Count overtime from approved overtime requests
    record.approvedOvertimeCount = (window.PAPA_DATA.approvals || []).filter(a =>
      a.empId === empId && a.isOvertime && a.stage === 'approved' && a.start && a.start.startsWith(selectedMonth)
    ).length;

    // Monthly overtime minutes
    record.monthlyOvertimeMins = (data.monthlyOvertime || {})[empId] || 0;

    // Late count for the month
    record.lateCount = (data.lateLogs || []).filter(l =>
      l.empId === empId && l.date && l.date.startsWith(selectedMonth)
    ).length;

    return record;
  };

  const handleDownloadExcel = () => {
    // Enhanced CSV content with detailed columns
    const headers = [
      '이름', '사번', '부서', '직급',
      '근무 일수', '총 근무 시간',
      '오늘 출근 시각', '오늘 상태',
      '야근 승인 건수', '연장/야근 시간 (분)', '월 누적 야근 (분)',
      '지각 횟수',
      '주말 반일 근무 (건)', '주말 종일 근무 (건)',
    ];

    // Build daily detail rows for each employee
    const rows = employees.map(emp => {
      const record = getLiveRecord(emp.id);
      const todayInfo = getTodayInfo(emp.id);
      const statusLabel = todayInfo ? {
        'working': '근무 중',
        'checked_out': '퇴근',
        'vacation': '휴가',
        'halfday': '반차',
        'not_checked_in': '미출근',
      }[todayInfo.status] || todayInfo.status : '-';

      return [
        emp.name,
        emp.empNo || emp.id,
        (emp.team || (emp.department === 'EX' ? '디렉터' : emp.department)),
        emp.title,
        record.days,
        record.hours,
        todayInfo?.checkIn || '-',
        statusLabel,
        record.approvedOvertimeCount,
        record.overtime,
        record.monthlyOvertimeMins,
        record.lateCount,
        record.weekendHalf,
        record.weekendFull,
      ];
    });

    // Daily detail sheet
    const dailyHeaders = ['이름', '날짜', '출근', '퇴근', '근무시간(h)', '비고'];
    const dailyRows = [];
    employees.forEach(emp => {
      const record = getLiveRecord(emp.id);
      (record.daily || []).forEach(d => {
        dailyRows.push([
          emp.name, d.date, d.in || '-', d.out || '-', d.hours || 0,
          d.late ? `지각 ${d.lateMins || ''}분` : '',
        ]);
      });
    });

    const summarySheet = [
      `[월간 요약] ${selectedMonth}`,
      headers.join(','),
      ...rows.map(r => r.map(v => `"${v}"`).join(',')),
      '',
      '[일별 상세 기록]',
      dailyHeaders.join(','),
      ...dailyRows.map(r => r.map(v => `"${v}"`).join(',')),
    ].join('\n');

    // Add BOM for Excel UTF-8
    const blob = new Blob(['\uFEFF' + summarySheet], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `근태리뷰_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const thStyle = { padding: '14px 16px', fontWeight: 700, color: 'var(--ink-mute)', fontSize: 12, letterSpacing: '.02em', whiteSpace: 'nowrap' };
  const tdStyle = { padding: '14px 16px' };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 60 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div className="eyebrow">ATTENDANCE REVIEW</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginTop: 8, letterSpacing: '-.02em' }}>
            근태 리뷰
          </h1>
          <div style={{ marginTop: 8, color: 'var(--ink-mute)', fontSize: 14, fontWeight: 500 }}>
            구성원들의 출퇴근 기록, 연장·야근 정보를 확인하고 엑셀로 다운로드할 수 있습니다.
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

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {(() => {
          const totalDays = employees.reduce((s, e) => s + getLiveRecord(e.id).days, 0);
          const totalHours = employees.reduce((s, e) => s + getLiveRecord(e.id).hours, 0);
          const totalOvertimeMins = employees.reduce((s, e) => s + getLiveRecord(e.id).monthlyOvertimeMins, 0);
          const totalLate = employees.reduce((s, e) => s + getLiveRecord(e.id).lateCount, 0);
          return (
            <>
              <div className="card" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-mute)', letterSpacing: '.06em' }}>총 근무 일수</div>
                <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: 'var(--accent)', letterSpacing: '-.02em' }}>{totalDays}<span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-mute)' }}>일</span></div>
              </div>
              <div className="card" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-mute)', letterSpacing: '.06em' }}>총 근무 시간</div>
                <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: 'var(--ink)', letterSpacing: '-.02em' }}>{totalHours.toFixed(1)}<span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-mute)' }}>h</span></div>
              </div>
              <div className="card" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-mute)', letterSpacing: '.06em' }}>총 야근 시간</div>
                <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: totalOvertimeMins > 0 ? 'var(--danger)' : 'var(--ink-mute)', letterSpacing: '-.02em' }}>
                  {totalOvertimeMins > 0 ? `${Math.floor(totalOvertimeMins / 60)}h ${totalOvertimeMins % 60}m` : '0'}
                </div>
              </div>
              <div className="card" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-mute)', letterSpacing: '.06em' }}>총 지각 횟수</div>
                <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: totalLate > 0 ? 'var(--warn-ink)' : 'var(--ink-mute)', letterSpacing: '-.02em' }}>{totalLate}<span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-mute)' }}>회</span></div>
              </div>
            </>
          );
        })()}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead style={{ background: 'var(--bg)', borderBottom: '1px solid var(--line)' }}>
              <tr>
                <th style={thStyle}>이름</th>
                <th style={thStyle}>부서 / 직급</th>
                <th style={thStyle}>오늘 출근</th>
                <th style={thStyle}>상태</th>
                <th style={thStyle}>근무 일수</th>
                <th style={thStyle}>총 근무 시간</th>
                <th style={thStyle}>야근/연장</th>
                <th style={thStyle}>지각</th>
                <th style={thStyle}>휴일 근무</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, i) => {
                const record = getLiveRecord(emp.id);
                const todayInfo = getTodayInfo(emp.id);

                const statusMap = {
                  'working': { label: '근무 중', color: 'var(--ok)', bg: 'var(--ok-soft)' },
                  'checked_out': { label: '퇴근', color: 'var(--ink-mute)', bg: 'var(--line)' },
                  'vacation': { label: '휴가', color: 'var(--accent)', bg: 'var(--accent-soft)' },
                  'halfday': { label: '반차', color: 'var(--accent)', bg: 'var(--accent-soft)' },
                  'not_checked_in': { label: '미출근', color: 'var(--ink-mute)', bg: 'var(--line)' },
                };
                const statusInfo = todayInfo ? (statusMap[todayInfo.status] || { label: '-', color: 'var(--ink-mute)', bg: 'var(--line)' }) : null;

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
                    <td style={{ ...tdStyle, fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar empId={emp.id} size="sm" />
                        {emp.name}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--ink-soft)' }}>
                      {(emp.team || (emp.department === 'EX' ? '디렉터' : emp.department))} · {emp.title}
                    </td>
                    <td style={tdStyle}>
                      {todayInfo?.checkIn ? (
                        <span className="mono" style={{ fontWeight: 700, fontSize: 13 }}>{todayInfo.checkIn}</span>
                      ) : (
                        <span style={{ color: 'var(--ink-mute)' }}>-</span>
                      )}
                      {todayInfo?.wasLate && (
                        <span style={{
                          marginLeft: 6, fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
                          background: 'var(--danger-soft)', color: 'var(--danger-ink)',
                        }}>지각</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      {statusInfo ? (
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                          background: statusInfo.bg, color: statusInfo.color,
                        }}>{statusInfo.label}</span>
                      ) : (
                        <span style={{ color: 'var(--ink-mute)' }}>-</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{record.days}</span>일
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 600 }}>{record.hours}</span>시간
                    </td>
                    <td style={tdStyle}>
                      {(record.overtime > 0 || record.monthlyOvertimeMins > 0) ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {record.monthlyOvertimeMins > 0 && (
                            <span style={{ fontWeight: 600, color: 'var(--danger)', fontSize: 12 }}>
                              야근 {Math.floor(record.monthlyOvertimeMins / 60)}h {record.monthlyOvertimeMins % 60}m
                            </span>
                          )}
                          {record.overtime > 0 && (
                            <span style={{ fontWeight: 600, color: 'var(--warn-ink)', fontSize: 11 }}>
                              연장 {Math.floor(record.overtime / 60)}h {record.overtime % 60}m
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--ink-mute)' }}>-</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      {record.lateCount > 0 ? (
                        <span style={{
                          fontWeight: 700, color: record.lateCount >= 5 ? 'var(--danger)' : 'var(--warn-ink)',
                          fontSize: 13,
                        }}>
                          {record.lateCount}회
                          {record.lateCount >= 5 && (
                            <span style={{
                              marginLeft: 4, fontSize: 9, fontWeight: 800, padding: '2px 5px', borderRadius: 4,
                              background: 'var(--danger-soft)', color: 'var(--danger)',
                            }}>벌칙</span>
                          )}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--ink-mute)' }}>-</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      {(record.weekendHalf > 0 || record.weekendFull > 0) ? (
                        <span style={{ fontWeight: 600, color: 'var(--ok-ink)', fontSize: 12 }}>
                          {record.weekendHalf > 0 && `반일 ${record.weekendHalf} `}
                          {record.weekendFull > 0 && `종일 ${record.weekendFull}`}
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

      {selectedEmp && (
        <MemberAttendanceModal 
          empId={selectedEmp} 
          monthStr={selectedMonth} 
          record={getLiveRecord(selectedEmp)}
          onClose={() => setSelectedEmp(null)} 
        />
      )}
    </div>
  );
};

const MemberAttendanceModal = ({ empId, monthStr, record, onClose }) => {
  const emp = window.getEmployee(empId);
  const data = window.PAPA_DATA;
  const [year, month] = monthStr.split('-').map(Number);
  
  // Calculate calendar
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  // Map daily records by date
  const dailyMap = {};
  (record.daily || []).forEach(d => {
    const day = parseInt(d.date.slice(8), 10);
    dailyMap[day] = d;
  });

  // Get approved overtime days
  const overtimeDays = new Set();
  (data.approvals || []).filter(a =>
    a.empId === empId && a.isOvertime && a.stage === 'approved' && a.start && a.start.startsWith(monthStr)
  ).forEach(a => {
    const d = parseInt(a.start.slice(8), 10);
    overtimeDays.add(d);
  });

  // Get late logs for this month
  const lateDays = {};
  (data.lateLogs || []).filter(l => l.empId === empId && l.date && l.date.startsWith(monthStr)).forEach(l => {
    const d = parseInt(l.date.slice(8), 10);
    lateDays[d] = l;
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
        width: 860, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 64px rgba(0,0,0,.15), 0 0 0 1px var(--line)',
        position: 'relative',
      }}>
        {/* 닫기 버튼 — 모달 우상단 고정 */}
        <button className="btn btn-ghost" onClick={onClose} style={{
          position: 'sticky', top: 12, float: 'right', marginRight: 12, marginTop: 12,
          zIndex: 10, padding: 8, borderRadius: 10,
          background: 'var(--surface)', boxShadow: '0 2px 8px rgba(0,0,0,.08)',
        }}><Icon name="x" size={20}/></button>

        <div style={{ padding: '32px 32px 24px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Avatar empId={emp.id} size="xl" />
            <div>
              <div className="eyebrow">{monthStr.replace('-', '년 ')}월 상세 근태</div>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>
                {emp.name} <span style={{ color: 'var(--ink-mute)', fontWeight: 600, fontSize: 16 }}>{emp.title} · {(emp.team || (emp.department === 'EX' ? '디렉터' : emp.department))}</span>
              </h2>
              <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)', flexWrap: 'wrap' }}>
                <div>근무 <span style={{ color: 'var(--ink)' }}>{record.days}일</span></div>
                <div>총 <span style={{ color: 'var(--ink)' }}>{record.hours}시간</span></div>
                <div>연장 <span style={{ color: 'var(--danger)' }}>{Math.floor(record.overtime / 60)}시간 {record.overtime % 60}분</span></div>
                {record.monthlyOvertimeMins > 0 && (
                  <div>야근 <span style={{ color: 'var(--danger)' }}>{Math.floor(record.monthlyOvertimeMins / 60)}h {record.monthlyOvertimeMins % 60}m</span></div>
                )}
                {record.lateCount > 0 && (
                  <div>지각 <span style={{ color: 'var(--warn-ink)' }}>{record.lateCount}회</span></div>
                )}
              </div>
            </div>
          </div>
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
              const isOvertimeDay = overtimeDays.has(day);
              const lateLog = lateDays[day];
              
              return (
                <div key={day} style={{
                  minHeight: 100, padding: 10, borderRadius: 12,
                  background: log ? 'var(--surface)' : (isWeekend ? 'rgba(0,0,0,.02)' : 'var(--surface)'),
                  border: log ? `1px solid ${isOvertimeDay ? 'var(--danger)' : 'var(--accent)'}` : '1px solid var(--line)',
                  boxShadow: log ? (isOvertimeDay ? '0 4px 12px rgba(255,90,110,0.1)' : '0 4px 12px rgba(61,207,166,0.1)') : 'none',
                  display: 'flex', flexDirection: 'column'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: idx % 7 === 0 ? 'var(--danger)' : idx % 7 === 6 ? 'var(--accent)' : 'var(--ink)' }}>
                      {day}
                    </span>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {isOvertimeDay && (
                        <span style={{ fontSize: 8, fontWeight: 800, padding: '1px 4px', borderRadius: 3, background: 'var(--danger-soft)', color: 'var(--danger)' }}>야근</span>
                      )}
                      {lateLog && (
                        <span style={{ fontSize: 8, fontWeight: 800, padding: '1px 4px', borderRadius: 3, background: 'var(--warn-soft)', color: 'var(--warn-ink)' }}>지각</span>
                      )}
                    </div>
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
                        <div style={{ marginTop: 4, paddingTop: 4, borderTop: '1px solid var(--line-soft)', textAlign: 'right', fontSize: 10, fontWeight: 700, color: isOvertimeDay ? 'var(--danger)' : 'var(--accent)' }}>
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
