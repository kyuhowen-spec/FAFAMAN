// Main App - orchestrates everything
const App = () => {
  const data = window.PAPA_DATA;

  // Tweakable defaults
  const tweaks = /*EDITMODE-BEGIN*/{
    "currentUserId": "jh"
  }/*EDITMODE-END*/;

  const initialUserId = (() => {
    try {
      const stored = localStorage.getItem('papa_auth');
      if (stored && getEmployee(stored)) return stored;
    } catch {}
    return null;
  })();

  const [currentUserId, setCurrentUserId] = React.useState(initialUserId);
  const [active, setActive] = React.useState(getEmployee(initialUserId)?.role === 'accountant' ? 'payroll' : 'dashboard');
  const [attendance, setAttendance] = React.useState(data.attendance);
  const [approvals, setApprovals] = React.useState(data.approvals);
  const [lateCounter, setLateCounter] = React.useState(data.lateCounter);
  const [monthlyOvertime, setMonthlyOvertime] = React.useState(data.monthlyOvertime || {});
  const [lateLogs, setLateLogs] = React.useState(data.lateLogs);
  const [penaltyMode, setPenaltyMode] = React.useState(data.penaltyMode || {});
  const [payroll, setPayroll] = React.useState(data.payroll);
  const [payrollSchema, setPayrollSchema] = React.useState(data.payrollSchema);
  const [payMonth, setPayMonth] = React.useState('2026-06');
  const [certTemplate, setCertTemplate] = React.useState(data.certTemplate);
  // Clock state
  const [clockSecs, setClockSecs] = React.useState(() => {
    const now = new Date();
    return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  });

  // Auto-sync state changes to window.PAPA_DATA and Firestore
  React.useEffect(() => {
    let changed = false;
    if (data.attendance !== attendance) { data.attendance = attendance; changed = true; }
    if (data.penaltyMode !== penaltyMode) { data.penaltyMode = penaltyMode; changed = true; }
    if (data.lateCounter !== lateCounter) { data.lateCounter = lateCounter; changed = true; }
    if (data.monthlyOvertime !== monthlyOvertime) { data.monthlyOvertime = monthlyOvertime; changed = true; }
    if (data.lateLogs !== lateLogs) { data.lateLogs = lateLogs; changed = true; }
    if (data.approvals !== approvals) { data.approvals = approvals; changed = true; }
    if (data.payroll !== payroll) { data.payroll = payroll; changed = true; }
    if (data.certTemplate !== certTemplate) { data.certTemplate = certTemplate; changed = true; }
    
    if (changed && window.savePapaData) {
      window.savePapaData();
    }
  }, [attendance, penaltyMode, lateCounter, lateLogs, approvals, payroll, certTemplate, monthlyOvertime]);

  const [showLeaveForm, setShowLeaveForm] = React.useState(false);
  const [showLunchForm, setShowLunchForm] = React.useState(false);
  const [showOvertimeForm, setShowOvertimeForm] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const [selectedMember, setSelectedMember] = React.useState(null);
  const [editMode, setEditMode] = React.useState(false);

  const me = getEmployee(currentUserId);
  const myAtt = attendance[currentUserId];

  // Persist auth
  React.useEffect(() => {
    try {
      if (currentUserId) localStorage.setItem('papa_auth', currentUserId);
    } catch {}
  }, [currentUserId]);

  const handleLogin = (id) => {
    setCurrentUserId(id);
    setActive(getEmployee(id)?.role === 'accountant' ? 'payroll' : 'dashboard');
  };
  const handleLogout = () => {
    try { localStorage.removeItem('papa_auth'); } catch {}
    setCurrentUserId(null);
  };

  // Payroll handlers
  const handleUpdateCell = (month, empId, kind, name, value) => {
    setPayroll(prev => {
      const m = { ...(prev[month] || {}) };
      const rec = { earnings: { ...(m[empId]?.earnings || {}) }, deductions: { ...(m[empId]?.deductions || {}) } };
      rec[kind][name] = value;
      m[empId] = rec;
      return { ...prev, [month]: m };
    });
  };
  const handleAddPayItem = (kind, name) => {
    setPayrollSchema(prev => ({ ...prev, [kind]: [...prev[kind], name] }));
  };
  const handleBulkPayroll = (month, updates) => {
    setPayroll(prev => {
      const m = { ...(prev[month] || {}) };
      Object.entries(updates).forEach(([empId, rec]) => {
        m[empId] = {
          earnings: { ...(m[empId]?.earnings || {}), ...rec.earnings },
          deductions: { ...(m[empId]?.deductions || {}), ...rec.deductions },
        };
      });
      return { ...prev, [month]: m };
    });
  };

  // Work clock: tick every second when working
  React.useEffect(() => {
    if (!myAtt || (myAtt.status !== 'working' && myAtt.status !== 'halfday') || !myAtt.checkIn) {
      return;
    }
    const computeSecs = () => {
      const [h, m] = myAtt.checkIn.split(':').map(Number);
      const baseSecs = h * 3600 + m * 60;
      const now = new Date();
      // Calculate KST time
      const kstTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (9 * 3600000));
      const currentSecs = kstTime.getHours() * 3600 + kstTime.getMinutes() * 60 + kstTime.getSeconds();
      return Math.max(0, currentSecs - baseSecs);
    };
    
    setClockSecs(computeSecs());
    const id = setInterval(() => {
      setClockSecs(computeSecs());
    }, 1000);
    return () => clearInterval(id);
  }, [myAtt?.checkIn, myAtt?.status, currentUserId]);

  // Actions
  const isPenaltyActiveToday = (empId) => {
    const pm = penaltyMode[empId];
    if (!pm) return false;
    const today = window.PAPA_DATA.today.date;
    return pm.startDate <= today && today <= pm.endDate;
  };

  const handleCheckIn = () => {
    const now = new Date();
    const kstTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (9 * 3600000));
    const h = kstTime.getHours();
    const m = kstTime.getMinutes();
    
    const checkIn = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    const outH = (h + 9) % 24;
    const plannedOut = `${String(outH).padStart(2,'0')}:${String(m).padStart(2,'0')}`;

    // Deadline: 11:00 normally, 10:00 when penalty is active
    const inPenalty = isPenaltyActiveToday(currentUserId);
    const deadlineMins = (inPenalty ? 10 : 11) * 60;
    const checkInMins = h * 60 + m;
    const lateMins = Math.max(0, checkInMins - deadlineMins);
    const wasLate = lateMins > 0;

    setAttendance(prev => ({
      ...prev,
      [currentUserId]: { ...prev[currentUserId], status: 'working', checkIn, plannedOut, lunch: 60, wasLate, lateMins },
    }));

    if (wasLate) {
      const today = window.PAPA_DATA.today.date;
      const reasonNote = inPenalty ? '(벌칙 근태 · 10시 마감 조과)' : '(자동 기록 · 체크인 시각 기준)';
      const newLog = {
        id: 'll_' + Date.now(),
        empId: currentUserId,
        date: today,
        time: checkIn,
        delta: lateMins,
        reason: reasonNote,
      };
      setLateLogs(prev => [newLog, ...prev]);

      // Increment counter; trigger penalty at 5
      setLateCounter(prev => {
        const next = (prev[currentUserId] || 0) + 1;
        if (next >= 5 && !penaltyMode[currentUserId]) {
          // Start penalty tomorrow, 7 days
          const tmr = new Date(today);
          tmr.setDate(tmr.getDate() + 1);
          const end = new Date(tmr);
          end.setDate(end.getDate() + 6);
          const iso = (d) => d.toISOString().slice(0, 10);
          setPenaltyMode(pm => ({
            ...pm,
            [currentUserId]: { startDate: iso(tmr), endDate: iso(end), reason: '지각 5회 누적' },
          }));
          setToast({ text: `⚠️ 지각 5회 도달 · 내일부터 7일간 10시 출근 벌칙 적용`, icon: 'flame' });
          return { ...prev, [currentUserId]: next };
        }
        setToast({ text: `${checkIn} 체크인 · ${lateMins}분 지각 자동 기록`, icon: 'alert-triangle' });
        return { ...prev, [currentUserId]: next };
      });
    } else {
      setToast({ text: `${checkIn} 출근 체크인 완료`, icon: 'check' });
    }
  };
  const [showCheckOutConfirm, setShowCheckOutConfirm] = React.useState(false);

  const handleCheckOut = () => {
    setShowCheckOutConfirm(true);
  };

  const confirmCheckOut = () => {
    const now = new Date();
    const kstTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (9 * 3600000));
    const h = kstTime.getHours();
    const m = kstTime.getMinutes();
    
    let overtimeMins = 0;
    if (h >= 22) {
      const today = window.PAPA_DATA.today.date;
      const hasApprovedOt = approvals.some(a => 
        a.isOvertime && a.empId === currentUserId && a.start === today && a.stage === 'approved'
      );
      if (hasApprovedOt) {
        overtimeMins = (h - 22) * 60 + m;
      }
    }

    if (overtimeMins > 0) {
      setMonthlyOvertime(prev => ({
        ...prev,
        [currentUserId]: (prev[currentUserId] || 0) + overtimeMins,
      }));
    }

    setAttendance(prev => ({
      ...prev,
      [currentUserId]: {
        ...prev[currentUserId],
        status: 'checked_out',
        checkIn: null,
        plannedOut: null,
        checkedOutAt: now.toISOString(),
      },
    }));
    setShowCheckOutConfirm(false);
    if (overtimeMins > 0) {
      setToast({ text: `오늘 수고하셨어요 👋 (야근 ${Math.floor(overtimeMins / 60)}h ${overtimeMins % 60}m 적립)`, icon: 'moon' });
    } else {
      setToast({ text: '오늘 수고하셨어요 👋', icon: 'check' });
    }
  };

  const handleChangeLunch = (mins) => {
    if (mins === 60) {
      setAttendance(prev => ({
        ...prev,
        [currentUserId]: { ...prev[currentUserId], lunch: 60, lunchSlot: null, lunchStatus: null },
      }));
      setToast({ text: '점심 1시간으로 변경', icon: 'coffee' });
    } else {
      // 90 minutes → must go through approval
      setShowLunchForm(true);
    }
  };

  const handleSubmitLunch = ({ slot, note, assignedSenior }) => {
    // Set pending state on user's attendance
    setAttendance(prev => ({
      ...prev,
      [currentUserId]: { ...prev[currentUserId], lunch: 90, lunchSlot: slot, lunchStatus: 'pending', lunchNote: note },
    }));
    // Add approval record
    const targetIsAdmin = assignedSenior && getEmployee(assignedSenior).role === 'admin';
    const newAppr = {
      id: `lunch${Date.now()}`,
      empId: currentUserId,
      type: '점심 1.5h',
      subtype: slot,
      start: window.PAPA_DATA.today.date,
      end: window.PAPA_DATA.today.date,
      days: 0,
      reason: note || (slot === 'early' ? '12:00–13:30 희망' : '12:30–14:00 희망'),
      appliedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      stage: me.role === 'admin' ? 'approved' : (targetIsAdmin ? 'pending_admin' : 'pending_senior'),
      isLunch: true,
      lunchSlot: slot,
      assignedSenior: assignedSenior || null,
    };
    setApprovals(prev => [newAppr, ...prev]);
    setShowLunchForm(false);
    if (me.role === 'admin') {
      setAttendance(prev => ({
        ...prev,
        [currentUserId]: { ...prev[currentUserId], lunchStatus: 'approved' },
      }));
      setToast({ text: '점심 1.5h 자동 승인', icon: 'check' });
    } else {
      const seniorName = assignedSenior ? getEmployee(assignedSenior).name : '결재권자';
      setToast({ text: `${seniorName}에게 점심 1.5h 신청 완료`, icon: 'coffee' });
    }
  };

  const handleSubmitOvertime = ({ reason, assignedSenior }) => {
    const targetIsAdmin = assignedSenior && getEmployee(assignedSenior).role === 'admin';
    const newAppr = {
      id: `overtime${Date.now()}`,
      empId: currentUserId,
      type: '야근',
      subtype: 'overtime',
      start: window.PAPA_DATA.today.date,
      end: window.PAPA_DATA.today.date,
      days: 0,
      reason: reason,
      appliedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      stage: me.role === 'admin' ? 'approved' : (targetIsAdmin ? 'pending_admin' : 'pending_senior'),
      isOvertime: true,
      assignedSenior: assignedSenior || null,
    };
    setApprovals(prev => [newAppr, ...prev]);
    setShowOvertimeForm(false);
    if (me.role === 'admin') {
      setToast({ text: '야근 자동 승인', icon: 'check' });
    } else {
      const seniorName = assignedSenior ? getEmployee(assignedSenior).name : '결재권자';
      setToast({ text: `${seniorName}에게 야근 승인 요청 완료`, icon: 'moon' });
    }
  };

  const handleApprove = (id) => {
    setApprovals(prev => prev.map(a => {
      if (a.id !== id) return a;
      const meEmp = getEmployee(currentUserId);
      // Lunch & Overtime requests only need senior approval (not a full two-stage flow)
      if (a.isLunch) {
        setAttendance(prevAtt => ({
          ...prevAtt,
          [a.empId]: { ...prevAtt[a.empId], lunchStatus: 'approved' },
        }));
        return { ...a, stage: 'approved' };
      }
      if (a.isOvertime) {
        return { ...a, stage: 'approved' };
      }
      if (meEmp.role === 'senior' && a.stage === 'pending_senior') return { ...a, stage: 'pending_admin' };
      if (meEmp.role === 'admin') return { ...a, stage: 'approved', approvedAt: new Date().toISOString().slice(0, 16).replace('T', ' '), approvedBy: currentUserId };
      return a;
    }));
    setToast({ text: '결재 승인 완료', icon: 'check' });
  };

  const handleReject = (id, msg) => {
    const now = new Date();
    const ts = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;
    setApprovals(prev => prev.map(a => a.id === id ? {
      ...a,
      stage: 'rejected',
      rejectedAt: ts,
      rejectedBy: currentUserId,
      rejectReason: msg || a.rejectReason,
    } : a));
    setToast({ text: '결재 반려 처리', icon: 'x' });
  };

  const handleSubmitLeave = (payload) => {
    const targetIsAdmin = payload.assignedSenior && getEmployee(payload.assignedSenior).role === 'admin';
    const newAppr = {
      id: `a${Date.now()}`,
      empId: currentUserId,
      type: payload.type,
      subtype: payload.subtype,
      start: payload.start,
      end: payload.end,
      days: payload.days,
      reason: payload.reason || '—',
      appliedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      stage: me.role === 'admin' ? 'approved' : (targetIsAdmin ? 'pending_admin' : 'pending_senior'),
      assignedSenior: payload.assignedSenior || null,
    };
    setApprovals(prev => [newAppr, ...prev]);
    setShowLeaveForm(false);
    setToast({ text: '휴가 신청이 접수되었어요', icon: 'plane' });
  };

  const handleReportLate = (payload) => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const [ph, pm] = payload.plannedAt.split(':').map(Number);
    const delta = Math.max(1, (now.getHours() * 60 + now.getMinutes()) - (ph * 60 + pm));
    const newLog = {
      id: `l${Date.now()}`,
      empId: currentUserId,
      date: '2026-04-21',
      time,
      plannedAt: payload.plannedAt,
      delta,
      reason: payload.reason || '(사유 미기재)',
    };
    setLateLogs(prev => [newLog, ...prev]);
    setLateCounter(prev => ({ ...prev, [currentUserId]: (prev[currentUserId] || 0) + 1 }));
    setShowLateForm(false);
    setToast({ text: `지각 ${delta}분 기록 완료`, icon: 'alert-triangle' });
  };

  // Tweaks listener
  React.useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === '__activate_edit_mode') setEditMode(true);
      if (e.data?.type === '__deactivate_edit_mode') setEditMode(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const handleSetUser = (id) => {
    setCurrentUserId(id);
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { currentUserId: id } }, '*');
  };

  // Auth gate — must log in as yourself
  if (!currentUserId || !me) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Visible approvals for sidebar badge
  const inboxCount = approvals.filter(a => {
    if (me.role === 'senior') return a.stage === 'pending_senior' && a.assignedSenior === currentUserId;
    if (me.role === 'admin') return a.stage === 'pending_admin' || a.stage === 'pending_senior';
    return false;
  }).length;

  return (
    <div className="app" data-screen-label="Dashboard">
      <Sidebar
        role={me.role}
        currentUserId={currentUserId}
        active={active}
        onNav={setActive}
        inboxCount={inboxCount}
        onLogout={handleLogout}
      />
      <div className="main-col">
        <Topbar
          today={data.today}
          currentUserId={currentUserId}
          role={me.role}
          notifCount={inboxCount}
        />
        <div className="content">
          {active === 'dashboard' && me.role !== 'accountant' && (
            <DashboardPage
              me={currentUserId}
              myRole={me.role}
              attendance={attendance}
              approvals={approvals}
              lateCounter={lateCounter}
              lateLogs={lateLogs}
              penaltyMode={penaltyMode}
              clockSecs={clockSecs}
              onCheckIn={handleCheckIn}
              onCheckOut={handleCheckOut}
              onChangeLunch={handleChangeLunch}
              onApprove={handleApprove}
              onReject={handleReject}
              onShowLeaveForm={() => setShowLeaveForm(true)}
              onShowOvertimeForm={() => setShowOvertimeForm(true)}
              onSelectMember={setSelectedMember}
            />
          )}
          {active === 'calendar' && <CalendarPage events={data.events} />}
          {active === 'policy' && <PolicyBoardPage role={me.role} currentUserId={currentUserId} />}
          {active === 'org' && (
            <OrgPage
              role={me.role}
              currentUserId={currentUserId}
              onSelectMember={setSelectedMember}
            />
          )}
          {active === 'inbox' && (me.role === 'admin' || me.role === 'senior') && (
            <InboxPage
              role={me.role}
              currentUserId={currentUserId}
              approvals={approvals}
              onApprove={handleApprove}
              onReject={handleReject}
              onSelectMember={setSelectedMember}
            />
          )}
          {active === 'payroll' && (
            <PayrollPage
              role={me.role}
              currentUserId={currentUserId}
              payroll={payroll}
              schema={payrollSchema}
              month={payMonth}
              setMonth={setPayMonth}
              onUpdateCell={handleUpdateCell}
              onAddItem={handleAddPayItem}
              onBulkApply={handleBulkPayroll}
              onToast={setToast}
            />
          )}
          {active === 'cert' && (
            <CertificatePage
              role={me.role}
              currentUserId={currentUserId}
              template={certTemplate}
              onUpdateTemplate={setCertTemplate}
              onToast={setToast}
            />
          )}
          {active === 'settings' && me.role === 'admin' && (
            <SettingsPage onToast={setToast} />
          )}
          {active !== 'dashboard' && active !== 'calendar' && active !== 'policy' && active !== 'org' && active !== 'inbox' && active !== 'payroll' && active !== 'cert' && active !== 'settings' && (
            <PlaceholderPage tabKey={active} />
          )}
        </div>
      </div>

      {showLeaveForm && (
        <LeaveRequestForm
          me={me}
          onClose={() => setShowLeaveForm(false)}
          onSubmit={handleSubmitLeave}
        />
      )}
      {selectedMember && (
        <MemberProfilePopup empId={selectedMember} currentUserId={currentUserId} onClose={() => setSelectedMember(null)} />
      )}
      {showLunchForm && (
        <LunchRequestForm
          me={me}
          onClose={() => setShowLunchForm(false)}
          onSubmit={handleSubmitLunch}
        />
      )}
      {showOvertimeForm && (
        <OvertimeRequestForm
          me={me}
          onClose={() => setShowOvertimeForm(false)}
          onSubmit={handleSubmitOvertime}
        />
      )}

      {/* 퇴근 확인 팝업 */}
      {showCheckOutConfirm && (
        <div onClick={() => setShowCheckOutConfirm(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(20,22,32,.55)',
          backdropFilter: 'blur(6px)', zIndex: 110,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'white', borderRadius: 16,
            width: 420, padding: 28,
            boxShadow: '0 24px 80px rgba(0,0,0,.18)',
            textAlign: 'center',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: 'var(--accent-soft)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Icon name="log-out" size={24} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.02em' }}>
              오늘도 수고하셨습니다.
            </div>
            <div style={{ fontSize: 15, color: 'var(--ink-soft)', marginTop: 10, lineHeight: 1.5, fontWeight: 500 }}>
              퇴근하시겠습니까?
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 8, lineHeight: 1.5 }}>
              퇴근 후에는 다음 날 오전 9시까지 출근하기 버튼이 비활성화됩니다.
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 24, justifyContent: 'center' }}>
              <button className="btn" onClick={() => setShowCheckOutConfirm(false)} style={{ minWidth: 100 }}>
                취소
              </button>
              <button className="btn btn-primary" onClick={confirmCheckOut} style={{ minWidth: 100 }}>
                <Icon name="check" size={14} strokeWidth={2.5} />
                퇴근하기
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} onDismiss={() => setToast(null)} />
      <TweaksPanel
        show={editMode}
        currentUserId={currentUserId}
        onSetUser={handleSetUser}
      />
    </div>
  );
};

