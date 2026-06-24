// Side widgets: LateCounter, LeaveBalance, ApprovalPending
const LateCounter = ({ empId, counter, onReport, penalty }) => {
  const isDanger = counter >= 4;
  const isWarn = counter >= 3;
  const today = window.PAPA_DATA.today.date;
  const inPenalty = penalty && penalty.startDate <= today && today <= penalty.endDate;
  return (
    <div className="card fade-in" style={{
      background: inPenalty ? 'var(--danger)' : isDanger ? 'var(--danger)' : 'var(--surface)',
      color: (inPenalty || isDanger) ? 'white' : 'inherit',
      position: 'relative', overflow: 'hidden',
    }}>
      {(inPenalty || isDanger) && (
        <div style={{
          position: 'absolute', top: -20, right: -10,
          fontSize: 180, fontWeight: 900, lineHeight: 1,
          color: 'rgba(255,255,255,.08)',
          pointerEvents: 'none',
        }}>🔥</div>
      )}
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="eyebrow" style={{ color: (inPenalty || isDanger) ? 'rgba(255,255,255,.72)' : undefined }}>
            지각 카운터
          </div>
          {(inPenalty || isDanger) && <Icon name="flame" size={18} />}
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 10 }}>
          <div style={{
            fontSize: 72, fontWeight: 800, letterSpacing: '-.05em', lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}>{counter}</div>
          <div style={{ fontSize: 20, fontWeight: 700, opacity: .6 }}>/ 5</div>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 6 }}>
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{
              flex: 1, height: 8, borderRadius: 999,
              background: i < counter
                ? ((inPenalty || isDanger) ? 'white' : isWarn ? 'var(--danger)' : 'var(--warn)')
                : ((inPenalty || isDanger) ? 'rgba(255,255,255,.2)' : 'var(--line)'),
              transition: 'background .3s',
            }}/>
          ))}
        </div>

        {inPenalty ? (
          <div style={{
            marginTop: 14, padding: '12px 14px',
            borderRadius: 10,
            background: 'rgba(255,255,255,.16)',
            border: '1px solid rgba(255,255,255,.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>
              <Icon name="alert-triangle" size={12}/>
              벌칙 근태 적용 중
            </div>
            <div style={{ marginTop: 6, fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>
              매일 10시 출근 고정
            </div>
            <div style={{ marginTop: 4, fontSize: 11, fontWeight: 600, opacity: .82, fontVariantNumeric: 'tabular-nums' }}>
              {penalty.startDate.slice(5).replace('-','.')} – {penalty.endDate.slice(5).replace('-','.')}
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 14, fontSize: 13,
            color: isDanger ? 'rgba(255,255,255,.85)' : 'var(--ink-soft)',
            lineHeight: 1.5,
          }}>
            {isDanger
              ? '⚠️ 벌칙 시행 직전 — 다음 지각 시 1주 10시 출근 고정'
              : isWarn
              ? '5회 도달 시 1주 10시 출근 고정돼요'
              : '여유 있습니다. 계속 이렇게!'}
          </div>
        )}

        <div style={{
          marginTop: 16, padding: '10px 12px',
          borderRadius: 10,
          background: (inPenalty || isDanger) ? 'rgba(255,255,255,.12)' : 'var(--bg)',
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 11, fontWeight: 600,
          color: (inPenalty || isDanger) ? 'rgba(255,255,255,.82)' : 'var(--ink-mute)',
        }}>
          <Icon name="check" size={12}/>
          체크인 시각 기준 자동 기록
        </div>
      </div>
    </div>
  );
};

const LeaveBalance = ({ balance }) => {
  if (!balance) return null;
  const { total, used, refresh, refreshUsed, tenure } = balance;
  const remaining = total - used;
  const pct = Math.min(100, Math.round((used / total) * 100));
  return (
    <div className="card fade-in" style={{ gridColumn: 'span 1' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="eyebrow">연차 잔여</div>
        <span className="pill pill-member">{tenure}년차</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 10 }}>
        <div style={{
          fontSize: 72, fontWeight: 800, letterSpacing: '-.05em', lineHeight: 1,
          color: 'var(--accent)',
        }}>{remaining}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-mute)' }}>일</div>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--ink-mute)', fontWeight: 600 }}>
          / {total}일
        </div>
      </div>

      <div className="bar" style={{ marginTop: 16 }}>
        <div className="bar-fill" style={{ width: `${pct}%` }}/>
      </div>

      <div style={{
        marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
        fontSize: 12,
      }}>
        <div>
          <div style={{ color: 'var(--ink-mute)', fontWeight: 600, fontSize: 11 }}>사용</div>
          <div style={{ fontWeight: 700, marginTop: 2 }}>{used}일</div>
        </div>
        {refresh > 0 && (
          <div>
            <div style={{ color: 'var(--ok-ink)', fontWeight: 600, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="sparkles" size={11}/> 리프레시
            </div>
            <div style={{ fontWeight: 700, marginTop: 2, color: 'var(--ok-ink)' }}>{refresh - refreshUsed}일</div>
          </div>
        )}
      </div>
    </div>
  );
};

