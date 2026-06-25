// Lunch 1.5h request modal
const LunchRequestForm = ({ onClose, onSubmit, me }) => {
  const [slot, setSlot] = React.useState('early');
  const [note, setNote] = React.useState('');
  const needsSenior = me.role === 'member';
  const availableSeniors = window.PAPA_DATA.employees.filter(e => e.role === 'senior' && e.id !== me.id);
  const [assignedSenior, setAssignedSenior] = React.useState(availableSeniors[0]?.id || null);
  const now = new Date();
  const hour = now.getHours();
  const isLateRequest = hour >= 11;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--warn-ink)' }}>🍚 LUNCH 1.5H</div>
            <div className="h1" style={{ marginTop: 6 }}>점심 1.5시간 신청</div>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ background: 'var(--bg)' }}>
            <Icon name="x" size={16} />
          </button>
        </div>

        <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 16, lineHeight: 1.6 }}>
          11시 전까지 신청해 주세요. 30분 연장 근무로 상쇄되며, 식사 중에는 변경할 수 없어요.
        </div>

        {isLateRequest && (
          <div style={{
            padding: '10px 14px', borderRadius: 10,
            background: 'var(--danger-soft)', color: 'var(--danger-ink)',
            fontSize: 12, fontWeight: 600, marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Icon name="alert-triangle" size={14}/>
            11시가 지나 일반적인 신청 시간은 넘었어요. 리더 확인 후 승인될 수 있어요.
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>시간대 선택</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { k: 'early', label: '12:00 – 13:30', note: '점심 일찍, 오후 업무로 바로' },
              { k: 'late',  label: '12:30 – 14:00', note: '오전 조금 더 집중, 늦은 점심' },
            ].map(opt => (
              <button key={opt.k} onClick={() => setSlot(opt.k)} style={{
                padding: '14px 16px', borderRadius: 12,
                background: slot === opt.k ? 'var(--accent-soft)' : 'var(--bg)',
                border: `1px solid ${slot === opt.k ? 'var(--accent)' : 'transparent'}`,
                display: 'flex', alignItems: 'center', gap: 14,
                justifyContent: 'flex-start', textAlign: 'left',
                transition: 'all .15s',
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  border: `2px solid ${slot === opt.k ? 'var(--accent)' : 'var(--ink-mute)'}`,
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                }}>
                  {slot === opt.k && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }}/>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-.02em',
                    color: slot === opt.k ? 'var(--accent-dark)' : 'var(--ink)',
                    fontVariantNumeric: 'tabular-nums' }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2, fontWeight: 500 }}>
                    {opt.note}
                  </div>
                </div>
                <span className="pill pill-mute" style={{ fontSize: 10 }}>90분</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>메모 <span style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--ink-mute)', fontWeight: 500 }}>(선택)</span></div>
          <input type="text" className="input" placeholder="예: 인근 파스타 집에서 기획 미팅 겸 런치해요"
            value={note} onChange={e => setNote(e.target.value)} maxLength={60} />
        </div>

        {needsSenior && (
          <SeniorPicker
            value={assignedSenior}
            onChange={setAssignedSenior}
            currentUserId={me.id}
            label="결재 팀장 선택"
          />
        )}

        <div style={{
          padding: 14, borderRadius: 12, background: 'var(--warn-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 12, color: 'var(--warn-ink)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="inbox" size={14}/>
            {needsSenior
              ? (assignedSenior ? `${getEmployee(assignedSenior).name.replace(/^./, '')} 팀장에게 신청됩니다` : '결재 팀장을 선택해 주세요')
              : '팀장 권한으로 자동 승인됩니다'} · 30분 연장 근무 상쇄
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-lg" onClick={onClose} style={{ flex: 1 }}>취소</button>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => onSubmit({ slot, note, assignedSenior: needsSenior ? assignedSenior : null })}
            disabled={needsSenior && !assignedSenior}
            style={{ flex: 2, opacity: (needsSenior && !assignedSenior) ? .4 : 1, cursor: (needsSenior && !assignedSenior) ? 'not-allowed' : 'pointer' }}
          >
            신청하기
          </button>
        </div>
      </div>
    </div>
  );
};

window.LunchRequestForm = LunchRequestForm;