// Calendar-only page (full width)
const CalendarPage = ({ events }) => {
  const data = window.PAPA_DATA;
  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <div className="eyebrow">CALENDAR</div>
        <h1 style={{
          fontSize: 52, fontWeight: 800, letterSpacing: '-.04em',
          marginTop: 8, lineHeight: 1,
        }}>
          팀 캘린더
        </h1>
        <div style={{ fontSize: 17, color: 'var(--ink-soft)', marginTop: 10, fontWeight: 500 }}>
          연차 · 반차 · 생일을 한 화면에서 확인하세요.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 20 }}>
        <div style={{ gridColumn: 'span 12' }}>
          <MiniCalendar events={events} />
        </div>
      </div>
    </>
  );
};

// Placeholder for not-yet-built tabs
const PlaceholderPage = ({ tabKey }) => {
  const item = (window.navItems || []).find(n => n.key === tabKey) || { label: tabKey, icon: 'sparkles' };
  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <div className="eyebrow">{(tabKey || '').toUpperCase()}</div>
        <h1 style={{
          fontSize: 52, fontWeight: 800, letterSpacing: '-.04em',
          marginTop: 8, lineHeight: 1,
        }}>
          {item.label}
        </h1>
      </div>
      <div className="card" style={{
        padding: '80px 40px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        background: 'var(--surface)',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: 'var(--accent-soft)', color: 'var(--accent)',
          display: 'grid', placeItems: 'center', marginBottom: 18,
        }}>
          <Icon name={item.icon} size={28}/>
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.02em' }}>
          곧 준비할 화면이에요
        </div>
        <div style={{ fontSize: 14, color: 'var(--ink-mute)', marginTop: 8, maxWidth: 360, lineHeight: 1.5 }}>
          이 페이지는 다음 스프린트에서 만들 예정입니다. 지금은 대시보드와 캘린더만 사용 가능해요.
        </div>
      </div>
    </>
  );
};

