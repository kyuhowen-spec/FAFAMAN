// Sample data for PAPA HR system
const defaultData = {
  employees: [
    { id: 'kh', name: '김규호', en: 'Kyuho',   role: 'admin',  title: '대표이사',     team: 'ID', joined: '2016-03-15', initials: 'KH', color: 'av-0', birthday: '05-22', email: 'kyuho@foundfounded.kr',   phone: '010-2214-3391' },
    { id: 'sy', name: '이서연', en: 'Seoyeon', role: 'senior', title: '디렉터',       team: 'ID', joined: '2017-06-01', initials: 'SY', color: 'av-4', birthday: '09-14', email: 'seoyeon@foundfounded.kr', phone: '010-8841-2207' },
    { id: 'mj', name: '박민준', en: 'Minjun',  role: 'senior', title: '디렉터',       team: 'VD', joined: '2019-02-11', initials: 'MJ', color: 'av-6', birthday: '03-30', email: 'minjun@foundfounded.kr',  phone: '010-3376-5108' },
    { id: 'yj', name: '최유진', en: 'Yujin',   role: 'member', title: '시니어디자이너', team: 'ID', joined: '2021-09-06', initials: 'YJ', color: 'av-1', birthday: '11-08', email: 'yujin@foundfounded.kr',   phone: '010-5572-9183' },
    { id: 'jh', name: '정지훈', en: 'Jihoon',  role: 'member', title: '디자이너',     team: 'VD', joined: '2023-03-20', initials: 'JH', color: 'av-2', birthday: '04-21', email: 'jihoon@foundfounded.kr',  phone: '010-9914-4062' },
    { id: 'hy', name: '강하윤', en: 'Hayoon',  role: 'member', title: '디자이너',     team: 'ID', joined: '2022-11-14', initials: 'HY', color: 'av-3', birthday: '07-02', email: 'hayoon@foundfounded.kr',  phone: '010-6603-7751' },
    { id: 'dh', name: '한도현', en: 'Dohyun',  role: 'member', title: '디자이너',     team: 'VD', joined: '2024-01-08', initials: 'DH', color: 'av-5', birthday: '12-19', email: 'dohyun@foundfounded.kr',  phone: '010-4418-2205' },
    { id: 'ns', name: '남소은', en: 'Soeun',   role: 'member', title: '인턴',         team: 'ID', joined: '2026-01-13', initials: 'NS', color: 'av-2', birthday: '08-11', email: 'soeun@foundfounded.kr',   phone: '010-7720-1845' },
    { id: 'rt', name: '류태경', en: 'Taegyeong', role: 'member', title: '인턴',       team: 'VD', joined: '2026-03-02', initials: 'RT', color: 'av-7', birthday: '02-04', email: 'taegyeong@foundfounded.kr', phone: '010-5587-6620' },
    { id: 'jg', name: '정구',   en: 'Jungu',     role: 'member', title: '신규입사자', team: 'VD', joined: '2026-04-21', initials: 'JG', color: 'av-3', birthday: '01-01', email: 'jungu@foundfounded.com',  phone: '010-0000-0000' },
  ],

  // Title rank order for org chart grouping
  titleOrder: ['대표이사', '디렉터', '시니어디자이너', '디자이너', '인턴'],
  teams: [
    { key: 'ID', label: 'ID', full: 'Industrial Design', desc: '제품 · 산업 디자인' },
    { key: 'VD', label: 'VD', full: 'Visual Design',     desc: '디지털 · UX 비주얼' },
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
  attendance: {
    kh: { status: 'working',  checkIn: '10:12', plannedOut: '19:12', lunch: 60 },
    sy: { status: 'working',  checkIn: '09:58', plannedOut: '18:58', lunch: 90 },
    mj: { status: 'working',  checkIn: '10:24', plannedOut: '19:24', lunch: 60 },
    yj: { status: 'not_checked_in', checkIn: null, plannedOut: null, lunch: 60 },
    jh: { status: 'working',  checkIn: '10:47', plannedOut: '19:47', lunch: 60, wasLate: true },
    hy: { status: 'halfday',  checkIn: '10:05', plannedOut: '14:05', lunch: 60 },
    dh: { status: 'vacation', checkIn: null, plannedOut: null, lunch: null },
    jg: { status: 'not_checked_in', checkIn: null, plannedOut: null, lunch: 60 },
  },

  // Late logs — only seniors & admin can view full feed
  lateLogs: [
    { id: 'l1', empId: 'jh', date: '2026-04-21', time: '10:47', plannedAt: '10:00', delta: 47, reason: '지하철 지연 — 2호선' },
    { id: 'l2', empId: 'jh', date: '2026-04-15', time: '11:12', plannedAt: '11:00', delta: 12, reason: '알람 못 들음' },
    { id: 'l3', empId: 'jh', date: '2026-04-08', time: '11:23', plannedAt: '11:00', delta: 23, reason: '택시 잡기 어려움' },
    { id: 'l4', empId: 'hy', date: '2026-04-17', time: '10:18', plannedAt: '10:00', delta: 18, reason: '아침 병원 방문' },
    { id: 'l5', empId: 'yj', date: '2026-04-14', time: '09:36', plannedAt: '09:00', delta: 36, reason: '늦잠' },
    { id: 'l6', empId: 'mj', date: '2026-04-10', time: '10:32', plannedAt: '10:00', delta: 32, reason: '등원 도와주고 옴' },
    { id: 'l7', empId: 'jh', date: '2026-04-03', time: '10:14', plannedAt: '10:00', delta: 14, reason: '지하철 놓침' },
    { id: 'l8', empId: 'dh', date: '2026-03-27', time: '11:09', plannedAt: '11:00', delta: 9, reason: '알람 지연' },
  ],

  // Late counter per employee (0-5)
  lateCounter: {
    kh: 0, sy: 0, mj: 1, yj: 1, jh: 5, hy: 1, dh: 1,
  },

  // Penalty mode: 5회 누적 시 다음 날부터 7일간 10시 출근 고정
  penaltyMode: {
    jh: { startDate: '2026-04-22', endDate: '2026-04-28', reason: '지각 5회 누적' },
  },

  // Leave balance per employee
  leaveBalance: {
    kh: { total: 15, used: 3,  refresh: 0, refreshUsed: 0, tenure: 10 },
    sy: { total: 18, used: 5,  refresh: 5, refreshUsed: 2, tenure: 9 },
    mj: { total: 15, used: 2,  refresh: 0, refreshUsed: 0, tenure: 7 },
    yj: { total: 17, used: 4,  refresh: 0, refreshUsed: 0, tenure: 5 },
    jh: { total: 15, used: 6,  refresh: 0, refreshUsed: 0, tenure: 3 },
    hy: { total: 16, used: 7,  refresh: 0, refreshUsed: 0, tenure: 4 },
    dh: { total: 11, used: 1,  refresh: 0, refreshUsed: 0, tenure: 2 },
  },

  // Pending approvals
  approvals: [
    { id: 'a1', empId: 'yj', type: '연차', subtype: 'full', start: '2026-04-29', end: '2026-04-30', days: 2, reason: '가족 여행', appliedAt: '2026-04-20 14:22', stage: 'pending_senior', assignedSenior: 'sy' },
    { id: 'a2', empId: 'jh', type: '반차', subtype: 'half-pm', start: '2026-04-24', end: '2026-04-24', days: 0.5, reason: '병원 진료', appliedAt: '2026-04-21 09:14', stage: 'pending_senior', assignedSenior: 'mj' },
    { id: 'a3', empId: 'hy', type: '연차', subtype: 'full', start: '2026-05-04', end: '2026-05-06', days: 3, reason: '개인 사유', appliedAt: '2026-04-19 17:40', stage: 'pending_admin', assignedSenior: 'sy' },
    { id: 'a4', empId: 'sy', type: '리프레시', subtype: 'full', start: '2026-05-11', end: '2026-05-15', days: 5, reason: '연속 근무 2년 소진 · 재충전을 위한 휴식', appliedAt: '2026-04-18 10:05', stage: 'pending_admin' },
    { id: 'a5', empId: 'dh', type: '연차', subtype: 'full', start: '2026-04-21', end: '2026-04-21', days: 1, reason: '컨디션 난조', appliedAt: '2026-04-20 22:18', stage: 'approved', approvedAt: '2026-04-21 08:42', approvedBy: 'mj' },
    { id: 'a6', empId: 'jh', type: '반차', subtype: 'half-am', start: '2026-04-15', end: '2026-04-15', days: 0.5, reason: '치과 진료', appliedAt: '2026-04-14 11:02', stage: 'approved', approvedAt: '2026-04-14 13:30', approvedBy: 'mj' },
    { id: 'a7', empId: 'ns', type: '연차', subtype: 'full', start: '2026-04-10', end: '2026-04-10', days: 1, reason: '인턴 면접 일정', appliedAt: '2026-04-08 19:50', stage: 'rejected', rejectedAt: '2026-04-09 09:12', rejectedBy: 'sy', rejectReason: '프로젝트 마감 직전이라 1주 후 다시 신청 부탁드려요' },
    { id: 'a8', empId: 'rt', type: '점심 1.5h', subtype: 'lunch', start: '2026-04-21', end: '2026-04-21', days: 0, reason: '병원 동행', appliedAt: '2026-04-21 11:08', stage: 'pending_senior', isLunch: true, lunchSlot: 'late', assignedSenior: 'mj' },
  ],

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
      body: `점심 시간은 기본 1시간이며, 사전 신청 시 1.5시간으로 연장할 수 있습니다.\n\n[1.5시간 사용 가능 시간대]\n• 12:00 – 13:30\n• 12:30 – 14:00\n\n오전 11시 이전까지 시니어에게 결재 신청해야 하며, 승인 후 사용 가능합니다.\n같은 팀 내 동시에 1.5시간을 사용하는 인원이 너무 많을 경우 시니어 판단으로 조정될 수 있습니다.`,
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
      body: `연차: 입사 1년 차 15일 / 2년 차부터 1년마다 +1일 (최대 25일)\n반차: 오전 / 오후 중 선택, 0.5일 차감\n리프레시: 별도 5일 (연차와 별도, 분기당 1회 권장)\n\n주말은 휴가 일수에서 자동 제외됩니다.\n시작 3영업일 전까지 신청을 권장합니다. 긴급 사유는 시니어와 별도 협의해주세요.`,
    },
    {
      id: 'p5',
      title: '휴일 근무 수당',
      category: '급여',
      pinned: false,
      author: '김규호',
      authorId: 'kh',
      updatedAt: '2025-12-20',
      body: `토·일 또는 공휴일 근무 시 수당이 지급됩니다.\n\n• 반일 (4시간) — 80,000원\n• 종일 (8시간) — 160,000원\n\n사전에 시니어 결재가 있어야 하며, 승인되지 않은 자발적 근무는 수당 대상이 아닙니다.`,
    },
    {
      id: 'p6',
      title: '재택 근무 가이드',
      category: '근무시간',
      pinned: false,
      author: '박민준',
      authorId: 'mj',
      updatedAt: '2026-03-30',
      body: `주 1회 재택 근무가 가능합니다.\n전날 오후 6시까지 시니어에게 공유해주세요.\n\n재택 시에도 출퇴근 체크인은 동일하게 진행하며, 슬랙·구글밋 등에서 즉시 응답 가능한 상태여야 합니다.`,
    },
  ],

  // Policy excerpts (legacy summary cards — kept for backward compat)
  policyHighlights: [
    { key: 'flex',    title: '유연 출퇴근',   body: '9–11시 자율 출근 · 월요일은 13시' },
    { key: 'lunch',   title: '점심 유연제',   body: '1시간 또는 1.5시간 · 11시 전 공지' },
    { key: 'late',    title: '지각 카운터',   body: '5회 도달 시 1주 10시 출근 고정' },
    { key: 'holiday', title: '휴일 근무',     body: '반일 80,000원 · 종일 160,000원' },
  ],

  // External users (not part of org chart) — e.g. outside accounting firm
  externalUsers: [
    { id: 'acc', name: '이정민', en: 'Jeongmin', role: 'accountant', title: '담당 회계사', team: '세림세무회계', initials: 'JM', color: 'av-6', email: 'jm@serim-tax.kr', phone: '010-3380-7742' },
  ],

  // Login accounts — email → { pw, userId }
  accounts: {
    'kyuho@foundfounded.kr':     { pw: 'papa1234', userId: 'kh' },
    'seoyeon@foundfounded.kr':   { pw: 'papa1234', userId: 'sy' },
    'minjun@foundfounded.kr':    { pw: 'papa1234', userId: 'mj' },
    'yujin@foundfounded.kr':     { pw: 'papa1234', userId: 'yj' },
    'jihoon@foundfounded.kr':    { pw: 'papa1234', userId: 'jh' },
    'hayoon@foundfounded.kr':    { pw: 'papa1234', userId: 'hy' },
    'dohyun@foundfounded.kr':    { pw: 'papa1234', userId: 'dh' },
    'soeun@foundfounded.kr':     { pw: 'papa1234', userId: 'ns' },
    'taegyeong@foundfounded.kr': { pw: 'papa1234', userId: 'rt' },
    'jungu@foundfounded.com':    { pw: '0000',     userId: 'jg', isInitial: true },
    'jm@serim-tax.kr':           { pw: 'tax1234',  userId: 'acc' },
  },

  // Demo login hints shown on login screen
  loginHints: [
    { loginId: 'kyuho@foundfounded.kr',  pw: 'papa1234', label: '관리자 · 김규호 대표이사' },
    { loginId: 'minjun@foundfounded.kr', pw: 'papa1234', label: '시니어 · 박민준 디렉터' },
    { loginId: 'jihoon@foundfounded.kr', pw: 'papa1234', label: '멤버 · 정지훈 디자이너' },
    { loginId: 'jm@serim-tax.kr',       pw: 'tax1234',  label: '회계법인 · 세림세무회계' },
  ],

  // Personal profiles for certificates (주민번호 앞자리 등)
  profiles: {
    kh: { rrn: '790522-1', address: '서울특별시 용산구 한남대로 42, 301호' },
    sy: { rrn: '880914-2', address: '서울특별시 마포구 월드컵북로 78, 1102호' },
    mj: { rrn: '850330-1', address: '경기도 성남시 분당구 정자일로 95, 504호' },
    yj: { rrn: '930608-2', address: '서울특별시 성동구 왕십리로 115, 802호' },
    jh: { rrn: '960421-1', address: '서울특별시 동작구 사당로 230, 203호' },
    hy: { rrn: '940702-2', address: '서울특별시 광진구 자양로 88, 1201호' },
    dh: { rrn: '980219-1', address: '인천광역시 연수구 송도과학로 32, 705호' },
    ns: { rrn: '010811-4', address: '서울특별시 은평구 통일로 920, 403호' },
    rt: { rrn: '000204-3', address: '경기도 고양시 일산동구 중앙로 1234, 606호' },
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
  const { doc, getDoc, setDoc, onSnapshot } = await import("https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js");
  
  const docRef = doc(db, 'workspaces', 'main');
  const snapshot = await getDoc(docRef);
  
  if (snapshot.exists()) {
    window.PAPA_DATA = snapshot.data();
  } else {
    window.PAPA_DATA = defaultData;
    await setDoc(docRef, window.PAPA_DATA);
  }

  // Realtime Sync Listener
  onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      window.PAPA_DATA = docSnap.data();
      // Dispatch event to trigger React re-render
      window.dispatchEvent(new Event('papa-data-updated'));
    }
  });
};

window.savePapaData = async () => {
  if (!window.PAPA_DATA || !window.firebaseDb) return;
  const db = window.firebaseDb;
  const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js");
  try {
    await setDoc(doc(db, 'workspaces', 'main'), window.PAPA_DATA);
  } catch (e) {
    console.error("Failed to save PAPA_DATA to Firestore:", e);
  }
};
