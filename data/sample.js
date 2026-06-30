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
      title: '유연 출퇴근 제도',
      category: '근무시간',
      pinned: true,
      author: '김규호',
      authorId: 'kh',
      updatedAt: '2026-03-12',
      body: `출근 시간은 오전 9시부터 11시 사이 자유롭게 선택할 수 있습니다.\n선택한 출근 시간 + 9시간(점심 1시간 포함) 후 퇴근하면 됩니다.\n\n예) 9:30 출근 → 18:30 퇴근\n예) 11:00 출근 → 20:00 퇴근\n\n월요일은 13:00 통합 출근일이며, 오전에는 개인 일정·은행·병원 등을 자유롭게 처리하실 수 있습니다.`,
    },
    {
      id: 'p2',
      title: '점심 유연제 (1시간 / 1.5시간)',
      category: '근무시간',
      pinned: true,
      author: '김규호',
      authorId: 'kh',
      updatedAt: '2026-02-28',
      body: `점심 시간은 기본 1시간이며, 사전 신청 시 1.5시간으로 연장할 수 있습니다.\n\n[1.5시간 사용 가능 시간대]\n• 12:00 – 13:30\n• 12:30 – 14:00\n\n오전 11시 이전까지 팀장에게 결재 신청해야 하며, 승인 후 사용 가능합니다.\n같은 팀 내 동시에 1.5시간을 사용하는 인원이 너무 많을 경우 팀장 판단으로 조정될 수 있습니다.`,
    },
    {
      id: 'p3',
      title: '지각 카운터 및 벌칙 근태',
      category: '근태',
      pinned: false,
      author: '김규호',
      authorId: 'kh',
      updatedAt: '2026-04-01',
      body: `지각은 체크인 시각이 11:00을 초과한 경우 자동 기록됩니다.\n월별로 카운터가 누적되며, 5회 도달 시 다음 날부터 7일간 "10시 출근 고정" 벌칙이 적용됩니다.\n\n벌칙 기간 중 추가 지각 시 인사 면담이 진행됩니다.\n매월 1일에 카운터는 0으로 초기화됩니다.`,
    },
    {
      id: 'p4',
      title: '연차 · 반차 · 리프레시 휴가',
      category: '휴가',
      pinned: false,
      author: '이서연',
      authorId: 'sy',
      updatedAt: '2026-01-15',
      body: `연차: 입사 1년 차 15일 / 2년 차부터 1년마다 +1일 (최대 25일)\n반차: 오전 / 오후 중 선택, 0.5일 차감\n리프레시: 별도 5일 (연차와 별도, 분기당 1회 권장)\n\n주말은 휴가 일수에서 자동 제외됩니다.\n시작 3영업일 전까지 신청을 권장합니다. 긴급 사유는 팀장과 별도 협의해주세요.`,
    },
    {
      id: 'p5',
      title: '휴일 근무 수당',
      category: '급여',
      pinned: false,
      author: '김규호',
      authorId: 'kh',
      updatedAt: '2025-12-20',
      body: `토·일 또는 공휴일 근무 시 수당이 지급됩니다.\n\n• 반일 (4시간) — 80,000원\n• 종일 (8시간) — 160,000원\n\n사전에 팀장 결재가 있어야 하며, 승인되지 않은 자발적 근무는 수당 대상이 아닙니다.`,
    },
    {
      id: 'p6',
      title: '재택 근무 가이드',
      category: '근무시간',
      pinned: false,
      author: '박민준',
      authorId: 'mj',
      updatedAt: '2026-03-30',
      body: `주 1회 재택 근무가 가능합니다.\n전날 오후 6시까지 팀장에게 공유해주세요.\n\n재택 시에도 출퇴근 체크인은 동일하게 진행하며, 슬랙·구글밋 등에서 즉시 응답 가능한 상태여야 합니다.`,
    },
  ],

  // Policy excerpts (legacy summary cards — kept for backward compat)
  policyHighlights: [
    { key: 'flex',    title: '유연 출퇴근',   body: '9–11시 자율 출근 · 월요일은 13시' },
    { key: 'lunch',   title: '점심 유연제',   body: '1시간 또는 1.5시간 · 11시 전 공지' },
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
  payroll: {
    '2026-06': {
      kh: { earnings: { '기본급': 6800000, '식대/복리후생': 200000, '야근/연장수당': 0,      '직책수당': 800000, '상여금': 0 },       deductions: { '국민연금': 265500, '건강보험': 241600, '고용보험': 61200, '장기요양보험': 31300, '소득세': 712000, '지방소득세': 71200 } },
      sy: { earnings: { '기본급': 5200000, '식대/복리후생': 200000, '야근/연장수당': 180000, '직책수당': 500000, '상여금': 0 },       deductions: { '국민연금': 234000, '건강보험': 212900, '고용보험': 53800, '장기요양보험': 27600, '소득세': 462000, '지방소득세': 46200 } },
      mj: { earnings: { '기본급': 5000000, '식대/복리후생': 200000, '야근/연장수당': 240000, '직책수당': 500000, '상여금': 0 },       deductions: { '국민연금': 225000, '건강보험': 204700, '고용보험': 51700, '장기요양보험': 26500, '소득세': 421000, '지방소득세': 42100 } },
      yj: { earnings: { '기본급': 3900000, '식대/복리후생': 200000, '야근/연장수당': 320000, '직책수당': 0,      '상여금': 0 },       deductions: { '국민연금': 175500, '건강보험': 159700, '고용보험': 40300, '장기요양보험': 20600, '소득세': 213000, '지방소득세': 21300 } },
      jh: { earnings: { '기본급': 3100000, '식대/복리후생': 200000, '야근/연장수당': 280000, '직책수당': 0,      '상여금': 0 },       deductions: { '국민연금': 139500, '건강보험': 126900, '고용보험': 32000, '장기요양보험': 16400, '소득세': 118000, '지방소득세': 11800 } },
      hy: { earnings: { '기본급': 3500000, '식대/복리후생': 200000, '야근/연장수당': 150000, '직책수당': 0,      '상여금': 0 },       deductions: { '국민연금': 157500, '건강보험': 143300, '고용보험': 36100, '장기요양보험': 18500, '소득세': 162000, '지방소득세': 16200 } },
      dh: { earnings: { '기본급': 3000000, '식대/복리후생': 200000, '야근/연장수당': 200000, '직책수당': 0,      '상여금': 0 },       deductions: { '국민연금': 135000, '건강보험': 122800, '고용보험': 31000, '장기요양보험': 15900, '소득세': 108000, '지방소득세': 10800 } },
      ns: { earnings: { '기본급': 2300000, '식대/복리후생': 200000, '야근/연장수당': 0,      '직책수당': 0,      '상여금': 0 },       deductions: { '국민연금': 103500, '건강보험': 94100,  '고용보험': 23800, '장기요양보험': 12100, '소득세': 41000,  '지방소득세': 4100 } },
      rt: { earnings: { '기본급': 2300000, '식대/복리후생': 200000, '야근/연장수당': 90000,  '직책수당': 0,      '상여금': 0 },       deductions: { '국민연금': 103500, '건강보험': 94100,  '고용보험': 23800, '장기요양보험': 12100, '소득세': 41000,  '지방소득세': 4100 } },
    },
    '2026-05': {
      kh: { earnings: { '기본급': 6800000, '식대/복리후생': 200000, '야근/연장수당': 0,      '직책수당': 800000, '상여금': 3400000 }, deductions: { '국민연금': 265500, '건강보험': 241600, '고용보험': 61200, '장기요양보험': 31300, '소득세': 980000, '지방소득세': 98000 } },
      sy: { earnings: { '기본급': 5200000, '식대/복리후생': 200000, '야근/연장수당': 120000, '직책수당': 500000, '상여금': 2600000 }, deductions: { '국민연금': 234000, '건강보험': 212900, '고용보험': 53800, '장기요양보험': 27600, '소득세': 640000, '지방소득세': 64000 } },
      mj: { earnings: { '기본급': 5000000, '식대/복리후생': 200000, '야근/연장수당': 300000, '직책수당': 500000, '상여금': 2500000 }, deductions: { '국민연금': 225000, '건강보험': 204700, '고용보험': 51700, '장기요양보험': 26500, '소득세': 590000, '지방소득세': 59000 } },
      yj: { earnings: { '기본급': 3900000, '식대/복리후생': 200000, '야근/연장수당': 280000, '직책수당': 0,      '상여금': 1950000 }, deductions: { '국민연금': 175500, '건강보험': 159700, '고용보험': 40300, '장기요양보험': 20600, '소득세': 320000, '지방소득세': 32000 } },
      jh: { earnings: { '기본급': 3100000, '식대/복리후생': 200000, '야근/연장수당': 220000, '직책수당': 0,      '상여금': 1550000 }, deductions: { '국민연금': 139500, '건강보험': 126900, '고용보험': 32000, '장기요양보험': 16400, '소득세': 190000, '지방소득세': 19000 } },
      hy: { earnings: { '기본급': 3500000, '식대/복리후생': 200000, '야근/연장수당': 100000, '직책수당': 0,      '상여금': 1750000 }, deductions: { '국민연금': 157500, '건강보험': 143300, '고용보험': 36100, '장기요양보험': 18500, '소득세': 250000, '지방소득세': 25000 } },
      dh: { earnings: { '기본급': 3000000, '식대/복리후생': 200000, '야근/연장수당': 160000, '직책수당': 0,      '상여금': 1500000 }, deductions: { '국민연금': 135000, '건강보험': 122800, '고용보험': 31000, '장기요양보험': 15900, '소득세': 170000, '지방소득세': 17000 } },
      ns: { earnings: { '기본급': 2300000, '식대/복리후생': 200000, '야근/연장수당': 0,      '직책수당': 0,      '상여금': 0 },       deductions: { '국민연금': 103500, '건강보험': 94100,  '고용보험': 23800, '장기요양보험': 12100, '소득세': 41000,  '지방소득세': 4100 } },
      rt: { earnings: { '기본급': 2300000, '식대/복리후생': 200000, '야근/연장수당': 60000,  '직책수당': 0,      '상여금': 0 },       deductions: { '국민연금': 103500, '건강보험': 94100,  '고용보험': 23800, '장기요양보험': 12100, '소득세': 41000,  '지방소득세': 4100 } },
    },
  },

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
      label: `${kstTime.getMonth() + 1}월 ${kstTime.getDate()}일`,
      monthKr: `${kstTime.getMonth() + 1}월`
    };
  };

  const docRef = doc(db, 'workspaces', 'main');
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    let dataObj = docSnap.data();
    
    // 1회성 강제 초기화 (더미 데이터가 1명 이상이면 덮어쓰기)
    if (dataObj.employees && dataObj.employees.length > 1) {
      window.PAPA_DATA = defaultData;
      window.PAPA_DATA.today = getSeoulDateInfo();
      await setDoc(docRef, window.PAPA_DATA);
      console.warn("데이터베이스가 초기화(클린업) 되었습니다.");
      dataObj = window.PAPA_DATA;
    }
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