const ApprovalPending = ({ role, approvals, currentUserId, onApprove, onReject }) => {
  if (role === 'member') {
    // Member sees their own outgoing requests
    const mine = approvals.filter(a => a.empId === currentUserId);
    return (
      <div className="card fade-in">
        <div className="eyebrow">내 결재 진행</div>
        <div style={{ marginTop: 14 }}>
          {mine.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--ink-mute)', padding: '20px 0', textAlign: 'center' }}>
              진행 중인 신청이 없어요
            </div>
          ) : mine.map(a => (
            <MyApprovalCard key={a.id} approval={a} />
          ))}
        </div>
      </div>
    );
  }

  // senior & admin: pending queue
  const visible = approvals.filter(a => {
    if (role === 'senior') return a.stage === 'pending_senior' && a.assignedSenior === currentUserId;
    if (role === 'admin') return a.stage === 'pending_senior' || a.stage === 'pending_admin';
    return false;
  });

  return (
    <div className="card fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="eyebrow">결재 대기</div>
        <span className="pill pill-danger">{visible.length}건</span>
      </div>
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 240, overflow: 'auto' }}>
        {visible.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--ink-mute)', padding: '20px 0', textAlign: 'center' }}>
            대기 중인 결재가 없어요 🎉
          </div>
        ) : visible.map(a => (
          <ApprovalCard key={a.id} approval={a} role={role} onApprove={onApprove} onReject={onReject} />
        ))}
      </div>
    </div>
  );
};

const MyApprovalCard = ({ approval }) => {
  const stageMap = {
    pending_senior: { label: '시니어 결재 대기', color: 'pill-warn', step: 1 },
    pending_admin:  { label: '관리자 결재 대기', color: 'pill-warn', step: 2 },
    approved:       { label: '승인 완료',        color: 'pill-ok',   step: 3 },
    rejected:       { label: '반려',             color: 'pill-danger', step: 0 },
  };
  const s = stageMap[approval.stage];
  return (
    <div style={{
      padding: 14, borderRadius: 12, background: 'var(--bg)',
      marginBottom: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>
          {approval.type} · {approval.days}일
        </div>
        <span className={`pill ${s.color}`}>{s.label}</span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 4 }}>
        {approval.start}{approval.end !== approval.start ? ` ~ ${approval.end}` : ''}
      </div>
      {/* 3-step bar */}
      <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
        {[1,2,3].map(i => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 999,
            background: i <= s.step ? 'var(--accent)' : 'var(--line)',
          }}/>
        ))}
      </div>
    </div>
  );
};

const ApprovalCard = ({ approval, role, onApprove, onReject }) => {
  const emp = getEmployee(approval.empId);
  const isLunch = approval.isLunch;
  const slotLabel = approval.lunchSlot === 'early' ? '12:00 – 13:30' : approval.lunchSlot === 'late' ? '12:30 – 14:00' : null;
  const dateLabel = isLunch
    ? (approval.start === window.PAPA_DATA.today.date ? '오늘' : approval.start.slice(5).replace('-', '/'))
    : approval.start === approval.end
      ? approval.start.slice(5).replace('-', '/')
      : `${approval.start.slice(5).replace('-', '/')} ~ ${approval.end.slice(5).replace('-', '/')}`;
  const stageLabel = approval.stage === 'pending_senior' ? (isLunch ? '시니어 결재' : '1차 · 시니어') : '최종 · 관리자';
  const canAct = (role === 'senior' && approval.stage === 'pending_senior')
              || (role === 'admin'  && approval.stage === 'pending_admin')
              || (role === 'admin'  && approval.stage === 'pending_senior' && emp.role === 'senior');

  return (
    <div style={{
      padding: 14, borderRadius: 12,
      border: '1px solid var(--line)',
      transition: 'border-color .15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar empId={approval.empId} size="sm" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{emp.name} <span style={{ color: 'var(--ink-mute)', fontWeight: 500 }}>· {emp.title}</span></div>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2 }}>{stageLabel}</div>
        </div>
        <span className={`pill ${isLunch ? 'pill-warn' : 'pill-member'}`}>{approval.type}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--ink-mute)', fontWeight: 600 }}>{isLunch ? '시간대' : '기간'}</div>
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
            {isLunch ? slotLabel : dateLabel}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--ink-mute)', fontWeight: 600 }}>{isLunch ? '날짜' : '일수'}</div>
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{isLunch ? dateLabel : `${approval.days}일`}</div>
        </div>
      </div>
      {approval.reason && (
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ink-soft)', padding: '8px 10px', background: 'var(--bg)', borderRadius: 8 }}>
          "{approval.reason}"
        </div>
      )}
      {canAct && (
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          <button className="btn btn-primary" style={{ flex: 1, padding: '8px 12px', fontSize: 13 }}
            onClick={() => onApprove(approval.id)}>
            <Icon name="check" size={14} /> 승인
          </button>
          <button className="btn" style={{ flex: 1, padding: '8px 12px', fontSize: 13, background: 'var(--danger-soft)', color: 'var(--danger)', border: '1px solid transparent' }}
            onClick={() => onReject(approval.id)}>
            <Icon name="x" size={14} /> 반려
          </button>
        </div>
      )}
    </div>
  );
};

Object.assign(window, { LateCounter, LeaveBalance, ApprovalPending });
