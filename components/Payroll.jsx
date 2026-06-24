// 급여 시스템 — accountant inputs salary; employees view payslips + print PDF
const fmtWon = (n) => (n || 0).toLocaleString('ko-KR') + '원';
const fmtWonShort = (n) => (n || 0).toLocaleString('ko-KR');

// Build last N months as 'YYYY-MM'
const recentMonths = (n = 6, anchor = '2026-06') => {
  const [ay, am] = anchor.split('-').map(Number);
  const out = [];
  let y = ay, m = am;
  for (let i = 0; i < n; i++) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m--; if (m === 0) { m = 12; y--; }
  }
  return out;
};
const monthLabel = (ym) => { const [y, m] = ym.split('-'); return `${y}년 ${Number(m)}월`; };

const sumObj = (o) => Object.values(o || {}).reduce((a, b) => a + (Number(b) || 0), 0);

// ===== Month selector =====
const MonthSelect = ({ month, onChange, months }) => (
  <select value={month} onChange={e => onChange(e.target.value)}
    style={{
      padding: '8px 14px', borderRadius: 10, border: '1px solid var(--line)',
      fontSize: 14, fontWeight: 700, background: 'white', cursor: 'pointer',
      fontFamily: 'inherit', color: 'var(--ink)',
    }}>
    {months.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
  </select>
);

// ===== Payslip A4 document (shared by view + print) =====
const PayslipDocument = ({ empId, month, payroll, schema }) => {
  const emp = getEmployee(empId);
  const rec = (payroll[month] || {})[empId];
  const data = window.PAPA_DATA;
  if (!rec) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--ink-mute)' }}>
        {monthLabel(month)} 급여 명세 데이터가 없습니다.
      </div>
    );
  }
  const totalEarn = sumObj(rec.earnings);
  const totalDed = sumObj(rec.deductions);
  const net = totalEarn - totalDed;
  const maxRows = Math.max(schema.earnings.length, schema.deductions.length);

  return (
    <div className="doc-a4" style={{
      background: 'white', color: '#1a2340',
      padding: '48px 52px', width: 720, margin: '0 auto',
      fontFamily: 'Pretendard, sans-serif',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #1a2340', paddingBottom: 18 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.02em' }}>급여명세서</div>
          <div style={{ fontSize: 13, color: '#5a6784', marginTop: 6, fontWeight: 600 }}>
            {monthLabel(month)} 귀속 · {data.certTemplate.company}
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 12, color: '#5a6784', lineHeight: 1.7 }}>
          <div>지급일 {month}-25</div>
          <div>사업자 {data.certTemplate.bizNo}</div>
        </div>
      </div>

      {/* Employee info */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, marginTop: 20, border: '1px solid #eaeff7', borderRadius: 8, overflow: 'hidden' }}>
        {[
          ['성명', emp.name], ['사번', emp.id.toUpperCase()],
          ['소속', emp.team + ' 팀'], ['직위', emp.title],
        ].map(([k, v], i) => (
          <div key={i} style={{ display: 'flex', borderRight: i % 2 === 0 ? 'none' : 'none' }}>
            <div style={{ background: '#f5f8fc', padding: '10px 12px', fontSize: 12, fontWeight: 700, color: '#5a6784', width: 56, flexShrink: 0 }}>{k}</div>
            <div style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, flex: 1 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Earnings / Deductions table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, marginTop: 22, border: '1px solid #eaeff7' }}>
        <div style={{ borderRight: '1px solid #eaeff7' }}>
          <div style={{ background: '#e4edff', padding: '10px 14px', fontSize: 13, fontWeight: 800, color: '#2a5ad4' }}>지급 항목</div>
          {schema.earnings.map(name => (
            <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 14px', borderTop: '1px solid #f2f5fb', fontSize: 13 }}>
              <span style={{ color: '#5a6784', fontWeight: 600 }}>{name}</span>
              <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmtWonShort(rec.earnings[name])}</span>
            </div>
          ))}
        </div>
        <div>
          <div style={{ background: '#ffe4e8', padding: '10px 14px', fontSize: 13, fontWeight: 800, color: '#8a1a2a' }}>공제 항목</div>
          {schema.deductions.map(name => (
            <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 14px', borderTop: '1px solid #f2f5fb', fontSize: 13 }}>
              <span style={{ color: '#5a6784', fontWeight: 600 }}>{name}</span>
              <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmtWonShort(rec.deductions[name])}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, border: '1px solid #eaeff7', borderTop: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px', borderRight: '1px solid #eaeff7', background: '#f5f8fc' }}>
          <span style={{ fontWeight: 800, fontSize: 13 }}>지급 합계</span>
          <span style={{ fontWeight: 800, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{fmtWonShort(totalEarn)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px', background: '#f5f8fc' }}>
          <span style={{ fontWeight: 800, fontSize: 13 }}>공제 합계</span>
          <span style={{ fontWeight: 800, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{fmtWonShort(totalDed)}</span>
        </div>
      </div>

      {/* Net pay */}
      <div style={{
        marginTop: 22, padding: '20px 24px', borderRadius: 12,
        background: 'linear-gradient(135deg, #3A6FF0, #5B8BF5)', color: 'white',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '.02em' }}>실 수령액 (차인지급액)</div>
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums' }}>{fmtWon(net)}</div>
      </div>

      <div style={{ marginTop: 28, fontSize: 11, color: '#9ba7c1', textAlign: 'center', lineHeight: 1.6 }}>
        본 명세서는 {data.certTemplate.company}에서 발행한 전자 급여명세서입니다.<br/>
        문의: 세림세무회계 · jm@serim-tax.kr
      </div>
    </div>
  );
};

// ===== Print overlay =====
const PrintDocOverlay = ({ onClose, title, children }) => {
  React.useEffect(() => {
    const originalTitle = document.title;
    document.title = title;
    return () => {
      document.title = originalTitle;
    };
  }, [title]);

  return (
    <div className="modal-backdrop print-overlay" onClick={onClose} style={{ alignItems: 'flex-start', overflow: 'auto', padding: '32px 0' }}>
      <div className="print-wrapper" onClick={e => e.stopPropagation()} style={{ width: 'fit-content', margin: '0 auto' }}>
        {/* Toolbar (hidden on print) */}
        <div className="no-print" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: 720, margin: '0 auto 16px', color: 'white',
        }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{title}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={() => window.print()} style={{ background: 'white', color: 'var(--ink)', fontWeight: 700 }}>
              <Icon name="book" size={14}/> PDF로 저장 (인쇄)
            </button>
            <button className="btn" onClick={onClose} style={{ background: 'rgba(255,255,255,.18)', color: 'white' }}>
              <Icon name="x" size={14}/> 닫기
            </button>
          </div>
        </div>
        <div className="print-area" style={{ boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

// ===== Employee payslip view =====
const EmployeePayslip = ({ currentUserId, payroll, schema, month, setMonth, months }) => {
  const [printing, setPrinting] = React.useState(false);
  const rec = (payroll[month] || {})[currentUserId];
  const net = rec ? sumObj(rec.earnings) - sumObj(rec.deductions) : 0;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 24 }}>
        <div>
          <div className="eyebrow">PAYSLIP</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginTop: 8, letterSpacing: '-.02em' }}>급여명세서</h1>
          <div style={{ marginTop: 8, color: 'var(--ink-mute)', fontSize: 14, fontWeight: 500 }}>
            월별 급여명세서를 조회하고 PDF로 저장하세요.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <MonthSelect month={month} onChange={setMonth} months={months} />
          {rec && (
            <button className="btn btn-primary" onClick={() => setPrinting(true)}>
              <Icon name="book" size={14}/> PDF 다운로드
            </button>
          )}
        </div>
      </div>

      {!rec ? (
        <div className="card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{monthLabel(month)} 명세서가 아직 없어요</div>
          <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 6 }}>회계법인에서 급여가 등록되면 표시됩니다.</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '8px', background: 'var(--bg)' }}>
            <PayslipDocument empId={currentUserId} month={month} payroll={payroll} schema={schema} />
          </div>
        </div>
      )}

      {printing && (
        <PrintDocOverlay title={`${monthLabel(month)} 급여명세서_${window.getEmployee(currentUserId).name}`} onClose={() => setPrinting(false)}>
          <PayslipDocument empId={currentUserId} month={month} payroll={payroll} schema={schema} />
        </PrintDocOverlay>
      )}
    </div>
  );
};

