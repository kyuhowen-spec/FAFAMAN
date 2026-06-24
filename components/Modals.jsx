// Approver selection card grid — used by Leave & Lunch forms
const SeniorPicker = ({ value, onChange, currentUserId, label = '결재권자 선택', helper }) => {
  const seniors = window.PAPA_DATA.employees.filter(e => (e.role === 'senior' || e.role === 'admin') && e.id !== currentUserId);
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>{label}</div>
      {helper && (
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginBottom: 10, fontWeight: 500 }}>
          {helper}
        </div>
      )}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(seniors.length, 2)}, 1fr)`,
        gap: 8,
      }}>
        {seniors.map(s => {
          const active = value === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onChange(s.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 12px', borderRadius: 12,
                background: active ? 'var(--accent-soft)' : 'var(--bg)',
                border: `1px solid ${active ? 'var(--accent)' : 'transparent'}`,
                textAlign: 'left',
                transition: 'all .12s',
              }}>
              <Avatar empId={s.id} size="sm" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 700,
                  color: active ? 'var(--accent-dark)' : 'var(--ink)',
                }}>
                  {s.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2, fontWeight: 600 }}>
                  {s.title} · {s.team}
                </div>
              </div>
              {active && (
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: 'var(--accent)', color: 'white',
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                }}>
                  <Icon name="check" size={11} strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Leave request form modal
const LeaveRequestForm = ({ onClose, onSubmit, me }) => {
  const [type, setType] = React.useState('연차');
  const [subtype, setSubtype] = React.useState('full');
  const [start, setStart] = React.useState(window.PAPA_DATA.today.date);
  const [end, setEnd] = React.useState(window.PAPA_DATA.today.date);
  const [reason, setReason] = React.useState('');
  const needsApprover = me.role !== 'admin';
  const availableApprovers = window.PAPA_DATA.employees.filter(e => (e.role === 'senior' || e.role === 'admin') && e.id !== me.id);
  const [assignedSenior, setAssignedSenior] = React.useState(availableApprovers[0]?.id || null);

  // Count working days between two dates, excluding Sat(6) and Sun(0)
  const countWorkingDays = (startStr, endStr) => {
    const s = new Date(startStr);
    const e = new Date(endStr);
    if (isNaN(s) || isNaN(e) || s > e) return 0;
    let count = 0;
    const cur = new Date(s);
    while (cur <= e) {
      const wd = cur.getDay();
      if (wd !== 0 && wd !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  };

  // Count calendar (total) days — for the "주말 포함 N일" helper text
  const calendarDays = Math.max(1, Math.round((new Date(end) - new Date(start)) / (1000*60*60*24)) + 1);
  const workingDays = countWorkingDays(start, end);
  const weekendDays = calendarDays - workingDays;

  const days = subtype === 'half-am' || subtype === 'half-pm' ? 0.5 : workingDays;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div className="eyebrow">NEW LEAVE</div>
            <div className="h1" style={{ marginTop: 6 }}>휴가 신청</div>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ background: 'var(--bg)' }}>
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Type toggle */}
        <div style={{ marginBottom: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>종류</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['연차', '반차', '리프레시'].map(t => (
              <button key={t} onClick={() => {
                setType(t);
                setSubtype(t === '반차' ? 'half-am' : 'full');
              }} style={{
                flex: 1, padding: '12px 14px', borderRadius: 10,
                fontSize: 14, fontWeight: 700,
                background: type === t ? 'var(--accent)' : 'var(--bg)',
                color: type === t ? 'white' : 'var(--ink-soft)',
                transition: 'all .15s',
              }}>{t}</button>
            ))}
          </div>
        </div>

        {/* Subtype for 반차 */}
        {type === '반차' && (
          <div style={{ marginBottom: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>시간</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ k:'half-am', l:'오전 반차' }, { k:'half-pm', l:'오후 반차' }].map(s => (
                <button key={s.k} onClick={() => setSubtype(s.k)} style={{
                  flex: 1, padding: '10px 14px', borderRadius: 10,
                  fontSize: 13, fontWeight: 600,
                  background: subtype === s.k ? 'var(--accent-soft)' : 'var(--bg)',
                  color: subtype === s.k ? 'var(--accent-dark)' : 'var(--ink-soft)',
                  border: `1px solid ${subtype === s.k ? 'var(--accent)' : 'transparent'}`,
                }}>{s.l}</button>
              ))}
            </div>
          </div>
        )}

        {/* Dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>시작일</div>
            <input type="date" className="input" value={start}
              onChange={e => { setStart(e.target.value); if (e.target.value > end) setEnd(e.target.value); }}/>
          </div>
          <div style={{ opacity: type === '반차' ? 0.4 : 1, pointerEvents: type === '반차' ? 'none' : 'auto' }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>종료일</div>
            <input type="date" className="input" value={type === '반차' ? start : end}
              onChange={e => setEnd(e.target.value)} min={start}/>
          </div>
        </div>

        {/* Approver selection */}
        {needsApprover && (
          <SeniorPicker
            value={assignedSenior}
            onChange={setAssignedSenior}
            currentUserId={me.id}
            label="결재권자 선택"
            helper="선택한 결재권자에게 승인 요청을 보냅니다"
          />
        )}

        {/* Reason */}
        <div style={{ marginBottom: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>사유 <span style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--ink-mute)', fontWeight: 500 }}>(선택)</span></div>
          <textarea className="input" rows="3" placeholder="간단히 적어주세요"
            value={reason} onChange={e => setReason(e.target.value)}
            style={{ resize: 'none', fontFamily: 'inherit' }}/>
        </div>

        {/* Summary */}
        <div style={{
          padding: 16, borderRadius: 12,
          background: 'var(--accent-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 20,
        }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--accent-dark)', fontWeight: 600 }}>
              신청 일수 <span style={{ fontWeight: 500, opacity: .75 }}>(주말 제외)</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-dark)', letterSpacing: '-.02em' }}>
              {days}<span style={{ fontSize: 14, marginLeft: 4 }}>일</span>
            </div>
            {type !== '반차' && weekendDays > 0 && (
              <div style={{ fontSize: 11, color: 'var(--accent-dark)', opacity: .8, marginTop: 2, fontWeight: 600 }}>
                주말 {weekendDays}일 제외 · 달력상 {calendarDays}일
              </div>
            )}
            {type !== '반차' && days === 0 && (
              <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 2, fontWeight: 700 }}>
                평일이 포함되지 않은 기간이에요
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--accent-dark)', fontWeight: 600 }}>결재 경로</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
              {needsApprover ? (
                <React.Fragment>
                  {assignedSenior && <Avatar empId={assignedSenior} size="xxs" />}
                  <span>{assignedSenior ? `${getEmployee(assignedSenior).name.replace(/^./, '')} 승인` : '결재자 미선택'}</span>
                </React.Fragment>
              ) : '자동 승인 (관리자)'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-lg" onClick={onClose} style={{ flex: 1 }}>취소</button>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => onSubmit({ type, subtype, start, end, days, reason, assignedSenior: needsApprover ? assignedSenior : null })}
            disabled={days === 0 || (needsApprover && !assignedSenior)}
            style={{ flex: 2, opacity: (days === 0 || (needsApprover && !assignedSenior)) ? .4 : 1, cursor: (days === 0 || (needsApprover && !assignedSenior)) ? 'not-allowed' : 'pointer' }}
          >
            신청하기
          </button>
        </div>
      </div>
    </div>
  );
};

// Late report modal
const LateReportForm = ({ onClose, onSubmit }) => {
  const [reason, setReason] = React.useState('');
  const [plannedAt, setPlannedAt] = React.useState('10:00');

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 460 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--warn)' }}>LATE ARRIVAL</div>
            <div className="h1" style={{ marginTop: 6 }}>지각 신고</div>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ background: 'var(--bg)' }}>
            <Icon name="x" size={16} />
          </button>
        </div>

        <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 20, lineHeight: 1.6 }}>
          솔직하게 알려주시면 됩니다. 지각 기록은 카운터에만 반영되고, 팀 전체 피드로 공유돼요.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>예정 시간</div>
            <input type="time" className="input" value={plannedAt} onChange={e => setPlannedAt(e.target.value)}/>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>실제 도착</div>
            <div className="input" style={{ background: 'var(--bg)', color: 'var(--ink)' }}>{currentTime}</div>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>사유</div>
          <textarea className="input" rows="3" placeholder="어떤 일이 있었나요?"
            value={reason} onChange={e => setReason(e.target.value)}
            style={{ resize: 'none', fontFamily: 'inherit' }}/>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-lg" onClick={onClose} style={{ flex: 1 }}>취소</button>
          <button className="btn btn-primary btn-lg" onClick={() => onSubmit({ reason, plannedAt, currentTime })} style={{ flex: 2 }}>
            기록하기
          </button>
        </div>
      </div>
    </div>
  );
};

// Toast
const Toast = ({ toast, onDismiss }) => {
  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [toast]);
  if (!toast) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: 'var(--ink)', color: 'white',
      padding: '12px 20px', borderRadius: 12,
      boxShadow: 'var(--shadow-lg)', zIndex: 200,
      display: 'flex', alignItems: 'center', gap: 10,
      fontSize: 14, fontWeight: 600,
      animation: 'slideDown .25s ease',
    }}>
      {toast.icon && <Icon name={toast.icon} size={16}/>}
      {toast.text}
    </div>
  );
};

// Tweaks panel (role switcher)
const TweaksPanel = ({ show, currentUserId, onSetUser }) => {
  if (!show) return null;
  const roles = [
    { id: 'kh', label: '관리자 (김규호)', role: 'admin' },
    { id: 'sy', label: '시니어 (이서연)', role: 'senior' },
    { id: 'jh', label: '멤버 (정지훈)', role: 'member' },
  ];
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 150,
      background: 'var(--surface)', borderRadius: 16,
      boxShadow: 'var(--shadow-lg)',
      padding: 16, width: 280,
      border: '1px solid var(--line)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Icon name="settings" size={14}/>
        <div style={{ fontSize: 13, fontWeight: 800 }}>Tweaks</div>
        <div style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--ink-mute)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          역할 전환
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {roles.map(r => (
          <button key={r.id} onClick={() => onSetUser(r.id)} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 10,
            background: currentUserId === r.id ? 'var(--accent-soft)' : 'transparent',
            color: currentUserId === r.id ? 'var(--accent-dark)' : 'var(--ink-soft)',
            fontSize: 13, fontWeight: 600,
            justifyContent: 'flex-start',
          }}>
            <Avatar empId={r.id} size="xs"/>
            {r.label}
            {currentUserId === r.id && <Icon name="check" size={14} className="" strokeWidth={2.5} style={{ marginLeft: 'auto' }}/>}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)', fontSize: 11, color: 'var(--ink-mute)', lineHeight: 1.5 }}>
        역할별로 사이드바 메뉴와 대시보드 위젯이 다르게 구성됩니다.
      </div>
    </div>
  );
};

// Overtime request form modal
const OvertimeRequestForm = ({ onClose, onSubmit, me }) => {
  const [reason, setReason] = React.useState('');
  const needsApprover = me.role !== 'admin';
  const availableApprovers = window.PAPA_DATA.employees.filter(e => (e.role === 'senior' || e.role === 'admin') && e.id !== me.id);
  const [assignedSenior, setAssignedSenior] = React.useState(availableApprovers[0]?.id || null);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div className="eyebrow" style={{ color: '#8b5cf6' }}>🌙 OVERTIME (10 PM)</div>
            <div className="h1" style={{ marginTop: 6 }}>야근 신청</div>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ background: 'var(--bg)' }}>
            <Icon name="x" size={16}/>
          </button>
        </div>

        <div style={{ padding: '14px 16px', background: 'var(--accent-soft)', borderRadius: 12, marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--accent-dark)', fontWeight: 600, lineHeight: 1.5 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="info" size={12}/> 안내사항
            </span>
            <ul style={{ marginTop: 8, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4, fontWeight: 500 }}>
              <li>밤 10시 이후의 근무만 야근으로 집계됩니다.</li>
              <li>사전 결재 승인을 받아야 퇴근 시 야근 시간으로 인정됩니다.</li>
            </ul>
          </div>
        </div>

        {/* Approver selection */}
        {needsApprover && (
          <SeniorPicker
            value={assignedSenior}
            onChange={setAssignedSenior}
            currentUserId={me.id}
            label="결재권자 선택"
            helper="선택한 결재권자에게 야근 승인 요청을 보냅니다"
          />
        )}

        {/* Reason */}
        <div style={{ marginBottom: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>야근 사유 <span style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--danger)', fontWeight: 500 }}>(필수)</span></div>
          <textarea className="input" rows="3" placeholder="어떤 업무로 인해 야근이 필요한지 작성해주세요"
            value={reason} onChange={e => setReason(e.target.value)}
            style={{ resize: 'none', fontFamily: 'inherit' }}/>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-lg" onClick={onClose} style={{ flex: 1 }}>취소</button>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => onSubmit({ reason, assignedSenior: needsApprover ? assignedSenior : null })}
            disabled={!reason.trim() || (needsApprover && !assignedSenior)}
            style={{ flex: 2, opacity: (!reason.trim() || (needsApprover && !assignedSenior)) ? .4 : 1, cursor: (!reason.trim() || (needsApprover && !assignedSenior)) ? 'not-allowed' : 'pointer' }}
          >
            신청하기
          </button>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { LeaveRequestForm, LateReportForm, Toast, TweaksPanel, SeniorPicker, OvertimeRequestForm });
