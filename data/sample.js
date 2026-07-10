// Sample data for PAPA HR system
const defaultData = {
  employees: [
    { id: 'kh', name: '김규호', en: 'Kyuho',   role: 'admin',  title: '대표이사',     department: 'EX', team: '', joined: '2016-03-15', initials: 'KH', color: 'av-0', birthday: '05-22', email: 'song@foundfounded.com',   phone: '010-2214-3391' },
  ],

  // Title rank order for org chart grouping
  titleOrder: ['대표이사', '디렉터', '팀장', '랩장', '시니어디자이너', '디자이너', '인턴'],
  departments: [
    { key: 'EX', label: '디렉터', full: 'Director', desc: '경영 및 총괄' },
    { key: 'ID', label: 'ID', full: 'Industrial Design', desc: '제품 · 산업 디자인' },
    { key: 'VD', label: 'VD', full: 'Visual Design',     desc: '디지털 · UX 비주얼' },
    { key: 'AI', label: 'AI', full: 'AI Lab',            desc: '인공지능 연구 및 개발' },
  ],
  teams: [
    { key: 'ID 1팀', dept: 'ID' },
    { key: 'ID 2팀', dept: 'ID' },
    { key: 'VD팀', dept: 'VD' },
    { key: 'AI LAB', dept: 'AI' }
  ],

  // Today is Tuesday, Apr 21 2026
  today: {
    date: '2026-04-21',
    weekday: '화요일',
    label: '4월 21일',
    monthKr: '4월',
  },

  // Attendance for today, per employee
  // status: 'working' | 'not_checked_in' | 'vacation' | 'halfday'
  attendance: {},

  // Attendance history for the month (Mock data for Attendance Review)
  attendanceHistory: {},

  // Late logs — only seniors & admin can view full feed
  lateLogs: [],

  // Late counter per employee (0-5)
  lateCounter: {},

  // Monthly overtime counter per employee (in minutes)
  monthlyOvertime: {},

  // Penalty mode: 5회 누적 시 다음 날부터 7일간 10시 출근 고정
  penaltyMode: {},

  // Leave balance per employee
  leaveBalance: {
    kh: { total: 15, used: 2,  refresh: 5, refreshUsed: 0, tenure: 10 },
  },

  // Pending approvals
  approvals: [],

  // Upcoming events (this + next week) for mini calendar
  events: [
    { date: '2026-04-21', type: 'late',     empId: 'jh', label: '지각 47분' },
    { date: '2026-04-21', type: 'birthday', empId: 'jh', label: '지훈 생일' },
    { date: '2026-04-21', type: 'halfday',  empId: 'hy', label: '하윤 반차(오후)' },
    { date: '2026-04-21', type: 'vacation', empId: 'dh', label: '도현 연차' },
    { date: '2026-04-24', type: 'halfday',  empId: 'jh', label: '지훈 반차(대기)' },
    { date: '2026-04-29', type: 'vacation', empId: 'yj', label: '유진 연차(대기)' },
    { date: '2026-04-30', type: 'vacation', empId: 'yj', label: '유진 연차(대기)' },
    { date: '2026-05-04', type: 'vacation', empId: 'hy', label: '하윤 연차' },
  ],

  // Team lunch log (for today)
  lunchLog: [
    { empId: 'sy', duration: 90, note: '인근 파스타 집에서 기획 미팅 겸 런치해요 🍝' },
    { empId: 'kh', duration: 60, note: null },
    { empId: 'mj', duration: 60, note: null },
    { empId: 'jh', duration: 60, note: null },
    { empId: 'hy', duration: 60, note: null },
  ],

  // Policy board posts (admin-editable)
  policyPosts: [
    {
      id: 'p1',
      title: '출퇴근 시간 안내',
      category: '근무시간',
      pinned: true,
      author: '송규호',
      authorId: 'kh',
      updatedAt: '2026-07-10',
      body: `[월요일 — 단축근무]\n• 출근: 13:00 / 퇴근: 19:00 (6시간 고정)\n• 오전은 개인 일정·병원·은행 등을 자유롭게 처리하세요.\n\n[화~금요일 — 자율출근]\n• 출근: 9:00 ~ 10:00 사이 자율 출근\n• 퇴근: 18:00 이후 퇴근 가능\n• 출근시간 + 9시간(점심 1시간 포함) 후 퇴근\n\n예) 9:00 출근 → 18:00 퇴근\n예) 10:00 출근 → 19:00 퇴근`,
    },
    {
      id: 'p2',
      title: '주 40시간 근무 원칙',
      category: '근무시간',
      pinned: true,
      author: '송규호',
      authorId: 'kh',
      updatedAt: '2026-07-10',
      body: `주 40시간을 원칙으로 합니다.\n\n• 월요일 단축근무(6시간)와 조기 퇴근 등으로 모자라는 시간은 바쁜 날 연장 근무 시간으로 대체 사용됩니다.\n• 월 고정 OT 20시간이 포함되어 있으며, 주 40시간 + 월 20시간(고정OT)을 초과하는 근무는 근태리뷰에서 관리됩니다.\n\n[금요일 퇴근 시]\n• 퇴근 시 이번 주 총 근무시간이 40시간에 도달했는지 반드시 확인합니다.\n• 40시간 미달로 퇴근 시 팀장, 디렉터, 대표이사에게 자동 알림이 발송됩니다.\n• 근무 외 시간이 있었다면 자진하여 입력하고 본인의 근로시간에서 차감할 수 있습니다.`,
    },
    {
      id: 'p3',
      title: '9시 이전 조기출근 및 22시 이후 야근',
      category: '근무시간',
      pinned: true,
      author: '송규호',
      authorId: 'kh',
      updatedAt: '2026-07-10',
      body: `[9시 이전 조기출근]\n• 사전에 "조기출근" 결재를 신청하여 승인받지 않은 경우, 9시 이전 출근은 근무시간으로 인정되지 않습니다.\n• 미승인 조기출근 시 근무시간 계산은 9:00부터 시작됩니다.\n\n[22시 이후 야근]\n• 사전에 "야근" 결재를 신청하여 승인받지 않은 경우, 22시 이후 근무는 근로시간으로 인정되지 않습니다.\n• 미승인 야근 시 근무시간은 22:00까지만 인정됩니다.\n• 승인된 야근은 월 야근 시간으로 누적 적립됩니다.`,
    },
    {
      id: 'p4',
      title: '점심 유연제 (1시간 / 1.5시간)',
      category: '근무시간',
      pinned: false,
      author: '송규호',
      authorId: 'kh',
      updatedAt: '2026-07-10',
      body: `점심 시간은 기본 1시간이며, 사전 신청 시 1.5시간으로 연장할 수 있습니다.\n\n[1.5시간 사용 가능 시간대]\n• 12:00 – 13:30\n• 12:30 – 14:00\n\n오전 11시 이전까지 팀장에게 결재 신청해야 하며, 승인 후 사용 가능합니다.\n같은 팀 내 동시에 1.5시간을 사용하는 인원이 너무 많을 경우 팀장 판단으로 조정될 수 있습니다.`,
    },
    {
      id: 'p5',
      title: '지각 카운터 및 벌칙 근태',
      category: '근태',
      pinned: false,
      author: '송규호',
      authorId: 'kh',
      updatedAt: '2026-07-10',
      body: `[지각 기준]\n• 화~금: 10:00 초과 시 자동 지각 기록\n• 월요일: 13:30 초과 시 자동 지각 기록\n\n[벌칙 근태]\n• 월별 지각 5회 누적 시 다음 날부터 7일간 "10시 출근 고정" 벌칙 적용\n• 벌칙 기간 중 추가 지각 시 인사 면담이 진행됩니다.\n• 매월 1일에 카운터는 0으로 초기화됩니다.`,
    },
    {
      id: 'p6',
      title: '연차 · 반차 · 리프레시 휴가',
      category: '휴가',
      pinned: false,
      author: '송규호',
      authorId: 'kh',
      updatedAt: '2026-07-10',
      body: `연차: 입사 1년 차 15일 / 2년 차부터 1년마다 +1일 (최대 25일)\n반차: 오전 / 오후 중 선택, 0.5일 차감\n리프레시: 별도 5일 (연차와 별도, 분기당 1회 권장)\n\n주말은 휴가 일수에서 자동 제외됩니다.\n시작 3영업일 전까지 신청을 권장합니다. 긴급 사유는 팀장과 별도 협의해주세요.`,
    },
    {
      id: 'p7',
      title: '휴일 근무 수당',
      category: '급여',
      pinned: false,
      author: '송규호',
      authorId: 'kh',
      updatedAt: '2026-07-10',
      body: `토·일 또는 공휴일 근무 시 수당이 지급됩니다.\n\n• 반일 (4시간) — 80,000원\n• 종일 (8시간) — 160,000원\n\n사전에 디렉터 또는 대표이사의 결재가 있어야 하며, 승인되지 않은 자발적 근무는 수당 대상이 아닙니다.`,
    },
  ],

  // Policy excerpts (summary cards)
  policyHighlights: [
    { key: 'flex',    title: '출퇴근 시간',   body: '월 13–19시 · 화~금 9–10시 자율출근' },
    { key: 'weekly',  title: '주 40시간',     body: '금요일 퇴근 시 확인 · 미달 시 자동 알림' },
    { key: 'late',    title: '지각 카운터',   body: '5회 도달 시 1주 10시 출근 고정' },
    { key: 'holiday', title: '휴일 근무',     body: '반일 80,000원 · 종일 160,000원' },
  ],

  // External users (not part of org chart)
  externalUsers: [],

  // Login accounts — email → { pw, userId }
  accounts: {
    'song@foundfounded.com':      { pw: '0000', userId: 'kh' },
  },

  // Demo login hints shown on login screen
  loginHints: [],

  // Personal profiles for certificates (주민번호 앞자리 등)
  profiles: {
    kh: { rrn: '790522-1', address: '서울특별시 용산구 한남대로 42, 301호' },
  },

  // Payroll schema — earnings/deductions item names (accountant can add more)
  payrollSchema: {
    earnings: ['기본급', '식대/복리후생', '야근/연장수당', '직책수당', '상여금'],
    deductions: ['국민연금', '건강보험', '고용보험', '장기요양보험', '소득세', '지방소득세'],
  },

  // Payroll by month → empId → { earnings:{}, deductions:{} }
  payroll: {},

  // Employment certificate template (admin-editable)
  certTemplate: {
    docTitle: '재 직 증 명 서',
    company: 'found / Founded (파운드파운디드)',
    ceo: '김규호',
    bizNo: '214-88-01672',
    address: '서울특별시 용산구 한남대로 42, found/Founded',
    tel: '02-3785-1620',
    purposes: ['은행 제출용', '관공서 제출용', '비자/출입국용', '병원 제출용', '기타'],
    bodyTemplate: '위 사람은 본사에 위와 같이 재직하고 있음을 증명합니다.',
    issuerTitle: '대표이사',
    showSalary: false,
  },

  // 관리자 지정 허용 호스트 목록 — 이 목록에 있는 도메인/IP에서만 로그인 가능
  // 빈 배열이면 모든 호스트에서 로그인 허용
  allowedHosts: ['localhost', '127.0.0.1', 'kyuhowen-spec.github.io', 'fafaman.vercel.app'],
};