// ===== Accountant payroll admin =====
const AccountantPayroll = ({ payroll, schema, month, setMonth, months, onUpdateCell, onAddItem, onBulkApply, onToast }) => {
  const data = window.PAPA_DATA;
  const employees = data.employees;
  const [selectedEmp, setSelectedEmp] = React.useState(employees[0].id);
  const [addingItem, setAddingItem] = React.useState(false);
  const fileRef = React.useRef(null);

  const rec = (payroll[month] || {})[selectedEmp] || { earnings: {}, deductions: {} };
  const totalEarn = sumObj(rec.earnings);
  const totalDed = sumObj(rec.deductions);
  const net = totalEarn - totalDed;

  // CSV template download
  const downloadTemplate = () => {
    const cols = ['사번', '성명', '귀속월', ...schema.earnings, ...schema.deductions];
    const rows = employees.map(e => {
      const r = (payroll[month] || {})[e.id] || { earnings: {}, deductions: {} };
      return [
        e.id, e.name, month,
        ...schema.earnings.map(n => r.earnings[n] || 0),
        ...schema.deductions.map(n => r.deductions[n] || 0),
      ].join(',');
    });
    const csv = '\uFEFF' + [cols.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `급여대장_${month}.csv`; a.click();
    URL.revokeObjectURL(url);
    onToast({ text: `${monthLabel(month)} CSV 양식 다운로드`, icon: 'check' });
  };

  // CSV upload parse
  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result).replace(/^\uFEFF/, '');
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        const header = lines[0].split(',').map(s => s.trim());
        const idIdx = header.indexOf('사번');
        if (idIdx === -1) { onToast({ text: 'CSV에 "사번" 열이 없습니다', icon: 'x' }); return; }
        const earnCols = schema.earnings.filter(n => header.includes(n));
        const dedCols = schema.deductions.filter(n => header.includes(n));
        const updates = {};
        let applied = 0;
        for (let i = 1; i < lines.length; i++) {
          const cells = lines[i].split(',');
          const empId = (cells[idIdx] || '').trim();
          if (!employees.find(e => e.id === empId)) continue;
          const earnings = {}, deductions = {};
          earnCols.forEach(n => { earnings[n] = Number((cells[header.indexOf(n)] || '0').replace(/[^0-9.-]/g, '')) || 0; });
          dedCols.forEach(n => { deductions[n] = Number((cells[header.indexOf(n)] || '0').replace(/[^0-9.-]/g, '')) || 0; });
          updates[empId] = { earnings, deductions };
          applied++;
        }
        onBulkApply(month, updates);
        onToast({ text: `${applied}명 급여 일괄 등록 완료`, icon: 'check' });
      } catch (err) {
        onToast({ text: 'CSV 파싱 오류 — 양식을 확인하세요', icon: 'x' });
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const selEmp = getEmployee(selectedEmp);

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 20 }}>
        <div>
          <div className="eyebrow">PAYROLL · 세림세무회계</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginTop: 8, letterSpacing: '-.02em' }}>급여 관리</h1>
          <div style={{ marginTop: 8, color: 'var(--ink-mute)', fontSize: 14, fontWeight: 500 }}>
            직원별 급여를 입력하거나 CSV로 일괄 등록하세요.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <MonthSelect month={month} onChange={setMonth} months={months} />
          <button className="btn btn-ghost" onClick={downloadTemplate}>
            <Icon name="book" size={14}/> CSV 양식
          </button>
          <button className="btn btn-primary" onClick={() => fileRef.current?.click()}>
            <Icon name="plus" size={14}/> CSV 업로드
          </button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleUpload} style={{ display: 'none' }}/>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Employee list */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', background: 'var(--bg)' }}>
            <div className="eyebrow">직원 {employees.length}명</div>
          </div>
          <div>
            {employees.map(e => {
              const r = (payroll[month] || {})[e.id];
              const n = r ? sumObj(r.earnings) - sumObj(r.deductions) : 0;
              const active = selectedEmp === e.id;
              return (
                <button key={e.id} onClick={() => setSelectedEmp(e.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '12px 16px', borderBottom: '1px solid var(--line-soft)',
                  background: active ? 'var(--accent-soft)' : 'transparent',
                  borderLeft: `3px solid ${active ? 'var(--accent)' : 'transparent'}`,
                  textAlign: 'left', cursor: 'pointer',
                }}>
                  <Avatar empId={e.id} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: active ? 'var(--accent-dark)' : 'var(--ink)' }}>{e.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 1 }}>{e.title} · {e.team}</div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: r ? 'var(--ink-soft)' : 'var(--ink-mute)', fontVariantNumeric: 'tabular-nums' }}>
                    {r ? fmtWonShort(n) : '미등록'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Edit form */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottom: '1px solid var(--line)' }}>
            <Avatar empId={selectedEmp} size="md" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{selEmp.name} <span style={{ fontWeight: 600, color: 'var(--ink-mute)', fontSize: 13 }}>{selEmp.title}</span></div>
              <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 2 }}>{monthLabel(month)} 귀속 급여 입력</div>
            </div>
            <button className="btn btn-ghost" onClick={() => setAddingItem(true)} style={{ fontSize: 12, padding: '8px 12px' }}>
              <Icon name="plus" size={13}/> 항목 추가
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 20 }}>
            {/* Earnings */}
            <div>
              <div className="eyebrow" style={{ color: 'var(--accent-dark)', marginBottom: 12 }}>지급 항목</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {schema.earnings.map(name => (
                  <PayInput key={name} label={name}
                    value={rec.earnings[name] || 0}
                    onChange={v => onUpdateCell(month, selectedEmp, 'earnings', name, v)} />
                ))}
              </div>
            </div>
            {/* Deductions */}
            <div>
              <div className="eyebrow" style={{ color: 'var(--danger-ink, #8a1a2a)', marginBottom: 12 }}>공제 항목</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {schema.deductions.map(name => (
                  <PayInput key={name} label={name}
                    value={rec.deductions[name] || 0}
                    onChange={v => onUpdateCell(month, selectedEmp, 'deductions', name, v)} />
                ))}
              </div>
            </div>
          </div>

          {/* Net summary */}
          <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <SummaryBox label="지급 합계" value={totalEarn} color="var(--accent)" />
            <SummaryBox label="공제 합계" value={totalDed} color="var(--danger, #ef4444)" />
            <SummaryBox label="실 수령액" value={net} color="var(--ink)" strong />
          </div>
        </div>
      </div>

      {addingItem && (
        <AddItemModal
          onClose={() => setAddingItem(false)}
          onAdd={(type, name) => { onAddItem(type, name); setAddingItem(false); onToast({ text: `"${name}" 항목 추가됨`, icon: 'check' }); }}
          schema={schema}
        />
      )}
    </div>
  );
};

