// 재직증명서 — admin registers template; employees auto-issue + print PDF
const TODAY = '2026-06-22';

const fmtKDate = (iso) => {
  const [y, m, d] = iso.split('-');
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
};

const tenureText = (joined, to = TODAY) => {
  const j = new Date(joined), t = new Date(to);
  let months = (t.getFullYear() - j.getFullYear()) * 12 + (t.getMonth() - j.getMonth());
  if (t.getDate() < j.getDate()) months--;
  const y = Math.floor(months / 12), m = months % 12;
  if (y === 0) return `${m}개월`;
  if (m === 0) return `${y}년`;
  return `${y}년 ${m}개월`;
};

// ===== Certificate A4 document =====
const CertificateDocument = ({ empId, template, purpose, issueDate }) => {
  const emp = getEmployee(empId);
  const prof = (window.PAPA_DATA.profiles || {})[empId] || {};
  const rows = [
    ['성    명', emp.name],
    ['생 년 월 일', emp.rrn ? emp.rrn + '******' : (prof.rrn ? prof.rrn + '******' : '-')],
    ['주    소', emp.address || prof.address || '-'],
    ['소    속', '디자인팀'],
    ['직    위', emp.title],
    ['입 사 일', fmtKDate(emp.joined)],
    ['재 직 기 간', `${fmtKDate(emp.joined)} ~ 현재 (${tenureText(emp.joined)})`],
  ];

  return (
    <div className="doc-a4" style={{
      background: 'white', color: '#1a2340',
      padding: '64px 64px 56px', width: 720, margin: '0 auto',
      fontFamily: 'Pretendard, sans-serif', position: 'relative',
    }}>
      {/* Document number */}
      <div style={{ fontSize: 12, color: '#9ba7c1', fontWeight: 600 }}>
        제 {issueDate.replace(/-/g, '')}-{emp.id.toUpperCase()} 호
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', margin: '36px 0 44px' }}>
        <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '.3em', paddingLeft: '.3em' }}>
          {template.docTitle}
        </div>
      </div>

      {/* Info table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <tbody>
          {rows.map(([k, v], i) => (
            <tr key={i}>
              <td style={{
                border: '1px solid #d4ddec', background: '#f5f8fc',
                padding: '13px 16px', width: 130, fontWeight: 700, color: '#5a6784',
                whiteSpace: 'nowrap', letterSpacing: '.04em',
              }}>{k}</td>
              <td style={{ border: '1px solid #d4ddec', padding: '13px 18px', fontWeight: 600 }}>{v}</td>
            </tr>
          ))}
          <tr>
            <td style={{ border: '1px solid #d4ddec', background: '#f5f8fc', padding: '13px 16px', fontWeight: 700, color: '#5a6784', letterSpacing: '.04em' }}>용    도</td>
            <td style={{ border: '1px solid #d4ddec', padding: '13px 18px', fontWeight: 600 }}>{purpose}</td>
          </tr>
        </tbody>
      </table>

      {/* Statement */}
      <div style={{ marginTop: 48, textAlign: 'center', fontSize: 16, fontWeight: 600, lineHeight: 1.9 }}>
        {template.bodyTemplate}
      </div>

      {/* Issue date */}
      <div style={{ marginTop: 56, textAlign: 'center', fontSize: 16, fontWeight: 700, letterSpacing: '.04em' }}>
        {fmtKDate(issueDate)}
      </div>

      {/* Company / seal */}
      <div style={{ marginTop: 40, textAlign: 'center', lineHeight: 2 }}>
        <div style={{ fontSize: 13, color: '#5a6784', fontWeight: 600 }}>
          사업자등록번호 {template.bizNo} · {template.tel}
        </div>
        <div style={{ fontSize: 13, color: '#5a6784', fontWeight: 600 }}>{template.address}</div>
        <div style={{ marginTop: 20, fontSize: 22, fontWeight: 800, letterSpacing: '.04em', display: 'inline-flex', alignItems: 'center', gap: 14 }}>
          {template.company}
          <span style={{ position: 'relative', fontSize: 18 }}>
            {template.issuerTitle} {template.ceo}
            <span style={{
              position: 'absolute', right: -48, top: '50%', transform: 'translateY(-50%)',
              width: 52, height: 52,
            }}>
              {template.stampImage ? (
                <img src={template.stampImage} alt="seal" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <div style={{
                  width: '100%', height: '100%', borderRadius: '50%',
                  border: '2px solid #d23b4e', color: '#d23b4e',
                  display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800,
                  opacity: .85, lineHeight: 1.1, textAlign: 'center', letterSpacing: 0,
                }}>{template.ceo.slice(-2)}<br/>印</div>
              )}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