window.PAPA_DATA = null;

window.initPapaData = async () => {
  // Wait for firebase initialization
  while (!window.firebaseDb) {
    await new Promise(r => setTimeout(r, 50));
  }
  const db = window.firebaseDb;
  const { doc, getDoc, setDoc, onSnapshot } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
  
  const getSeoulDateInfo = () => {
    const now = new Date();
    const kstTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (9 * 3600000));
    const yyyy = kstTime.getFullYear();
    const mm = String(kstTime.getMonth() + 1).padStart(2, '0');
    const dd = String(kstTime.getDate()).padStart(2, '0');
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const weekday = days[kstTime.getDay()];
    
    return {
      date: `${yyyy}-${mm}-${dd}`,
      weekday: weekday,
      dayIndex: kstTime.getDay(), // 0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토
      label: `${kstTime.getMonth() + 1}월 ${kstTime.getDate()}일`,
      monthKr: `${kstTime.getMonth() + 1}월`
    };
  };

  const docRef = doc(db, 'workspaces', 'main');
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    let dataObj = docSnap.data();
    

    const rawStr = JSON.stringify(dataObj);
    if (rawStr.includes('foundfounded.kr')) {
      dataObj = JSON.parse(rawStr.replace(/foundfounded\.kr/g, 'foundfounded.com'));
      await setDoc(docRef, dataObj);
    }
    let migrated = false;
    // Migration: 대표 계정 이메일 변경 (kyuho → song)
    if (dataObj.accounts) {
      if (dataObj.accounts['kyuho@foundfounded.com']) {
        delete dataObj.accounts['kyuho@foundfounded.com'];
        migrated = true;
      }
      if (!dataObj.accounts['song@foundfounded.com']) {
        dataObj.accounts['song@foundfounded.com'] = { pw: '0000', userId: 'kh', isInitial: true };
        migrated = true;
      }
    }
    const khEmp = dataObj.employees?.find(e => e.id === 'kh');
    // Migration: 더미 급여 데이터 1회성 제거 (노무법인 미입력 상태)
    if (!dataObj._payrollCleared && dataObj.payroll && Object.keys(dataObj.payroll).length > 0) {
      dataObj.payroll = {};
      dataObj._payrollCleared = true;
      migrated = true;
    }
    if (khEmp && khEmp.email !== 'song@foundfounded.com') {
      khEmp.email = 'song@foundfounded.com';
      migrated = true;
    }
    // Migration: ensure '팀장', '랩장' are in titleOrder
    if (!dataObj.titleOrder || !dataObj.titleOrder.includes('팀장') || !dataObj.titleOrder.includes('랩장')) {
      dataObj.titleOrder = defaultData.titleOrder;
      migrated = true;
    }
    // Migration: ensure department and team split
    if (!dataObj.departments || dataObj.departments[0].label !== '디렉터') {
      dataObj.departments = defaultData.departments;
      dataObj.teams = defaultData.teams;
      
      dataObj.employees.forEach(emp => {
        if (!emp.department) {
          emp.department = emp.team || 'ID';
          if (['대표이사', '디렉터'].includes(emp.title)) {
            if (emp.title === '대표이사') emp.department = 'EX';
            emp.team = '';
          } else {
            if (emp.department === 'ID') emp.team = 'ID 1팀';
            else if (emp.department === 'VD') emp.team = 'VD팀';
            else if (emp.department === 'AI') emp.team = 'AI LAB';
          }
        }
      });
      migrated = true;
    }
    
    // Migration: ensure all employees have empNo
    const yearCounts = {};
    dataObj.employees.forEach(emp => {
      if (!emp.empNo && emp.joined) {
        const year = emp.joined.substring(2, 4);
        if (!yearCounts[year]) {
          // find max existing seq for this year
          const sameYear = dataObj.employees.filter(e => e.empNo && e.empNo.startsWith(year));
          const maxSeq = sameYear.reduce((max, e) => {
            const seq = parseInt(e.empNo.substring(2), 10);
            return isNaN(seq) ? max : (seq > max ? seq : max);
          }, 0);
          yearCounts[year] = maxSeq;
        }
        yearCounts[year]++;
        emp.empNo = `${year}${String(yearCounts[year]).padStart(3, '0')}`;
        migrated = true;
      }
    });

    const archiveAttendance = (d, oldDateStr) => {
      if (!d.attendance || !oldDateStr) return;
      const monthStr = oldDateStr.slice(0, 7);
      if (!d.attendanceHistory) d.attendanceHistory = {};
      if (!d.attendanceHistory[monthStr]) d.attendanceHistory[monthStr] = {};
      const historyMonth = d.attendanceHistory[monthStr];
      Object.entries(d.attendance).forEach(([empId, att]) => {
        if (!att || (att.status === 'not_checked_in' && !att.accumulatedSecs)) return;
        let hrs = 0;
        if (att.accumulatedSecs) hrs = att.accumulatedSecs / 3600;
        else if (att.checkIn) {
          const [h, m] = att.checkIn.split(':').map(Number);
          hrs = Math.max(0, 24 - (h + m/60));
        }
        hrs = parseFloat(hrs.toFixed(1));
        if (hrs > 0) {
          if (!historyMonth[empId]) historyMonth[empId] = { days: 0, hours: 0, overtime: 0, daily: [] };
          historyMonth[empId].days += 1;
          historyMonth[empId].hours = parseFloat((historyMonth[empId].hours + hrs).toFixed(1));
          historyMonth[empId].daily.push({
            date: oldDateStr,
            in: att.firstCheckIn || att.checkIn,
            out: att.checkedOutAt ? new Date(att.checkedOutAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }) : null,
            hours: hrs
          });
        }
      });
    };

    const seoulToday = getSeoulDateInfo();
    if (!dataObj.lastClearedDate || dataObj.lastClearedDate !== seoulToday.date) {
      if (dataObj.lastClearedDate) {
        archiveAttendance(dataObj, dataObj.lastClearedDate);
      }
      dataObj.today = seoulToday;
      dataObj.lastClearedDate = seoulToday.date;
      dataObj.attendance = {}; // Clear attendance for the new day
      migrated = true;
    } else {
      dataObj.today = seoulToday;
    }

    if (migrated) {
      await setDoc(docRef, dataObj);
    }

    window.PAPA_DATA = dataObj;
  } else {
    window.PAPA_DATA = defaultData;
    window.PAPA_DATA.today = getSeoulDateInfo();
    await setDoc(docRef, window.PAPA_DATA);
  }

  // Realtime Sync Listener
  onSnapshot(docRef, { includeMetadataChanges: true }, (docSnap) => {
    if (docSnap.metadata.hasPendingWrites) return; // ignore local changes
    if (docSnap.exists()) {
      const docData = docSnap.data();
      const seoulToday = getSeoulDateInfo();
      
      if (!docData.lastClearedDate || docData.lastClearedDate !== seoulToday.date) {
        if (docData.lastClearedDate) {
          archiveAttendance(docData, docData.lastClearedDate);
        }
        docData.today = seoulToday;
        docData.lastClearedDate = seoulToday.date;
        docData.attendance = {};
        window.PAPA_DATA = docData;
        window.savePapaData();
      } else {
        docData.today = seoulToday;
        window.PAPA_DATA = docData;
      }
      
      // Dispatch event to trigger React re-render
      window.dispatchEvent(new Event('papa-data-updated'));
    }
  });
};

