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
  const [active, setActive] = React.useState(() => {
    const saved = sessionStorage.getItem('papa_active_tab');
    if (saved) return saved;
    return (getEmployee(initialUserId)?.role === 'accountant' || getEmployee(initialUserId)?.role === 'hr') ? 'payroll' : 'dashboard';
  });

  React.useEffect(() => {
    if (active) sessionStorage.setItem('papa_active_tab', active);
  }, [active]);
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

  // Sync incoming real-time data changes from Firestore back to local state
  React.useEffect(() => {
    const handleSync = () => {
      const data = window.PAPA_DATA;
      setAttendance(data.attendance);
      setPenaltyMode(data.penaltyMode || {});
      setLateCounter(data.lateCounter);
      setMonthlyOvertime(data.monthlyOvertime || {});
      setLateLogs(data.lateLogs);
      setApprovals(data.approvals);
      setPayroll(data.payroll);
      setPayrollSchema(data.payrollSchema);
      setCertTemplate(data.certTemplate);
    };
    window.addEventListener('papa-data-updated', handleSync);
    return () => window.removeEventListener('papa-data-updated', handleSync);
  }, []);

  const [showLeaveForm, setShowLeaveForm] = React.useState(false);
  const [showLunchForm, setShowLunchForm] = React.useState(false);
  const [showAdditionalWorkForm, setShowAdditionalWorkForm] = React.useState(false);
  const [showOutsideWorkForm, setShowOutsideWorkForm] = React.useState(false);
  const [showRecheckInForm, setShowRecheckInForm] = React.useState(false);
  const [toast, setToast] = React.useState(() => {
    const pt = sessionStorage.getItem('papa_pending_toast');
    if (pt) {
      sessionStorage.removeItem('papa_pending_toast');
      return { text: pt, icon: 'check' };
    }
    return null;
  });
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
    const emp = getEmployee(id);
    setActive((emp?.role === 'accountant' || emp?.role === 'hr') ? 'payroll' : 'dashboard');
  };
  const handleLogout = () => {
    // 로그아웃 시 근무 중이면 자동 퇴근 처리
    if (currentUserId && window.apiMutatePapaData) {
      const att = window.PAPA_DATA?.attendance?.[currentUserId];
      if (att && (att.status === 'working' || att.status === 'halfday')) {
        const now = new Date();
        const kstTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (9 * 3600000));
        const h = kstTime.getHours();
        const m = kstTime.getMinutes();

        window.apiMutatePapaData(data => {
          if (!data.attendance) data.attendance = {};
          const prevAtt = data.attendance[currentUserId] || {};
          let sessionSecs = 0;
          if (prevAtt.checkIn) {
            const [ch, cm] = prevAtt.checkIn.split(':').map(Number);
            const baseSecs = ch * 3600 + cm * 60;
            const currentSecs = h * 3600 + m * 60 + kstTime.getSeconds();
            sessionSecs = Math.max(0, currentSecs - baseSecs);
          }
          data.attendance[currentUserId] = {
            ...prevAtt,
            status: 'checked_out',
            accumulatedSecs: (prevAtt.accumulatedSecs || 0) + sessionSecs,
            checkIn: null,
            checkedOutAt: now.toISOString(),
          };
        });
      }
    }
    try { localStorage.removeItem('papa_auth'); localStorage.removeItem('papa_device_owner'); } catch {}
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
      let sessionSecs = 0;
      if (myAtt.checkIn) {
        const [h, m] = myAtt.checkIn.split(':').map(Number);
        const baseSecs = h * 3600 + m * 60;
        const now = new Date();
        const kstTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (9 * 3600000));
        const currentSecs = kstTime.getHours() * 3600 + kstTime.getMinutes() * 60 + kstTime.getSeconds();
        sessionSecs = Math.max(0, currentSecs - baseSecs);
      }
      return (myAtt.accumulatedSecs || 0) + sessionSecs;
    };
    
    setClockSecs(computeSecs());
    const id = setInterval(() => {
      setClockSecs(computeSecs());
    }, 1000);
    return () => clearInterval(id);
  }, [myAtt?.checkIn, myAtt?.status, myAtt?.accumulatedSecs, currentUserId]);

  // Smart auto-checkout on ungraceful close
  React.useEffect(() => {
    if (!currentUserId) return;
    
    const isNewSession = !sessionStorage.getItem('papa_active');
    
    if (isNewSession) {
      const currentAtt = window.PAPA_DATA?.attendance?.[currentUserId];
      if (currentAtt && (currentAtt.status === 'working' || currentAtt.status === 'halfday')) {
        const lastSeenStr = localStorage.getItem(`papa_last_seen_${currentUserId}`);
        const lastSeen = lastSeenStr ? parseInt(lastSeenStr, 10) : null;
        
        // If lastSeen is within the last 24 hours, use it. Otherwise use current time.
        const now = lastSeen && (Date.now() - lastSeen < 24 * 3600 * 1000) ? new Date(lastSeen) : new Date();
        
        const kstTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (9 * 3600000));
        const currentSecs = kstTime.getHours() * 3600 + kstTime.getMinutes() * 60 + kstTime.getSeconds();
        
        let sessionSecs = 0;
        if (currentAtt.checkIn) {
          const [h, m] = currentAtt.checkIn.split(':').map(Number);
          sessionSecs = Math.max(0, currentSecs - (h * 3600 + m * 60));
        }
        
        if (window.apiMutatePapaData) {
          window.apiMutatePapaData(data => {
            if (!data.attendance) data.attendance = {};
            if (!data.attendance[currentUserId]) data.attendance[currentUserId] = {};
            
            data.attendance[currentUserId].accumulatedSecs = (data.attendance[currentUserId].accumulatedSecs || 0) + sessionSecs;
            data.attendance[currentUserId].status = 'checked_out';
            data.attendance[currentUserId].checkIn = null;
            data.attendance[currentUserId].checkedOutAt = now.toISOString();
          });
        }
      }
      
      // Mark session as active
      sessionStorage.setItem('papa_active', '1');
    }

    // Heartbeat: save last seen time every 10 seconds
    const heartbeat = setInterval(() => {
      localStorage.setItem(`papa_last_seen_${currentUserId}`, Date.now().toString());
    }, 10000);

    return () => clearInterval(heartbeat);
  }, [currentUserId]);

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

    if (window.apiMutatePapaData) {
      window.apiMutatePapaData(data => {
        if (!data.attendance) data.attendance = {};
        const prevAtt = data.attendance[currentUserId] || {};
        const isFirst = !prevAtt.firstCheckIn;

        data.attendance[currentUserId] = {
          ...prevAtt,
          status: 'working',
          checkIn,
          firstCheckIn: prevAtt.firstCheckIn || checkIn,
          plannedOut: prevAtt.plannedOut || plannedOut,
          lunch: prevAtt.lunch || 60,
          wasLate: isFirst ? wasLate : prevAtt.wasLate,
          lateMins: isFirst ? lateMins : prevAtt.lateMins,
        };

        if (wasLate && isFirst) {
          const today = data.today.date;
          const reasonNote = inPenalty ? '(벌칙 근태 · 10시 마감 조과)' : '(자동 기록 · 체크인 시각 기준)';
          const newLog = {
            id: 'll_' + Date.now(),
            empId: currentUserId,
            date: today,
            time: checkIn,
            delta: lateMins,
            reason: reasonNote,
          };
          if (!data.lateLogs) data.lateLogs = [];
          data.lateLogs.unshift(newLog);

          if (!data.lateCounter) data.lateCounter = {};
          const next = (data.lateCounter[currentUserId] || 0) + 1;
          data.lateCounter[currentUserId] = next;

          if (next >= 5 && (!data.penaltyMode || !data.penaltyMode[currentUserId])) {
            const tmr = new Date(today);
            tmr.setDate(tmr.getDate() + 1);
            const end = new Date(tmr);
            end.setDate(end.getDate() + 6);
            const iso = (d) => d.toISOString().slice(0, 10);
            if (!data.penaltyMode) data.penaltyMode = {};
            data.penaltyMode[currentUserId] = { startDate: iso(tmr), endDate: iso(end), reason: '지각 5회 누적' };
          }
        }
      });

      const isFirstTimeCheckIn = !attendance[currentUserId]?.firstCheckIn;
      if (wasLate && isFirstTimeCheckIn) {
        const next = (lateCounter[currentUserId] || 0) + 1;
        if (next >= 5 && !penaltyMode[currentUserId]) {
          setToast({ text: `⚠️ 지각 5회 도달 · 내일부터 7일간 10시 출근 벌칙 적용`, icon: 'flame' });
        } else {
          setToast({ text: `${checkIn} 체크인 · ${lateMins}분 지각 자동 기록`, icon: 'alert-triangle' });
        }
      } else {
        setToast({ text: `${checkIn} 출근 체크인 완료`, icon: 'check' });
      }
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

    if (window.apiMutatePapaData) {
      window.apiMutatePapaData(data => {
        if (overtimeMins > 0) {
          if (!data.monthlyOvertime) data.monthlyOvertime = {};
          data.monthlyOvertime[currentUserId] = (data.monthlyOvertime[currentUserId] || 0) + overtimeMins;
        }

        if (!data.attendance) data.attendance = {};
        const prevAtt = data.attendance[currentUserId] || {};
        let sessionSecs = 0;
        if (prevAtt.checkIn) {
          const [ch, cm] = prevAtt.checkIn.split(':').map(Number);
          const baseSecs = ch * 3600 + cm * 60;
          const currentSecs = h * 3600 + m * 60 + kstTime.getSeconds();
          sessionSecs = Math.max(0, currentSecs - baseSecs);
        }
        
        data.attendance[currentUserId] = {
          ...prevAtt,
          status: 'checked_out',
          accumulatedSecs: (prevAtt.accumulatedSecs || 0) + sessionSecs,
          checkIn: null,
          checkedOutAt: now.toISOString(),
        };
      });
    }
    setShowCheckOutConfirm(false);
    if (overtimeMins > 0) {
      setToast({ text: `오늘 수고하셨어요 👋 (야근 ${Math.floor(overtimeMins / 60)}h ${overtimeMins % 60}m 적립)`, icon: 'moon' });
    } else {
      setToast({ text: '오늘 수고하셨어요 👋', icon: 'check' });
    }
  };

  const handleChangeLunch = (mins) => {
    if (mins === 60) {
      if (window.apiMutatePapaData) {
        window.apiMutatePapaData(data => {
          if (!data.attendance) data.attendance = {};
          if (data.attendance[currentUserId]) {
            data.attendance[currentUserId].lunch = 60;
            data.attendance[currentUserId].lunchSlot = null;
            data.attendance[currentUserId].lunchStatus = null;
          }
        });
      }
      setToast({ text: '점심 1시간으로 변경', icon: 'coffee' });
    } else {
      // 90 minutes → must go through approval
      setShowLunchForm(true);
    }
  };

  const handleSubmitLunch = ({ slot, note, assignedSenior }) => {
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

    if (window.apiMutatePapaData) {
      window.apiMutatePapaData(data => {
        if (!data.attendance) data.attendance = {};
        if (!data.attendance[currentUserId]) data.attendance[currentUserId] = {};
        
        data.attendance[currentUserId].lunch = 90;
        data.attendance[currentUserId].lunchSlot = slot;
        data.attendance[currentUserId].lunchStatus = me.role === 'admin' ? 'approved' : 'pending';
        data.attendance[currentUserId].lunchNote = note;

        if (!data.approvals) data.approvals = [];
        data.approvals.unshift(newAppr);
      });
    }

    setShowLunchForm(false);
    if (me.role === 'admin') {
      setToast({ text: '점심 1.5h 자동 승인', icon: 'check' });
    } else {
      const seniorName = assignedSenior ? getEmployee(assignedSenior).name : '결재권자';
      setToast({ text: `${seniorName}에게 점심 1.5h 신청 완료`, icon: 'coffee' });
    }
  };

  const handleSubmitAdditionalWork = (payload) => {
    if (payload.type === 'overtime') {
      const tl = window.PAPA_DATA.employees.find(e => e.team === me.team && e.role === 'senior' && e.id !== me.id);
      const assignedSenior = tl ? tl.id : 'kh';
      const targetIsAdmin = assignedSenior === 'kh';
      const newAppr = {
        id: `overtime${Date.now()}`,
        empId: currentUserId,
        type: '야근',
        subtype: 'overtime',
        start: window.PAPA_DATA.today.date,
        end: window.PAPA_DATA.today.date,
        days: 0,
        reason: payload.reason,
        appliedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        stage: me.role === 'admin' ? 'approved' : (targetIsAdmin ? 'pending_admin' : 'pending_senior'),
        isOvertime: true,
        assignedSenior: assignedSenior,
      };

      if (window.apiMutatePapaData) {
        window.apiMutatePapaData(data => {
          if (!data.approvals) data.approvals = [];
          data.approvals.unshift(newAppr);
        });
      }

      setShowAdditionalWorkForm(false);
      if (me.role === 'admin') {
        setToast({ text: '야근 자동 승인', icon: 'check' });
      } else {
        const seniorName = getEmployee(assignedSenior).name;
        setToast({ text: `${seniorName}에게 야근 승인 요청 완료`, icon: 'moon' });
      }
    } else if (payload.type === 'weekend') {
      const director = window.PAPA_DATA.employees.find(e => e.department === me.department && ['디렉터', '대표이사'].includes(e.title) && e.id !== me.id);
      const assignedSenior = director ? director.id : 'kh';
      const targetIsAdmin = assignedSenior === 'kh';
      const newAppr = {
        id: `weekend${Date.now()}`,
        empId: currentUserId,
        type: '휴일 근무',
        subtype: 'weekend_work',
        start: payload.date,
        end: payload.date,
        days: payload.duration === 'halfday' ? 0.5 : 1,
        duration: payload.duration,
        reason: payload.reason,
        appliedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        stage: me.role === 'admin' ? 'approved' : (targetIsAdmin ? 'pending_admin' : 'pending_senior'),
        isWeekendWork: true,
        assignedSenior: assignedSenior,
      };

      if (window.apiMutatePapaData) {
        window.apiMutatePapaData(data => {
          if (!data.approvals) data.approvals = [];
          data.approvals.unshift(newAppr);
        });
      }

      setShowAdditionalWorkForm(false);
      if (me.role === 'admin') {
        setToast({ text: '휴일 근무 자동 승인', icon: 'check' });
      } else {
        const seniorName = getEmployee(assignedSenior).name;
        setToast({ text: `${seniorName}에게 휴일 근무 승인 요청 완료`, icon: 'briefcase' });
      }
    }
  };

  const handleSubmitRecheckIn = ({ reason }) => {
    const isExecutive = ['대표이사', '디렉터'].includes(me.title) || me.role === 'admin';
    const tl = window.PAPA_DATA.employees.find(e => e.team === me.team && e.role === 'senior' && e.id !== me.id);
    const assignedSenior = tl ? tl.id : 'kh';
    const targetIsAdmin = assignedSenior === 'kh';
    const newAppr = {
      id: `recheckin${Date.now()}`,
      empId: currentUserId,
      type: '재출근',
      subtype: 'recheckin',
      start: window.PAPA_DATA.today.date,
      end: window.PAPA_DATA.today.date,
      days: 0,
      reason: reason,
      appliedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      stage: isExecutive ? 'approved' : (targetIsAdmin ? 'pending_admin' : 'pending_senior'),
      isRecheckIn: true,
      assignedSenior: assignedSenior,
    };

    if (window.apiMutatePapaData) {
      window.apiMutatePapaData(data => {
        if (!data.approvals) data.approvals = [];
        data.approvals.unshift(newAppr);
        
        if (isExecutive) {
          if (!data.attendance) data.attendance = {};
          if (!data.attendance[currentUserId]) data.attendance[currentUserId] = {};
          data.attendance[currentUserId].status = 'working';
        }
      });
    }

    setShowRecheckInForm(false);
    if (isExecutive) {
      setToast({ text: '재출근 자동 승인', icon: 'check' });
    } else {
      const seniorName = getEmployee(assignedSenior).name;
      setToast({ text: `${seniorName}에게 재출근 승인 요청 완료`, icon: 'log-in' });
    }
  };

  const handleApprove = (id) => {
    if (window.apiMutatePapaData) {
      window.apiMutatePapaData(data => {
        if (!data.approvals) return;
        
        const aIndex = data.approvals.findIndex(a => a.id === id);
        if (aIndex === -1) return;
        const a = { ...data.approvals[aIndex] };
        
        const meEmp = getEmployee(currentUserId);
        const applicant = getEmployee(a.empId);
        
        const getLeaveCC = () => {
          const tl = window.PAPA_DATA.employees.find(e => e.team === applicant.team && e.role === 'senior' && e.id !== applicant.id);
          return tl ? [tl.id] : [];
        };

        const getOvertimeCC = () => {
          const directors = window.PAPA_DATA.employees.filter(e => e.department === 'EX').map(e => e.id);
          return Array.from(new Set(['kh', ...directors])).filter(id => id !== currentUserId && id !== applicant.id);
        };

        // Lunch & Overtime requests only need senior approval (not a full two-stage flow)
        if (a.isLunch) {
          if (!data.attendance) data.attendance = {};
          if (!data.attendance[a.empId]) data.attendance[a.empId] = {};
          data.attendance[a.empId].lunchStatus = 'approved';
          
          a.stage = 'approved';
          a.approvedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');
          a.approvedBy = currentUserId;
        }
        else if (a.isOvertime) {
          a.stage = 'approved';
          a.approvedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');
          a.approvedBy = currentUserId;
          a.cc = getOvertimeCC();
        }
        else if (a.isRecheckIn) {
          if (!data.attendance) data.attendance = {};
          if (!data.attendance[a.empId]) data.attendance[a.empId] = {};
          data.attendance[a.empId].status = 'working';

          a.stage = 'approved';
          a.approvedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');
          a.approvedBy = currentUserId;
          a.cc = getOvertimeCC();
        }
        else if (a.isWeekendWork) {
          a.stage = 'approved';
          a.approvedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');
          a.approvedBy = currentUserId;
          a.cc = getOvertimeCC();
        }
        else if (a.isOutsideWork) {
          if (a.start === data.today.date) {
            if (!data.attendance) data.attendance = {};
            const addSecs = a.hours * 3600;
            const affectedIds = [a.empId, ...(a.coworkers || [])];
            affectedIds.forEach(eid => {
              if (!data.attendance[eid]) data.attendance[eid] = {};
              data.attendance[eid].accumulatedSecs = (data.attendance[eid].accumulatedSecs || 0) + addSecs;
            });
          }
          a.stage = 'approved';
          a.approvedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');
          a.approvedBy = currentUserId;
          a.cc = getLeaveCC();
        }
        else if (meEmp.role === 'senior' && a.stage === 'pending_senior') {
          a.stage = 'pending_admin';
          a.seniorApprovedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');
        }
        else if (meEmp.role === 'admin') {
          a.stage = 'approved';
          a.approvedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');
          a.approvedBy = currentUserId;
          a.cc = getLeaveCC();
        }
        
        data.approvals[aIndex] = a;
      });
    }
    setToast({ text: '결재 승인 완료', icon: 'check' });
  };

  const handleReject = (id, msg) => {
    const now = new Date();
    const ts = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;
    
    if (window.apiMutatePapaData) {
      window.apiMutatePapaData(data => {
        if (!data.approvals) return;
        const aIndex = data.approvals.findIndex(a => a.id === id);
        if (aIndex === -1) return;
        
        data.approvals[aIndex].stage = 'rejected';
        data.approvals[aIndex].rejectedAt = ts;
        data.approvals[aIndex].rejectedBy = currentUserId;
        data.approvals[aIndex].rejectReason = msg || data.approvals[aIndex].rejectReason;
      });
    }
    setToast({ text: '결재 반려 처리', icon: 'x' });
  };

  const handleSubmitOutsideWork = (payload) => {
    const assignedSenior = 'kh';
    const targetIsAdmin = true;
    const newAppr = {
      id: `o${Date.now()}`,
      empId: currentUserId,
      type: '외근',
      hours: payload.hours,
      coworkers: payload.coworkers,
      start: payload.date,
      end: payload.date,
      days: 0,
      reason: payload.reason || '—',
      appliedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      stage: me.role === 'admin' ? 'approved' : 'pending_admin',
      assignedSenior: assignedSenior,
      isOutsideWork: true,
    };
    if (window.apiMutatePapaData) {
      window.apiMutatePapaData(data => {
        if (!data.approvals) data.approvals = [];
        data.approvals.unshift(newAppr);
        
        if (me.role === 'admin') {
          if (payload.date === data.today.date) {
            if (!data.attendance) data.attendance = {};
            const addSecs = payload.hours * 3600;
            const affectedIds = [currentUserId, ...(payload.coworkers || [])];
            affectedIds.forEach(id => {
              if (!data.attendance[id]) data.attendance[id] = {};
              data.attendance[id].accumulatedSecs = (data.attendance[id].accumulatedSecs || 0) + addSecs;
            });
          }
        }
      });
    }

    setShowOutsideWorkForm(false);
    
    if (me.role === 'admin') {
      setToast({ text: '외근 자동 승인', icon: 'check' });
    } else {
      setToast({ text: '외근 신청이 접수되었어요', icon: 'car' });
    }
  };

  const handleSubmitLeave = (payload) => {
    const assignedSenior = 'kh';
    const targetIsAdmin = true;
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
      stage: me.role === 'admin' ? 'approved' : 'pending_admin',
      assignedSenior: assignedSenior,
    };
    
    if (window.apiMutatePapaData) {
      window.apiMutatePapaData(data => {
        if (!data.approvals) data.approvals = [];
        data.approvals.unshift(newAppr);
      });
    }

    setShowLeaveForm(false);
    if (me.role === 'admin') {
      setToast({ text: '휴가 자동 승인', icon: 'check' });
    } else {
      setToast({ text: '휴가 신청이 접수되었어요', icon: 'send' });
    }
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

  // Compute dynamic calendar events from approvals + static late events
  const calendarEvents = React.useMemo(() => {
    // Keep only late events from static data (or anything else not related to leaves)
    const base = window.PAPA_DATA.events.filter(e => e.type === 'late' || e.type === 'birthday');
    
    // Generate events for all approved leaves
    const leaveEvents = [];
    approvals.forEach(a => {
      if (a.isLunch || a.isOvertime || a.stage !== 'approved') return;
      
      const s = new Date(a.start);
      const e = new Date(a.end);
      let typeStr = a.type === '외근' ? `${a.hours}시간 외근` : a.type;
      let evType = a.type === '반차' ? 'halfday' : (a.type === '외근' ? 'holiday' : 'vacation');
      
      if (a.isWeekendWork) {
        typeStr = a.duration === 'halfday' ? '주말 반일 근무' : '주말 종일 근무';
        evType = 'halfday';
        const addEventFor = (id) => {
          const eEmp = window.PAPA_DATA.employees.find(x => x.id === id);
          if (!eEmp) return;
          leaveEvents.push({
            date: a.start,
            type: evType,
            empId: id,
            label: `${eEmp.name} ${typeStr}`,
            reason: a.reason,
          });
        };
        addEventFor(a.empId);
        return;
      }

      let cur = new Date(s);
      while (cur <= e) {
        const wd = cur.getDay();
        if (wd !== 0 && wd !== 6) { // skip weekends
          const addEventFor = (id) => {
            const eEmp = window.PAPA_DATA.employees.find(x => x.id === id);
            if (!eEmp) return;
            leaveEvents.push({
              date: cur.toISOString().slice(0, 10),
              type: evType,
              empId: id,
              label: `${eEmp.name} ${typeStr}`,
              reason: a.reason,
            });
          };

          addEventFor(a.empId);
          if (a.isOutsideWork && a.coworkers) {
            a.coworkers.forEach(c => addEventFor(c));
          }
        }
        cur.setDate(cur.getDate() + 1);
      }
    });
    
    return [...base, ...leaveEvents];
  }, [approvals]);

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
              onShowAdditionalWorkForm={() => setShowAdditionalWorkForm(true)}
              onShowOutsideWorkForm={() => setShowOutsideWorkForm(true)}
              onShowRecheckInForm={() => {
                const isExecutive = ['대표이사', '디렉터'].includes(me.title) || me.role === 'admin';
                if (isExecutive) {
                  handleSubmitRecheckIn({ reason: '임원 재출근' });
                } else {
                  setShowRecheckInForm(true);
                }
              }}
              onSelectMember={setSelectedMember}
            />
          )}
          {active === 'calendar' && <CalendarPage events={calendarEvents} />}
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
          {active === 'attendance' && (me.role === 'admin' || me.role === 'hr') && (
            <AttendanceReviewPage />
          )}
          {active === 'quote' && (me.role === 'admin' || me.role === 'senior') && (
            <QuotePage currentUserId={currentUserId} />
          )}
          {active !== 'dashboard' && active !== 'calendar' && active !== 'policy' && active !== 'org' && active !== 'inbox' && active !== 'payroll' && active !== 'cert' && active !== 'settings' && active !== 'attendance' && active !== 'quote' && (
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
      {showAdditionalWorkForm && <AdditionalWorkRequestForm
        me={me}
        onClose={() => setShowAdditionalWorkForm(false)}
        onSubmit={handleSubmitAdditionalWork}
      />}
      {showOutsideWorkForm && <OutsideWorkRequestForm
        me={me}
        onClose={() => setShowOutsideWorkForm(false)}
        onSubmit={handleSubmitOutsideWork}
      />}
      {showRecheckInForm && <RecheckInRequestForm
        me={me}
        onClose={() => setShowRecheckInForm(false)}
        onSubmit={handleSubmitRecheckIn}
      />}
      <Toast toast={toast} onDismiss={() => setToast(null)} />

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
              background: 'var(--primary-soft, rgba(74,124,255,.14))',
              color: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Icon name="heart" size={24} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.02em' }}>
              오늘도 수고하셨습니다.
            </div>
            <div style={{ fontSize: 15, color: 'var(--ink-soft)', marginTop: 10, lineHeight: 1.5, fontWeight: 500 }}>
              퇴근하시겠습니까?
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
const DashboardPage = ({
  me, myRole, attendance, approvals, lateCounter, lateLogs, penaltyMode, clockSecs,
  onCheckIn, onCheckOut, onChangeLunch, onApprove, onReject, onShowLeaveForm, onShowAdditionalWorkForm, onShowOutsideWorkForm, onShowRecheckInForm, onSelectMember }) => {
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
          onShowAdditionalWorkForm={onShowAdditionalWorkForm}
          approvals={approvals}
          onShowOutsideWorkForm={onShowOutsideWorkForm}
          onShowRecheckInForm={onShowRecheckInForm}
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
        <div style={{ gridColumn: isSeniorOrAdmin ? 'span 8' : 'span 12' }}>
          <TeamStatus
            attendance={attendance}
            employees={data.employees}
            lateCounter={lateCounter}
            onSelectMember={onSelectMember}
          />
        </div>
        {isSeniorOrAdmin && (
          <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <ApprovalPending
              role={myRole}
              approvals={approvals}
              currentUserId={me}
              onApprove={onApprove}
              onReject={onReject}
            />
          </div>
        )}
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
  const [deviceLockEnabled, setDeviceLockEnabled] = React.useState(data.deviceLockEnabled !== false);

  const toggleDeviceLock = () => {
    const next = !deviceLockEnabled;
    setDeviceLockEnabled(next);
    data.deviceLockEnabled = next;
    if (!next) {
      // 기기 잠금 해제 시 모든 기기 귀속 초기화
      try { localStorage.removeItem('papa_device_owner'); } catch {}
    }
    if (window.savePapaData) window.savePapaData();
    onToast && onToast({ text: next ? '기기 잠금이 활성화되었습니다.' : '기기 잠금이 비활성화되었습니다.', icon: next ? 'lock' : 'unlock' });
  };

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
          서버 설정
        </h1>
        <div style={{ marginTop: 8, color: 'var(--ink-mute)', fontSize: 14, fontWeight: 500, lineHeight: 1.5 }}>
          보안 및 접속 관련 설정을 관리합니다.
        </div>
      </div>

      {/* Device Lock Toggle */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: deviceLockEnabled ? 'linear-gradient(135deg, #3A6FF0, #5B8BF5)' : 'var(--bg)',
            color: deviceLockEnabled ? 'white' : 'var(--ink-mute)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all .2s',
          }}>
            <Icon name={deviceLockEnabled ? 'lock' : 'unlock'} size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-.01em' }}>기기 잠금 (대리 출근 방지)</div>
            <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 4, lineHeight: 1.5 }}>
              {deviceLockEnabled
                ? '활성화됨 — 한 기기에서 한 명만 로그인 가능합니다. 대리 출근을 방지합니다.'
                : '비활성화됨 — 동일 기기에서 여러 계정으로 자유롭게 로그인할 수 있습니다. (테스트 모드)'}
            </div>
          </div>
          <button
            onClick={toggleDeviceLock}
            style={{
              width: 56, height: 30, borderRadius: 999, padding: 3,
              background: deviceLockEnabled ? 'var(--accent)' : 'var(--line)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center',
              justifyContent: deviceLockEnabled ? 'flex-end' : 'flex-start',
              transition: 'background .2s',
            }}
          >
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: 'white',
              boxShadow: '0 2px 6px rgba(0,0,0,.15)',
              transition: 'all .2s',
            }} />
          </button>
        </div>
        {deviceLockEnabled && (
          <div style={{
            padding: '14px 28px', borderTop: '1px solid var(--line-soft)',
            background: 'var(--bg)', fontSize: 12, color: 'var(--ink-mute)', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Icon name="info" size={13} />
            관리자(admin)와 인사관리(hr) 계정은 기기 잠금과 관계없이 어디서든 로그인 가능합니다.
          </div>
        )}
      </div>

      {/* Host restriction - existing section */}
      <div style={{ marginTop: 8 }}>
        <div className="h2" style={{ marginBottom: 4 }}>서버 접속 제한</div>
        <div style={{ color: 'var(--ink-mute)', fontSize: 13, fontWeight: 500, lineHeight: 1.5 }}>
          등록된 호스트(IP 또는 도메인)에서 접속할 때만 로그인이 가능합니다.
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
    // We no longer use syncTick to force remount.
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

  // We no longer force a remount (key=syncTick) because App component manages its own internal state sync.
  return <App />;
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<PapaRoot />);
