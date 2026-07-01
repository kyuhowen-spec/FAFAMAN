// Quote Generation Page
const LABOR_RATES = {
  '특급': 509113,
  '고급': 426833,
  '중급': 421246,
  '초급': 370984,
};

const QuotePage = ({ currentUserId }) => {
  const [projectTitle, setProjectTitle] = React.useState('');
  const [clientInfo, setClientInfo] = React.useState({
    client: '',
    job: '',
    jobNo: '',
    contact: '',
  });
  const [providerInfo, setProviderInfo] = React.useState({
    company: '주식회사 파운드파운디드',
    ceo: '송규호, 김준구',
    regNo: '4178152985',
    address: '서울시 마포구 연남로1길 8-4, 3층',
    contact: '송규호 / 010-5660-7220',
  });

  const [sections, setSections] = React.useState([
    {
      id: 's1',
      name: '디자인 기획',
      period: '1W',
      note: '',
      rows: [
        { id: 'r1_1', item: '디자인 기획', level: '특급', count: 0, days: 15, effort: 25 },
        { id: 'r1_2', item: '', level: '고급', count: 0, days: 15, effort: 100 },
        { id: 'r1_3', item: '', level: '중급', count: 0, days: 15, effort: 100 },
        { id: 'r1_4', item: '', level: '초급', count: 0, days: 15, effort: 100 },
      ]
    },
    {
      id: 's2',
      name: '제품 디자인',
      period: '1W',
      note: '',
      rows: [
        { id: 'r2_1', item: '제품 디자인', level: '특급', count: 0, days: 50, effort: 50 },
        { id: 'r2_2', item: '', level: '고급', count: 0, days: 50, effort: 70 },
        { id: 'r2_3', item: '', level: '중급', count: 0, days: 50, effort: 80 },
        { id: 'r2_4', item: '', level: '초급', count: 0, days: 50, effort: 100 },
      ]
    }
  ]);

  const [editMode, setEditMode] = React.useState(false);

  const updateClientInfo = (key, val) => setClientInfo(prev => ({ ...prev, [key]: val }));
  const updateProviderInfo = (key, val) => setProviderInfo(prev => ({ ...prev, [key]: val }));
  
  const updateSection = (sId, key, val) => {
    setSections(prev => prev.map(s => s.id === sId ? { ...s, [key]: val } : s));
  };
  const updateRow = (sId, rId, key, val) => {
    setSections(prev => prev.map(s => {
      if (s.id !== sId) return s;
      return {
        ...s,
        rows: s.rows.map(r => r.id === rId ? { ...r, [key]: val } : r)
      };
    }));
  };
  const addRow = (sId) => {
    setSections(prev => prev.map(s => {
      if (s.id !== sId) return s;
      return {
        ...s,
        rows: [...s.rows, { id: `r_${Date.now()}`, item: '', level: '초급', count: 1, days: 10, effort: 100 }]
      };
    }));
  };
  const deleteRow = (sId, rId) => {
    setSections(prev => prev.map(s => {
      if (s.id !== sId) return s;
      return {
        ...s,
        rows: s.rows.filter(r => r.id !== rId)
      };
    }));
  };
  const [savedQuotes, setSavedQuotes] = React.useState(() => {
    try {
      const stored = localStorage.getItem('papa_saved_quotes');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const handleSaveQuote = () => {
    if (!clientInfo.job) {
      alert('프로젝트 명(JOB)을 먼저 입력해주세요.');
      return;
    }
    const newQuote = {
      id: Date.now(),
      date: new Date().toISOString(),
      clientInfo,
      providerInfo,
      sections,
      finalQuote
    };
    const updated = [newQuote, ...savedQuotes];
    setSavedQuotes(updated);
    localStorage.setItem('papa_saved_quotes', JSON.stringify(updated));
    alert('견적이 저장되었습니다.');
  };

  const loadQuote = (quote) => {
    if (window.confirm('해당 견적을 불러오시겠습니까? 현재 작성 중인 내용은 덮어씌워집니다.')) {
      setClientInfo(quote.clientInfo);
      setProviderInfo(quote.providerInfo);
      setSections(quote.sections);
      alert('견적을 불러왔습니다.');
    }
  };

  const deleteSavedQuote = (id) => {
    if (window.confirm('정말로 이 견적을 삭제하시겠습니까?')) {
      const updated = savedQuotes.filter(q => q.id !== id);
      setSavedQuotes(updated);
      localStorage.setItem('papa_saved_quotes', JSON.stringify(updated));
    }
  };

  const addSection = () => {
    setSections(prev => [
      ...prev,
      {
        id: `s_${Date.now()}`,
        name: '새로운 항목',
        period: '1W',
        note: '',
        rows: [
          { id: `r_${Date.now()}_1`, item: '', level: '고급', count: 0, days: 5, effort: 100 }
        ]
      }
    ]);
  };
  const deleteSection = (sId) => {
    setSections(prev => prev.filter(s => s.id !== sId));
  };

  const calculateRowTotal = (row, sectionDays) => {
    const amount = (LABOR_RATES[row.level] || 0) * (row.count || 0);
    const effortMultiplier = (row.effort || 0) / 100;
    return amount * sectionDays * effortMultiplier;
  };

  let grandTotal = 0;
  const sectionsWithTotals = sections.map(s => {
    const weeks = parseInt(s.period.replace(/\D/g, '')) || 0;
    const computedDays = weeks * 5;
    const subtotal = s.rows.reduce((sum, r) => sum + calculateRowTotal(r, computedDays), 0);
    grandTotal += subtotal;
    return { ...s, subtotal, computedDays };
  });

  const finalQuote = Math.floor(grandTotal / 100000) * 100000; 

  const handlePrint = () => {
    window.print();
  };

  const formatMoney = (num) => {
    return Math.round(num).toLocaleString('ko-KR');
  };

  return (
    <>
      <style>{`
        @page { size: auto; margin: 0mm; }
        @media print {
          body * { visibility: hidden !important; }
          #quote-print-area, #quote-print-area * { visibility: visible !important; }
          #quote-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }
          .no-print { display: none !important; }
          .quote-page { padding: 0 !important; background: white !important; }
          
          .q-table { border-collapse: collapse; width: 100%; font-size: 10px !important; margin-bottom: 20px; font-family: 'Pretendard', sans-serif; }
          .q-table th, .q-table td { border: 1px solid #000; padding: 4px 3px; text-align: center; }
          .q-table th { font-weight: 700; }
          
          .q-header { text-align: center; font-size: 16px; font-weight: 800; margin-bottom: 8px; font-family: 'Pretendard', sans-serif;}
          .q-bg-green { background-color: #00FF00 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .q-bg-gray { background-color: #E2E2E2 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        
        .quote-page { max-width: 1200px; margin: 0 auto; padding-bottom: 100px; }
        
        .q-table { border-collapse: collapse; width: 100%; font-size: 12px; margin-bottom: 20px; color: #000; }
        .q-table th, .q-table td { border: 1px solid #333; padding: 8px 6px; text-align: center; vertical-align: middle; }
        .q-table th { font-weight: 700; }
        .q-bg-green { background-color: #00FF00; }
        .q-bg-gray { background-color: #E2E2E2; }
        
        .q-input { width: 100%; border: none; background: transparent; font-family: inherit; font-size: inherit; text-align: inherit; }
        .q-input:focus { outline: 1px solid var(--accent); background: #f9f9f9; }
        .q-input-multiline { width: 100%; border: none; background: transparent; font-family: inherit; font-size: inherit; text-align: left; resize: none; overflow: hidden; }
        .q-input-multiline:focus { outline: 1px solid var(--accent); background: #f9f9f9; }
        
        .q-btn-add { font-size: 11px; padding: 2px 6px; border-radius: 4px; border: 1px solid var(--line); background: var(--surface); cursor: pointer; color: var(--ink-soft); }
        .q-btn-add:hover { background: var(--line); }
        
        .q-btn-del { font-size: 11px; color: var(--danger); background: transparent; border: none; cursor: pointer; opacity: 0.5; }
        .q-btn-del:hover { opacity: 1; text-decoration: underline; }
      `}</style>
      
      <div className="quote-page">
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 12 }}>
          <div>
            <div className="eyebrow">QUOTE</div>
            <h1 style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-.04em', marginTop: 8, lineHeight: 1 }}>견적서 작성</h1>
            <div style={{ color: 'var(--ink-soft)', fontSize: 17, marginTop: 10, fontWeight: 500 }}>인건비 기반 견적서를 작성하고 PDF로 출력할 수 있습니다.</div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn" style={{ background: '#00FF00', color: '#000', borderColor: '#00DD00' }} onClick={() => setEditMode(!editMode)}>
              <Icon name={editMode ? 'eye' : 'wand'} size={16} />
              {editMode ? '미리보기' : '작성 모드'}
            </button>
            <button className="btn btn-primary" onClick={handleSaveQuote}>
              <Icon name="save" size={16} />
              견적 저장
            </button>
            {!editMode && (
              <button className="btn btn-primary" onClick={handlePrint}>
                <Icon name="printer" size={16} />
                PDF 인쇄
              </button>
            )}
          </div>
        </div>

        <div id="quote-print-area" style={{ background: 'white', padding: '20px 40px', color: 'black', minHeight: 800, border: '1px solid var(--line)', borderRadius: 12 }}>
          
          <div className="q-header" style={{ fontSize: 24, fontWeight: 900, marginBottom: 20 }}>
            {editMode ? (
              <input className="q-input" style={{ fontSize: 24, fontWeight: 900, textAlign: 'center' }} placeholder="프로젝트 명을 입력하세요" value={clientInfo.job} onChange={e => updateClientInfo('job', e.target.value)} />
            ) : (clientInfo.job || '프로젝트 명')}
          </div>

          <table className="q-table" style={{ marginBottom: 10 }}>
            <tbody>
              <tr>
                <td colSpan={2} className="q-bg-green" style={{ width: '50%' }}>공급받는자</td>
                <td colSpan={2} className="q-bg-green" style={{ width: '50%' }}>공급자</td>
              </tr>
              <tr>
                <td>CLIENT</td>
                <td>
                  {editMode ? <input className="q-input" value={clientInfo.client} onChange={e => updateClientInfo('client', e.target.value)} /> : clientInfo.client}
                </td>
                <td>회사명</td>
                <td>
                  {editMode ? <input className="q-input" value={providerInfo.company} onChange={e => updateProviderInfo('company', e.target.value)} /> : providerInfo.company}
                </td>
              </tr>
              <tr>
                <td>JOB</td>
                <td>
                  {editMode ? <input className="q-input" value={clientInfo.job} onChange={e => updateClientInfo('job', e.target.value)} /> : clientInfo.job}
                </td>
                <td>대표이사</td>
                <td>
                  {editMode ? <input className="q-input" value={providerInfo.ceo} onChange={e => updateProviderInfo('ceo', e.target.value)} /> : providerInfo.ceo}
                </td>
              </tr>
              <tr>
                <td>사업자등록번호</td>
                <td>
                  {editMode ? <input className="q-input" value={clientInfo.jobNo} onChange={e => updateClientInfo('jobNo', e.target.value)} /> : clientInfo.jobNo}
                </td>
                <td>사업자등록번호</td>
                <td>
                  {editMode ? <input className="q-input" value={providerInfo.regNo} onChange={e => updateProviderInfo('regNo', e.target.value)} /> : providerInfo.regNo}
                </td>
              </tr>
              <tr>
                <td>거래가격</td>
                <td style={{ fontWeight: 700 }}>
                  {formatMoney(finalQuote)} <span style={{ fontSize: 10, fontWeight: 400 }}>(VAT별도)</span>
                </td>
                <td>사업장주소</td>
                <td>
                  {editMode ? <input className="q-input" value={providerInfo.address} onChange={e => updateProviderInfo('address', e.target.value)} /> : providerInfo.address}
                </td>
              </tr>
              <tr>
                <td>담당자/연락처</td>
                <td>
                  {editMode ? <input className="q-input" value={clientInfo.contact} onChange={e => updateClientInfo('contact', e.target.value)} /> : clientInfo.contact}
                </td>
                <td>담당자/연락처</td>
                <td>
                  {editMode ? <input className="q-input" value={providerInfo.contact} onChange={e => updateProviderInfo('contact', e.target.value)} /> : providerInfo.contact}
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, margin: '24px 0' }}>
            아래와 같이 견적합니다.
          </div>

          <div style={{ textAlign: 'right', fontSize: 10, marginBottom: 4 }}>( 단위 : KRW )</div>

          <table className="q-table">
            <thead>
              <tr className="q-bg-green">
                <th style={{width: '10%'}}>구분</th>
                <th style={{width: '10%'}}>인력 구분</th>
                <th style={{width: '6%'}}>인원</th>
                <th style={{width: '10%'}}>금액</th>
                <th style={{width: '6%'}}>일수</th>
                <th style={{width: '8%'}}>투입률</th>
                <th style={{width: '12%'}}>최종금액</th>
                <th style={{width: '6%'}}>기간(W)</th>
                <th style={{width: '32%'}}>비고</th>
              </tr>
            </thead>
            <tbody>
              {sectionsWithTotals.map((s, sIdx) => {
                const isFirstRowOfFirstSection = sIdx === 0;
                return (
                  <React.Fragment key={s.id}>
                    {s.rows.map((r, rIdx) => {
                      const isFirstRow = rIdx === 0;
                      const amount = (LABOR_RATES[r.level] || 0) * (r.count || 0);
                      const finalAmount = calculateRowTotal(r, s.computedDays);
                      
                      return (
                        <tr key={r.id}>
                          {isFirstRow && (
                            <td rowSpan={s.rows.length}>
                              {editMode ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                                  <input className="q-input" style={{ textAlign: 'center' }} value={s.name} onChange={e => updateSection(s.id, 'name', e.target.value)} />
                                  <button className="q-btn-add no-print" onClick={() => deleteSection(s.id)}>섹션 삭제</button>
                                </div>
                              ) : s.name}
                            </td>
                          )}
                          <td>
                            {editMode ? (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <select className="q-input" style={{ width: '80%' }} value={r.level} onChange={e => updateRow(s.id, r.id, 'level', e.target.value)}>
                                  <option value="특급">특급 기술자</option>
                                  <option value="고급">고급 기술자</option>
                                  <option value="중급">중급 기술자</option>
                                  <option value="초급">초급 기술자</option>
                                </select>
                                <button className="q-btn-del no-print" onClick={() => deleteRow(s.id, r.id)}>X</button>
                              </div>
                            ) : `${r.level} 기술자`}
                          </td>
                          <td>
                            {editMode ? <input className="q-input" type="number" value={r.count} onChange={e => updateRow(s.id, r.id, 'count', Number(e.target.value))} /> : (r.count === 0 ? '-' : r.count)}
                          </td>
                          <td style={{ textAlign: 'right' }}>{formatMoney(amount)}</td>
                          <td>
                            {s.computedDays}
                          </td>
                          <td>
                            {editMode ? <input className="q-input" type="number" value={r.effort} onChange={e => updateRow(s.id, r.id, 'effort', Number(e.target.value))} /> : `${r.effort}%`}
                          </td>
                          <td style={{ textAlign: 'right' }}>{formatMoney(finalAmount)}</td>
                          
                          {isFirstRow && (
                            <td rowSpan={s.rows.length}>
                              {editMode ? <input className="q-input" style={{ textAlign: 'center' }} value={s.period} onChange={e => updateSection(s.id, 'period', e.target.value)} /> : s.period}
                            </td>
                          )}
                          {isFirstRow && (
                            <td rowSpan={s.rows.length} style={{ textAlign: 'left', verticalAlign: 'top', padding: '6px' }}>
                              {editMode ? (
                                <textarea className="q-input-multiline" style={{ minHeight: 60 }} value={s.note} onChange={e => updateSection(s.id, 'note', e.target.value)} />
                              ) : (
                                s.note.split('\n').map((line, i) => <div key={i}>{line}</div>)
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    <tr className="q-bg-gray">
                      <td colSpan={6} style={{ fontWeight: 700 }}>
                        {s.name} 소계
                        {editMode && <button className="q-btn-add no-print" style={{ marginLeft: 12 }} onClick={() => addRow(s.id)}>+ 행 추가</button>}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatMoney(s.subtotal)}</td>
                      <td colSpan={2} style={{ textAlign: 'left', fontSize: 11, color: '#555', paddingLeft: 12 }}>*직접경비, 제경비, 기술료가 포함된 견적입니다.</td>
                    </tr>
                  </React.Fragment>
                );
              })}
              
              <tr className="q-bg-gray">
                <td colSpan={6} style={{ fontWeight: 700 }}>소계</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatMoney(grandTotal)}</td>
                <td colSpan={2} style={{ textAlign: 'left', fontWeight: 700, borderLeft: 'none' }}>원</td>
              </tr>
              <tr className="q-bg-green">
                <td colSpan={6} style={{ fontWeight: 700 }}>최종 견적</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatMoney(finalQuote)}</td>
                <td colSpan={2} style={{ textAlign: 'left', fontWeight: 700, borderLeft: 'none' }}>원</td>
              </tr>
            </tbody>
          </table>

          {editMode && (
            <div className="no-print" style={{ textAlign: 'center', marginBottom: 20 }}>
              <button className="btn" onClick={addSection}>+ 섹션 추가</button>
            </div>
          )}

          <div style={{ textAlign: 'center', fontSize: 10, color: '#666', marginBottom: 30, lineHeight: 1.5 }}>
            ※ 당사는 본 견적서에 당사의 원가 또는 원가를 추정할 수 있는 정보를 기입하지 않았으며,<br/>
            이 밖에 당사의 원가 또는 원가를 추정할 수 있는 자료를 제출하지 않았음을 확인합니다.
          </div>

          <div className="no-print" style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>디자이너 인건비</div>
          <div className="no-print" style={{ textAlign: 'center', fontSize: 10, marginBottom: 4 }}>* 참고자료 : 디자이너 등급별 노임단가 기준 (2026)</div>
          
          <table className="q-table no-print" style={{ width: '60%', marginBottom: 0 }}>
            <thead>
              <tr className="q-bg-gray">
                <th>항목</th>
                <th>구분</th>
                <th>직접인건비</th>
                <th>직접경비</th>
                <th>제경비</th>
                <th>기술료</th>
                <th>최종 비용</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td rowSpan={4}>디자이너 인건비</td>
                <td>특급 기술자</td>
                <td style={{ textAlign: 'right' }}>265,163</td>
                <td style={{ textAlign: 'right' }}>26,516</td>
                <td style={{ textAlign: 'right' }}>79,549</td>
                <td style={{ textAlign: 'right' }}>137,885</td>
                <td style={{ textAlign: 'right' }}>509,113</td>
              </tr>
              <tr>
                <td>고급 기술자</td>
                <td style={{ textAlign: 'right' }}>222,309</td>
                <td style={{ textAlign: 'right' }}>22,231</td>
                <td style={{ textAlign: 'right' }}>66,693</td>
                <td style={{ textAlign: 'right' }}>115,601</td>
                <td style={{ textAlign: 'right' }}>426,833</td>
              </tr>
              <tr>
                <td>중급 기술자</td>
                <td style={{ textAlign: 'right' }}>219,399</td>
                <td style={{ textAlign: 'right' }}>21,940</td>
                <td style={{ textAlign: 'right' }}>65,820</td>
                <td style={{ textAlign: 'right' }}>114,087</td>
                <td style={{ textAlign: 'right' }}>421,246</td>
              </tr>
              <tr>
                <td>초급 기술자</td>
                <td style={{ textAlign: 'right' }}>193,221</td>
                <td style={{ textAlign: 'right' }}>19,322</td>
                <td style={{ textAlign: 'right' }}>57,966</td>
                <td style={{ textAlign: 'right' }}>100,475</td>
                <td style={{ textAlign: 'right' }}>370,984</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="no-print" style={{ marginTop: 60 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>저장된 견적</h2>
          {savedQuotes.length === 0 ? (
            <div style={{ padding: 40, background: 'var(--surface)', borderRadius: 12, textAlign: 'center', color: 'var(--ink-soft)' }}>
              저장된 견적이 없습니다.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {savedQuotes.map(q => (
                <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: 24, borderRadius: 12, border: '1px solid var(--line)', color: 'black' }}>
                  <div>
                    <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
                      {new Date(q.date).toLocaleString('ko-KR')}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>
                      {q.clientInfo?.job || '이름 없는 견적'}
                    </div>
                    <div style={{ fontSize: 14, color: '#444', marginTop: 8 }}>
                      클라이언트: <strong>{q.clientInfo?.client || '미상'}</strong> <span style={{color:'#ccc', margin:'0 8px'}}>|</span>
                      최종 견적: <strong style={{color:'#00C853'}}>{formatMoney(q.finalQuote)}</strong> 원
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn" onClick={() => loadQuote(q)}>불러오기</button>
                    <button className="btn" style={{ color: '#F44336', borderColor: '#F44336' }} onClick={() => deleteSavedQuote(q.id)}>삭제</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