const PayInput = ({ label, value, onChange }) => (
  <div>
    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-mute)', marginBottom: 4 }}>{label}</div>
    <div style={{ position: 'relative' }}>
      <input
        type="text" inputMode="numeric"
        value={(value || 0).toLocaleString('ko-KR')}
        onChange={e => onChange(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)}
        style={{
          width: '100%', padding: '9px 30px 9px 12px', borderRadius: 8,
          border: '1px solid var(--line)', fontSize: 14, fontWeight: 700,
          textAlign: 'right', fontVariantNumeric: 'tabular-nums', outline: 'none',
          fontFamily: 'inherit',
        }}
      />
      <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--ink-mute)', fontWeight: 600 }}>원</span>
    </div>
  </div>
);

const SummaryBox = ({ label, value, color, strong }) => (
  <div style={{
    padding: '14px 16px', borderRadius: 12,
    background: strong ? color : 'var(--bg)',
    color: strong ? 'white' : 'var(--ink)',
  }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: strong ? 'rgba(255,255,255,.8)' : 'var(--ink-mute)' }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4, fontVariantNumeric: 'tabular-nums', color: strong ? 'white' : color }}>
      {fmtWonShort(value)}<span style={{ fontSize: 12, marginLeft: 2 }}>원</span>
    </div>
  </div>
);