window.savePapaData = async () => {
  if (!window.PAPA_DATA || !window.firebaseDb) return;
  const db = window.firebaseDb;
  const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
  try {
    // Firestore throws error on undefined values. JSON stringify safely strips them out.
    const cleanData = JSON.parse(JSON.stringify(window.PAPA_DATA));
    await setDoc(doc(db, 'workspaces', 'main'), cleanData);
  } catch (e) {
    console.error("Failed to save PAPA_DATA to Firestore:", e);
  }
};

window.apiMutatePapaData = async (updaterCallback) => {
  if (!window.PAPA_DATA || !window.firebaseDb) return;
  
  // 1. Optimistic local update for instant UI feedback
  try {
    updaterCallback(window.PAPA_DATA);
    window.dispatchEvent(new Event('papa-data-updated'));
  } catch (err) {
    console.error("Local mutation error:", err);
  }

  // 2. Atomic server transaction
  const db = window.firebaseDb;
  const { doc, runTransaction } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
  const docRef = doc(db, 'workspaces', 'main');

  try {
    await runTransaction(db, async (t) => {
      const snap = await t.get(docRef);
      if (!snap.exists()) throw new Error("Document does not exist");
      const data = snap.data();
      
      // Apply mutations
      updaterCallback(data);
      
      const cleanData = JSON.parse(JSON.stringify(data));
      t.update(docRef, cleanData);
    });
  } catch (e) {
    console.error("Transaction failed:", e);
  }
};