// ===== Employee issue view =====
const EmployeeCertificate = ({ currentUserId, template }) => {
  const [purpose, setPurpose] = React.useState(template.purposes[0]);
  const [customPurpose, setCustomPurpose] = React.useState('');
  const [printing, setPrinting] = React.useState(false);
  const effectivePurpose = purpose === '기타' && customPurpose.trim() ? customPurpose.trim() : purpose;

  return (
    <div className="fade-in">
      <div className="no-print">
        <div style={{ marginBottom: 24 }}>
          <div className="eyebrow">CERTIFICATE</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginTop: 8, letterSpacing: '-.02em' }}>재직증명서 발급</h1>
          <div style={{ marginTop: 8, color: 'var(--ink-mute)', fontSize: 14, fontWeight: 500 }}>
            용도를 선택하면 내 정보로 자동 작성됩니다. PDF로 저장해 제출하세요.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start' }}>
          {/* Issue controls */}
          <div className="card">
            <div className="eyebrow" style={{ marginBottom: 12 }}>발급 정보</div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-mute)', marginBottom: 8 }}>발급 목적 (제출처)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {template.purposes.map(p => (
                  <button key={p} onClick={() => setPurpose(p)} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    borderRadius: 10, textAlign: 'left',
                    background: purpose === p ? 'var(--accent-soft)' : 'var(--bg)',
                    border: `1px solid ${purpose === p ? 'var(--accent)' : 'transparent'}`,
                    fontSize: 13, fontWeight: 600,
                    color: purpose === p ? 'var(--accent-dark)' : 'var(--ink-soft)',
                  }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${purpose === p ? 'var(--accent)' : 'var(--ink-mute)'}`,
                      display: 'grid', placeItems: 'center',
                    }}>
                      {purpose === p && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)' }}/>}
                    </div>
                    {p}
                  </button>
                ))}
              </div>
              {purpose === '기타' && (
                <input className="input" style={{ marginTop: 8 }} value={customPurpose}
                  onChange={e => setCustomPurpose(e.target.value)} placeholder="제출처를 입력하세요" />
              )}
            </div>
            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => setPrinting(true)}>
              <Icon name="book" size={14}/> PDF 다운로드 (인쇄)
            </button>
            <div style={{ marginTop: 12, fontSize: 11, color: 'var(--ink-mute)', lineHeight: 1.5, display: 'flex', gap: 6 }}>
              <Icon name="info" size={12}/>
              발급일은 오늘({fmtKDate(TODAY)})로 자동 기재됩니다.
            </div>
          </div>

          {/* Live preview */}
          <div className="card" style={{ padding: 8, background: 'var(--bg)' }}>
            <div style={{ transform: 'scale(.82)', transformOrigin: 'top center' }}>
              <CertificateDocument empId={currentUserId} template={template} purpose={effectivePurpose} issueDate={TODAY} />
            </div>
          </div>
        </div>
      </div>

      {printing && (
        <PrintDocOverlay title={`재직증명서_${window.getEmployee(currentUserId).name}`} onClose={() => setPrinting(false)}>
          <CertificateDocument empId={currentUserId} template={template} purpose={effectivePurpose} issueDate={TODAY} />
        </PrintDocOverlay>
      )}
    </div>
  );
};

// ===== Admin template editor =====
const AdminCertificate = ({ template, onUpdateTemplate, onToast }) => {
  const [draft, setDraft] = React.useState({ ...template });
  const [purposesText, setPurposesText] = React.useState(template.purposes.join('\n'));
  const dirty = JSON.stringify({ ...draft, purposes: purposesText.split('\n').map(s => s.trim()).filter(Boolean) }) !== JSON.stringify(template);

  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  const save = () => {
    const purposes = purposesText.split('\n').map(s => s.trim()).filter(Boolean);
    sessionStorage.setItem('papa_pending_toast', '재직증명서 양식 저장됨');
    onUpdateTemplate({ ...draft, purposes });
  };

  const previewEmp = window.PAPA_DATA.employees.find(e => e.role === 'member')?.id || window.PAPA_DATA.employees[0].id;

  return (
    <div className="fade-in">
      <div className="no-print">
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 24 }}>
          <div>
            <div className="eyebrow">CERTIFICATE TEMPLATE</div>
            <h1 style={{ fontSize: 32, fontWeight: 800, marginTop: 8, letterSpacing: '-.02em' }}>재직증명서 양식 관리</h1>
            <div style={{ marginTop: 8, color: 'var(--ink-mute)', fontSize: 14, fontWeight: 500 }}>
              여기서 등록한 양식으로 직원들이 자동 발급합니다.
            </div>
          </div>
          <button className="btn btn-primary" onClick={save} disabled={!dirty}
            style={{ opacity: dirty ? 1 : .4, cursor: dirty ? 'pointer' : 'not-allowed' }}>
            <Icon name="check" size={14} strokeWidth={2.5}/> 양식 저장
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20, alignItems: 'start' }}>
          {/* Editor */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <CertField label="문서 제목" value={draft.docTitle} onChange={v => set('docTitle', v)} />
            <CertField label="회사명" value={draft.company} onChange={v => set('company', v)} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <CertField label="대표자명" value={draft.ceo} onChange={v => set('ceo', v)} />
              <CertField label="직인 직위" value={draft.issuerTitle} onChange={v => set('issuerTitle', v)} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-mute)', marginBottom: 6 }}>직인 이미지 <span style={{ fontWeight: 500 }}>(선택)</span></div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {draft.stampImage ? (
                  <img src={draft.stampImage} alt="stamp" style={{ width: 44, height: 44, border: '1px solid var(--line)', borderRadius: 6, objectFit: 'contain' }} />
                ) : (
                  <div style={{ width: 44, height: 44, border: '1px dashed var(--ink-mute)', borderRadius: 6, display: 'grid', placeItems: 'center', fontSize: 10, color: 'var(--ink-mute)' }}>미등록</div>
                )}
                <label className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>
                  이미지 등록
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 2 * 1024 * 1024) { alert('2MB 이하 이미지만 가능합니다.'); return; }
                    const reader = new FileReader();
                    reader.onload = () => set('stampImage', reader.result);
                    reader.readAsDataURL(file);
                    e.target.value = '';
                  }} />
                </label>
                {draft.stampImage && (
                  <button className="btn btn-ghost" onClick={() => set('stampImage', null)} style={{ padding: '6px 12px', fontSize: 12, color: 'var(--danger)' }}>삭제</button>
                )}
              </div>
            </div>
            <CertField label="사업자등록번호" value={draft.bizNo} onChange={v => set('bizNo', v)} />
            <CertField label="회사 주소" value={draft.address} onChange={v => set('address', v)} />
            <CertField label="대표 전화" value={draft.tel} onChange={v => set('tel', v)} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-mute)', marginBottom: 6 }}>증명 문구</div>
              <textarea className="input" rows="2" value={draft.bodyTemplate}
                onChange={e => set('bodyTemplate', e.target.value)} style={{ resize: 'vertical', fontFamily: 'inherit' }}/>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-mute)', marginBottom: 6 }}>발급 목적 목록 <span style={{ fontWeight: 500 }}>(한 줄에 하나)</span></div>
              <textarea className="input" rows="5" value={purposesText}
                onChange={e => setPurposesText(e.target.value)} style={{ resize: 'vertical', fontFamily: 'inherit' }}/>
            </div>
          </div>

          {/* Live preview */}
          <div className="card" style={{ padding: 8, background: 'var(--bg)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-mute)', padding: '6px 10px' }}>
              미리보기 — {window.getEmployee(previewEmp).name} 직원 기준
            </div>
            <div style={{ transform: 'scale(.82)', transformOrigin: 'top center' }}>
              <CertificateDocument
                empId={previewEmp}
                template={{ ...draft, purposes: purposesText.split('\n').map(s => s.trim()).filter(Boolean) }}
                purpose={(purposesText.split('\n').map(s => s.trim()).filter(Boolean)[0]) || '제출용'}
                issueDate={TODAY} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CertField = ({ label, value, onChange }) => (
  <div>
    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-mute)', marginBottom: 6 }}>{label}</div>
    <input className="input" value={value || ''} onChange={e => onChange(e.target.value)} />
  </div>
);

// ===== Router =====
const CertificatePage = (props) => {
  if (props.role === 'admin') return <AdminCertificate {...props} />;
  return <EmployeeCertificate {...props} />;
};

Object.assign(window, { CertificatePage, CertificateDocument });