const AddItemModal = ({ onClose, onAdd, schema }) => {
  const [type, setType] = React.useState('earnings');
  const [name, setName] = React.useState('');
  const exists = (type === 'earnings' ? schema.earnings : schema.deductions).includes(name.trim());
  const canAdd = name.trim() && !exists;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 420 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div className="eyebrow">NEW ITEM</div>
            <div className="h1" style={{ marginTop: 6 }}>급여 항목 추가</div>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ background: 'var(--bg)' }}><Icon name="x" size={16}/></button>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>구분</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[{ k: 'earnings', l: '지급 항목' }, { k: 'deductions', l: '공제 항목' }].map(o => (
              <button key={o.k} onClick={() => setType(o.k)} style={{
                flex: 1, padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                background: type === o.k ? 'var(--accent)' : 'var(--bg)',
                color: type === o.k ? 'white' : 'var(--ink-soft)',
              }}>{o.l}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>항목명</div>
          <input className="input" value={name} autoFocus onChange={e => setName(e.target.value)}
            placeholder="예: 자격수당, 노동조합비" />
          {exists && <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 6, fontWeight: 600 }}>이미 존재하는 항목입니다</div>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-lg" onClick={onClose} style={{ flex: 1 }}>취소</button>
          <button className="btn btn-primary btn-lg" disabled={!canAdd}
            onClick={() => onAdd(type, name.trim())}
            style={{ flex: 2, opacity: canAdd ? 1 : .4, cursor: canAdd ? 'pointer' : 'not-allowed' }}>추가</button>
        </div>
      </div>
    </div>
  );
};

// ===== Page router =====
const PayrollPage = (props) => {
  const months = recentMonths(6, '2026-06');
  if (props.role === 'accountant') return <AccountantPayroll {...props} months={months} />;
  return <EmployeePayslip {...props} months={months} />;
};

Object.assign(window, { PayrollPage, PayslipDocument, PrintDocOverlay, fmtWon, monthLabel, recentMonths });