// Dashboard page layout
const DashboardPage = ({ me, myRole, attendance, approvals, lateCounter, lateLogs, penaltyMode, clockSecs,
  onCheckIn, onCheckOut, onChangeLunch, onApprove, onReject, onShowLeaveForm, onShowOvertimeForm, onSelectMember }) => {
  const data = window.PAPA_DATA;
  const isSeniorOrAdmin = myRole === 'senior' || myRole === 'admin';
  const emp = getEmployee(me);

  // Page heading banner
  return (
    <>
      {/* Page header with big type */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 20 }}>
          <div>
            <div className="eyebrow">DASHBOARD / {myRole.toUpperCase()}</div>
            <h1 style={{
              fontSize: 52, fontWeight: 800, letterSpacing: '-.04em',
              marginTop: 8, lineHeight: 1,
            }}>
              좋은 아침이에요.
            </h1>
            <div style={{ fontSize: 17, color: 'var(--ink-soft)', marginTop: 10, fontWeight: 500 }}>
              {myRole === 'admin' && `오늘 ${data.employees.length - 1}명의 동료들과 함께합니다.`}
              {myRole === 'senior' && `결재 ${approvals.filter(a => a.stage === 'pending_senior' && a.assignedSenior === me).length}건이 기다리고 있어요.`}
              {myRole === 'member' && `${emp.name}님의 하루를 응원해요.`}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="eyebrow">이번주 누적</div>
            <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-.03em', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
              32<span style={{ fontSize: 16, color: 'var(--ink-mute)', marginLeft: 4, fontWeight: 700 }}>h 14m</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Hero (8col) + right column (4col: 2x2 of widgets) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 20, marginBottom: 20 }}>
        <HeroToday
          me={me}
          attendance={attendance}
          penaltyMode={penaltyMode}
          clockSecs={clockSecs}
          onCheckIn={onCheckIn}
          onCheckOut={onCheckOut}
          onChangeLunch={onChangeLunch}
          onShowLeaveForm={onShowLeaveForm}
          onShowOvertimeForm={onShowOvertimeForm}
        />
        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <LateCounter
            empId={me}
            counter={lateCounter[me] || 0}
            penalty={penaltyMode?.[me]}
          />
          <LeaveBalance balance={data.leaveBalance[me]} />
        </div>
      </div>

      {/* Second row: Team status (2/3) + Approval queue (1/3) OR calendar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 20, marginBottom: 20 }}>
        <div style={{ gridColumn: 'span 8' }}>
          <TeamStatus
            attendance={attendance}
            employees={data.employees}
            lateCounter={lateCounter}
            onSelectMember={onSelectMember}
          />
        </div>
        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <ApprovalPending
            role={myRole}
            approvals={approvals}
            currentUserId={me}
            onApprove={onApprove}
            onReject={onReject}
          />
        </div>
      </div>

      {/* Third row: Late log feed (senior/admin) or policy-focused empty (member) */}
      {isSeniorOrAdmin && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 20, marginBottom: 20 }}>
          <div style={{ gridColumn: 'span 12' }}>
            <LateLogFeed lateLogs={lateLogs} employees={data.employees} />
          </div>
        </div>
      )}

      {/* Policy strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 20 }}>
        <PolicyStrip policies={data.policyHighlights} />
      </div>
    </>
  );
};

// Settings page — admin-only: manage allowed hosts
const SettingsPage = ({ onToast }) => {
  const data = window.PAPA_DATA;
  const [hosts, setHosts] = React.useState(data.allowedHosts || []);
  const [newHost, setNewHost] = React.useState('');

  const addHost = () => {
    const val = newHost.trim();
    if (!val) return;
    if (hosts.some(h => h.toLowerCase() === val.toLowerCase())) {
      onToast && onToast({ text: '이미 등록된 호스트입니다.', icon: 'alert-triangle' });
      return;
    }
    const updated = [...hosts, val];
    setHosts(updated);
    data.allowedHosts = updated;
    if (window.savePapaData) window.savePapaData();
    setNewHost('');
    onToast && onToast({ text: `${val} 추가 완료`, icon: 'check' });
  };

  const removeHost = (idx) => {
    const removed = hosts[idx];
    const updated = hosts.filter((_, i) => i !== idx);
    setHosts(updated);
    data.allowedHosts = updated;
    if (window.savePapaData) window.savePapaData();
    onToast && onToast({ text: `${removed} 제거됨`, icon: 'x' });
  };

  const currentHost = window.location.hostname;
  const isCurrentAllowed = hosts.length === 0 || hosts.some(h => h.trim().toLowerCase() === currentHost.toLowerCase());

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div className="eyebrow">SETTINGS</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginTop: 8, letterSpacing: '-.02em' }}>
          서버 접속 제한 설정
        </h1>
        <div style={{ marginTop: 8, color: 'var(--ink-mute)', fontSize: 14, fontWeight: 500, lineHeight: 1.5 }}>
          등록된 호스트(IP 또는 도메인)에서 접속할 때만 로그인이 가능합니다.<br/>
          목록이 비어 있으면 모든 호스트에서 접속을 허용합니다.
        </div>
      </div>

      {/* Current connection info */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: isCurrentAllowed ? 'rgba(61,207,166,.15)' : 'var(--danger-soft, rgba(248,99,99,.12))',
            color: isCurrentAllowed ? 'var(--ok-ink, #1d7a5a)' : 'var(--danger)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name={isCurrentAllowed ? 'check-circle' : 'alert-triangle'} size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-mute)', letterSpacing: '.06em' }}>현재 접속 호스트</div>
            <div className="mono" style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{currentHost}</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span style={{
              fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 6,
              background: isCurrentAllowed ? 'rgba(61,207,166,.15)' : 'var(--danger-soft, rgba(248,99,99,.12))',
              color: isCurrentAllowed ? 'var(--ok-ink, #1d7a5a)' : 'var(--danger)',
            }}>
              {isCurrentAllowed ? '접속 허용됨' : '접속 차단됨'}
            </span>
          </div>
        </div>
      </div>

      {/* Host list */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--line-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>허용 호스트 목록</div>
            <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 4 }}>
              {hosts.length}개 등록됨
            </div>
          </div>
        </div>

        {/* Add new host */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--line-soft)', display: 'flex', gap: 8 }}>
          <input
            className="input"
            value={newHost}
            onChange={e => setNewHost(e.target.value)}
            placeholder="IP 또는 도메인 입력 (예: 192.168.0.100)"
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addHost(); } }}
            style={{ flex: 1, fontSize: 14 }}
          />
          <button className="btn btn-primary" onClick={addHost}>
            <Icon name="plus" size={14} strokeWidth={2.5} />
            추가
          </button>
        </div>

        {/* Host entries */}
        <div style={{ padding: '8px 16px' }}>
          {hosts.length === 0 ? (
            <div style={{
              padding: '32px 16px', textAlign: 'center',
              color: 'var(--ink-mute)', fontSize: 13, fontWeight: 500,
            }}>
              <Icon name="globe" size={24} style={{ marginBottom: 8, opacity: .5 }} />
              <div>등록된 호스트가 없습니다.</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>모든 네트워크에서 접속이 허용됩니다.</div>
            </div>
          ) : (
            hosts.map((h, i) => {
              const isCurrent = h.trim().toLowerCase() === currentHost.toLowerCase();
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 12px', borderRadius: 10,
                  borderBottom: i < hosts.length - 1 ? '1px solid var(--line-soft)' : 'none',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: isCurrent ? 'rgba(61,207,166,.15)' : 'var(--bg)',
                    color: isCurrent ? 'var(--ok-ink, #1d7a5a)' : 'var(--ink-mute)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name="server" size={15} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="mono" style={{ fontSize: 14, fontWeight: 700 }}>{h}</div>
                  </div>
                  {isCurrent && (
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4,
                      background: 'rgba(61,207,166,.15)', color: 'var(--ok-ink, #1d7a5a)',
                    }}>현재 접속 중</span>
                  )}
                  <button
                    onClick={() => removeHost(i)}
                    className="btn-icon"
                    style={{ background: 'var(--bg)', width: 30, height: 30, color: 'var(--danger)' }}
                    title="삭제"
                  >
                    <Icon name="trash" size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Warning note */}
      <div style={{
        padding: '16px 20px', borderRadius: 12,
        background: 'rgba(245,166,35,.1)', border: '1px solid rgba(245,166,35,.3)',
        display: 'flex', gap: 12, alignItems: 'flex-start',
      }}>
        <Icon name="alert-triangle" size={16} style={{ color: '#b56b00', marginTop: 2, flexShrink: 0 }} />
        <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5, fontWeight: 500 }}>
          <strong>주의:</strong> 현재 접속 중인 호스트(<span className="mono" style={{ fontWeight: 700 }}>{currentHost}</span>)를 목록에서 제거하면,
          다음 로그아웃 후 이 위치에서 재접속할 수 없습니다.
        </div>
      </div>
    </div>
  );
};

window.App = App;

// Mount with Async Data Initialization & Sync Listener
const PapaRoot = () => {
  const [ready, setReady] = React.useState(false);
  const [syncTick, setSyncTick] = React.useState(0);

  React.useEffect(() => {
    // 1. Fetch data initially from Firestore
    if (window.initPapaData) {
      window.initPapaData().then(() => setReady(true));
    } else {
      setReady(true);
    }

    // 2. Listen for realtime syncs from Firestore onSnapshot
    const handleSync = () => {
      setSyncTick(t => t + 1); // Force full remount on data sync
    };
    window.addEventListener('papa-data-updated', handleSync);
    return () => window.removeEventListener('papa-data-updated', handleSync);
  }, []);

  if (!ready) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--ink)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <div style={{ fontWeight: 600 }}>Loading FAFA Workspace...</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Using syncTick as key forces a complete remount of the app when data syncs,
  // ensuring all internal component states (like React.useState) re-initialize with the fresh PAPA_DATA.
  return <App key={syncTick} />;
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<PapaRoot />);
