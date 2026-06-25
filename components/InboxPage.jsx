// 결재함 (Inbox) — card grid + slide-in detail panel
const InboxPage = ({ role, currentUserId, approvals, onApprove, onReject, onSelectMember }) => {
  const [tab, setTab] = React.useState('pending'); // pending | done | mine
  const [filter, setFilter] = React.useState('all'); // all | leave | half | refresh | lunch
  const [selected, setSelected] = React.useState(null);
  const [rejectMode, setRejectMode] = React.useState(false);
  const [rejectMsg, setRejectMsg] = React.useState('');

  // Auto-select first card whenever tab/filter changes
  const filterFn = (a) => {
    if (filter === 'all') return true;
    if (filter === 'leave') return a.type === '연차';
    if (filter === 'half') return a.type === '반차';
    if (filter === 'refresh') return a.type === '리프레시';
    if (filter === 'lunch') return a.isLunch;
    if (filter === 'overtime') return a.isOvertime;
    return true;
  };

  const tabFn = (a) => {
    if (tab === 'pending') {
      if (role === 'senior') return a.stage === 'pending_senior' && a.assignedSenior === currentUserId;
      if (role === 'admin')  return a.stage === 'pending_senior' || a.stage === 'pending_admin';
    }
    if (tab === 'done')  return a.stage === 'approved' || a.stage === 'rejected';
    if (tab === 'mine')  return a.empId === currentUserId;
    return false;
  };

  const list = approvals.filter(tabFn).filter(filterFn).sort((a, b) =>
    (b.appliedAt || '').localeCompare(a.appliedAt || '')
  );

  // Counts for tab badges
  const pendingCount = approvals.filter(a => {
    if (role === 'senior') return a.stage === 'pending_senior' && a.assignedSenior === currentUserId;
    if (role === 'admin')  return a.stage === 'pending_senior' || a.stage === 'pending_admin';
    return false;
  }).length;
  const doneCount = approvals.filter(a => a.stage === 'approved' || a.stage === 'rejected').length;
  const mineCount = approvals.filter(a => a.empId === currentUserId).length;

  const sel = list.find(a => a.id === selected) || list[0] || null;

  React.useEffect(() => {
    setRejectMode(false);
    setRejectMsg('');
  }, [sel?.id]);

  const handleApproveSel = () => {
    if (!sel) return;
    onApprove(sel.id);
    // try to advance to next pending
    const idx = list.findIndex(a => a.id === sel.id);
    const next = list[idx + 1] || list[idx - 1];
    setSelected(next ? next.id : null);
  };
  const handleRejectSubmit = () => {
    if (!sel) return;
    onReject(sel.id, rejectMsg);
    setRejectMode(false);
    setRejectMsg('');
    const idx = list.findIndex(a => a.id === sel.id);
    const next = list[idx + 1] || list[idx - 1];
    setSelected(next ? next.id : null);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
        <div>
          <div className="eyebrow">결재함</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginTop: 8, letterSpacing: '-.02em' }}>
            결재 대기 {pendingCount}건
          </h1>
          <div style={{ marginTop: 8, color: 'var(--ink-mute)', fontSize: 14, fontWeight: 500 }}>
            {role === 'admin'
              ? '팀장 신청은 직접 승인, 멤버 신청은 1차 통과 후 표시됩니다'
              : '팀원의 1차 결재 — 승인 시 관리자에게 자동 전달'}
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'inline-flex', padding: 4,
          background: 'var(--bg)', borderRadius: 12,
          border: '1px solid var(--line-soft)',
        }}>
          <TabBtn active={tab === 'pending'} onClick={() => { setTab('pending'); setSelected(null); }} count={pendingCount} hot>
            대기
          </TabBtn>
          <TabBtn active={tab === 'done'} onClick={() => { setTab('done'); setSelected(null); }} count={doneCount}>
            처리 완료
          </TabBtn>
          <TabBtn active={tab === 'mine'} onClick={() => { setTab('mine'); setSelected(null); }} count={mineCount}>
            내 신청
          </TabBtn>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[
          { key: 'all',     label: '전체' },
          { key: 'leave',   label: '연차' },
          { key: 'half',    label: '반차' },
          { key: 'refresh', label: '리프레시' },
          { key: 'lunch',   label: '점심 1.5h' },
          { key: 'overtime',label: '야근' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '6px 14px', borderRadius: 999,
              fontSize: 12, fontWeight: 700,
              background: filter === f.key ? 'var(--ink)' : 'white',
              color: filter === f.key ? 'white' : 'var(--ink-mute)',
              border: filter === f.key ? '1px solid var(--ink)' : '1px solid var(--line)',
              cursor: 'pointer',
              transition: 'all .12s',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Two-pane: cards (left) + detail (right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 420px',
        gap: 20,
        alignItems: 'start',
      }}>
        {/* Card grid */}
        <div>
          {list.length === 0 ? (
            <EmptyState tab={tab} />
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 12,
            }}>
              {list.map(a => (
                <ApprovalDocCard
                  key={a.id}
                  approval={a}
                  selected={sel && sel.id === a.id}
                  onClick={() => setSelected(a.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detail panel (sticky) */}
        <div style={{ position: 'sticky', top: 20 }}>
          {sel ? (
            <ApprovalDetail
              approval={sel}
              role={role}
              currentUserId={currentUserId}
              rejectMode={rejectMode}
              rejectMsg={rejectMsg}
              setRejectMode={setRejectMode}
              setRejectMsg={setRejectMsg}
              onApprove={handleApproveSel}
              onReject={handleRejectSubmit}
              onSelectMember={onSelectMember}
            />
          ) : (
            <div className="card" style={{
              padding: 32, textAlign: 'center',
              color: 'var(--ink-mute)', fontSize: 13, fontWeight: 500,
            }}>
              <Icon name="inbox" size={32} />
              <div style={{ marginTop: 12 }}>왼쪽에서 결재 카드를 선택해주세요</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TabBtn = ({ active, onClick, count, children, hot }) => (
  <button onClick={onClick} style={{
    padding: '8px 16px', borderRadius: 8,
    fontSize: 13, fontWeight: 700,
    background: active ? 'white' : 'transparent',
    color: active ? 'var(--ink)' : 'var(--ink-mute)',
    boxShadow: active ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
    cursor: 'pointer', transition: 'all .15s',
    display: 'flex', alignItems: 'center', gap: 6,
  }}>
    {children}
    {count > 0 && (
      <span style={{
        fontSize: 10, fontWeight: 800,
        padding: '2px 6px', borderRadius: 999,
        background: active && hot
          ? 'var(--danger, #ef4444)'
          : active
            ? 'var(--accent-soft)'
            : 'var(--line-soft)',
        color: active && hot
          ? 'white'
          : active
            ? 'var(--accent)'
            : 'var(--ink-mute)',
        minWidth: 18, textAlign: 'center',
      }}>{count}</span>
    )}
  </button>
);

const ApprovalDocCard = ({ approval, selected, onClick }) => {
  const emp = getEmployee(approval.empId);
  const isLunch = approval.isLunch;
  const isOvertime = approval.isOvertime;
  const stage = approval.stage;

  // type accent — color band on left
  const accentColor =
    approval.type === '연차'    ? '#3b82f6' :
    approval.type === '반차'    ? '#8b5cf6' :
    approval.type === '리프레시' ? '#f59e0b' :
    isLunch                     ? '#ef8754' :
    isOvertime                  ? '#4c1d95' : '#64748b';

  const dateLabel = approval.start === approval.end
    ? approval.start.slice(5).replace('-', '/')
    : `${approval.start.slice(5).replace('-', '/')} – ${approval.end.slice(5).replace('-', '/')}`;

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        background: 'white',
        borderRadius: 12,
        border: selected ? '2px solid var(--accent)' : '1px solid var(--line)',
        padding: 16,
        cursor: 'pointer',
        boxShadow: selected ? '0 8px 24px rgba(75,108,255,.18)' : '0 1px 2px rgba(0,0,0,.03)',
        transition: 'all .15s',
        overflow: 'hidden',
      }}>
      {/* Left accent stripe */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: 3, background: accentColor,
      }}/>

      {/* Type pill + status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{
          fontSize: 10, fontWeight: 800, letterSpacing: '.06em',
          padding: '3px 8px', borderRadius: 4,
          background: `${accentColor}1a`,
          color: accentColor,
          textTransform: 'uppercase',
        }}>
          {approval.type}
        </span>
        <StageBadge stage={stage} small />
      </div>

      {/* Body */}
      <div style={{ marginTop: 12, fontSize: 22, fontWeight: 800, letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums' }}>
        {dateLabel}
      </div>
      <div style={{
        fontSize: 12, color: 'var(--ink-mute)', marginTop: 4, fontWeight: 600,
      }}>
        {isLunch
          ? (approval.lunchSlot === 'early' ? '12:00–13:30' : '12:30–14:00')
          : isOvertime
            ? '10:00 PM 이후'
            : `${approval.days}일 사용`}
      </div>

      {approval.reason && (
        <div style={{
          fontSize: 12, color: 'var(--ink-soft)',
          marginTop: 10, lineHeight: 1.5,
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          "{approval.reason}"
        </div>
      )}

      {/* Footer: requester */}
      <div style={{
        marginTop: 14, paddingTop: 12,
        borderTop: '1px solid var(--line-soft)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Avatar empId={approval.empId} size="xs" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{emp.name}</div>
          <div style={{ fontSize: 10, color: 'var(--ink-mute)', fontWeight: 600 }}>
            {emp.title} · {emp.team}
          </div>
        </div>
        <div style={{
          fontSize: 10, color: 'var(--ink-mute)',
          fontVariantNumeric: 'tabular-nums', fontWeight: 600,
        }}>
          {(approval.appliedAt || '').slice(5, 16).replace('-', '/').replace(' ', ' · ')}
        </div>
      </div>
    </div>
  );
};

const StageBadge = ({ stage, small }) => {
  const map = {
    pending_senior: { label: '팀장 대기', bg: 'rgba(245,166,35,.18)', fg: '#b56b00' },
    pending_admin:  { label: '관리자 대기', bg: 'rgba(75,108,255,.16)', fg: 'var(--accent)' },
    approved:       { label: '승인',         bg: 'rgba(61,207,166,.18)', fg: '#1d7a5a' },
    rejected:       { label: '반려',         bg: 'rgba(248,99,99,.16)',  fg: '#c33b3b' },
  };
  const s = map[stage] || { label: stage, bg: 'var(--line-soft)', fg: 'var(--ink-mute)' };
  return (
    <span style={{
      fontSize: small ? 10 : 11, fontWeight: 700,
      padding: small ? '3px 8px' : '4px 10px',
      borderRadius: 999,
      background: s.bg, color: s.fg,
      letterSpacing: '.02em',
      whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  );
};

const EmptyState = ({ tab }) => (
  <div style={{
    padding: '60px 24px', textAlign: 'center',
    background: 'white', borderRadius: 16,
    border: '1px dashed var(--line)',
  }}>
    <div style={{ fontSize: 40, marginBottom: 12 }}>
      {tab === 'pending' ? '🎉' : tab === 'mine' ? '📋' : '✅'}
    </div>
    <div style={{ fontSize: 16, fontWeight: 700 }}>
      {tab === 'pending' && '대기 중인 결재가 없어요'}
      {tab === 'done'    && '처리한 결재가 없어요'}
      {tab === 'mine'    && '신청한 결재가 없어요'}
    </div>
    <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 6 }}>
      {tab === 'pending' && '모든 신청이 처리되었습니다'}
      {tab === 'done'    && '아직 처리된 결재가 없습니다'}
      {tab === 'mine'    && '대시보드에서 휴가/점심을 신청해보세요'}
    </div>
  </div>
);

const ApprovalDetail = ({ approval, role, currentUserId, rejectMode, rejectMsg, setRejectMode, setRejectMsg, onApprove, onReject, onSelectMember }) => {
  const emp = getEmployee(approval.empId);
  const isLunch = approval.isLunch;
  const isOvertime = approval.isOvertime;
  const dateLabel = approval.start === approval.end
    ? approval.start
    : `${approval.start} ~ ${approval.end}`;

  const accentColor =
    approval.type === '연차'    ? '#3b82f6' :
    approval.type === '반차'    ? '#8b5cf6' :
    approval.type === '리프레시' ? '#f59e0b' :
    isLunch                     ? '#ef8754' :
    isOvertime                  ? '#4c1d95' : '#64748b';

  const canAct = (role === 'senior' && approval.stage === 'pending_senior' && approval.assignedSenior === currentUserId)
              || (role === 'admin'  && approval.stage === 'pending_admin')
              || (role === 'admin'  && approval.stage === 'pending_senior' && emp.role === 'senior');

  // Stage progress
  const seniorEmp = approval.assignedSenior ? getEmployee(approval.assignedSenior) : null;
  const steps = [
    { key: 'submit',  label: '신청',        ts: approval.appliedAt },
    { key: 'senior',  label: seniorEmp ? `${seniorEmp.name} 팀장 결재` : '팀장 결재',  ts: approval.stage === 'pending_senior' ? null : approval.approvedAt || approval.rejectedAt },
    { key: 'admin',   label: '관리자 최종 승인',    ts: approval.stage === 'approved' ? approval.approvedAt : null },
  ];
  const currentStep = approval.stage === 'pending_senior' ? 1
                    : approval.stage === 'pending_admin'  ? 2
                    : approval.stage === 'approved'       ? 3
                    : approval.stage === 'rejected'       ? -1 : 0;

  return (
    <div className="card" style={{
      padding: 0, overflow: 'hidden',
      maxHeight: 'calc(100vh - 80px)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header band */}
      <div style={{
        padding: '20px 24px',
        background: `linear-gradient(135deg, ${accentColor}f0 0%, ${accentColor}c0 100%)`,
        color: 'white',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.12em', opacity: .9 }}>
            결재 #{approval.id.toUpperCase()}
          </div>
          <StageBadge stage={approval.stage} />
        </div>
        <div style={{ marginTop: 10, fontSize: 28, fontWeight: 800, letterSpacing: '-.02em' }}>
          {approval.type}{(isLunch || isOvertime) ? '' : ` ${approval.days}일`}
        </div>
        <div style={{ fontSize: 13, opacity: .92, marginTop: 4, fontWeight: 600 }}>
          {isLunch ? `${dateLabel} · ${approval.lunchSlot === 'early' ? '12:00 – 13:30' : '12:30 – 14:00'}` : dateLabel}
        </div>
      </div>

      <div style={{ padding: 22, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Requester */}
        <div
          onClick={() => onSelectMember && onSelectMember(approval.empId)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: 12, borderRadius: 10,
            background: 'var(--bg)',
            cursor: 'pointer',
          }}>
          <Avatar empId={approval.empId} size="md" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{emp.name}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2, fontWeight: 600 }}>
              {emp.title} · {emp.team} · {emp.email}
            </div>
          </div>
          <Icon name="chevron-right" size={14} />
        </div>

        {/* Reason */}
        {approval.reason && (
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>신청 사유</div>
            <div style={{
              fontSize: 14, lineHeight: 1.6, fontWeight: 500,
              padding: '12px 14px', background: 'var(--bg)',
              borderRadius: 10, borderLeft: `3px solid ${accentColor}`,
            }}>
              {approval.reason}
            </div>
          </div>
        )}

        {/* Progress timeline */}
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>진행 단계</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {steps.map((step, i) => {
              const stepNum = i + 1;
              const isDone = currentStep >= stepNum || (currentStep === -1 && stepNum === 1);
              const isRejectStep = approval.stage === 'rejected' && stepNum === 2;
              const dotColor = isRejectStep ? 'var(--danger, #ef4444)'
                             : isDone ? 'var(--ok, #3dcfa6)'
                             : 'var(--line)';
              return (
                <div key={step.key} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    paddingTop: 4,
                  }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: dotColor,
                      boxShadow: isDone ? `0 0 0 3px ${dotColor}25` : 'none',
                    }}/>
                    {i < steps.length - 1 && (
                      <div style={{
                        width: 2, height: 28,
                        background: isDone && !isRejectStep ? 'var(--ok, #3dcfa6)' : 'var(--line)',
                        marginTop: 2,
                      }}/>
                    )}
                  </div>
                  <div style={{ flex: 1, paddingBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700,
                      color: isRejectStep ? 'var(--danger, #ef4444)' : isDone ? 'var(--ink)' : 'var(--ink-mute)' }}>
                      {isRejectStep ? '반려' : step.label}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2,
                      fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                      {step.ts || (stepNum === currentStep ? '진행중' : '대기')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reject reason if rejected */}
        {approval.stage === 'rejected' && approval.rejectReason && (
          <div>
            <div className="eyebrow" style={{ marginBottom: 6, color: 'var(--danger, #ef4444)' }}>반려 사유</div>
            <div style={{
              fontSize: 13, lineHeight: 1.5, fontWeight: 500,
              padding: '12px 14px',
              background: 'rgba(248,99,99,.08)',
              borderRadius: 10,
              color: 'var(--ink)',
            }}>
              {approval.rejectReason}
            </div>
          </div>
        )}
      </div>

      {/* Action footer */}
      {canAct && (
        <div style={{
          padding: 16,
          borderTop: '1px solid var(--line-soft)',
          background: 'var(--bg)',
        }}>
          {!rejectMode ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setRejectMode(true)}
                className="btn"
                style={{ flex: 1, color: 'var(--danger)', background: 'var(--danger-soft)', border: '1px solid transparent', fontWeight: 700 }}>
                <Icon name="x" size={14} strokeWidth={2.5} />
                반려
              </button>
              <button
                onClick={onApprove}
                className="btn btn-primary"
                style={{ flex: 2, fontWeight: 700 }}>
                <Icon name="check" size={14} strokeWidth={2.5} />
                승인
              </button>
            </div>
          ) : (
            <div>
              <textarea
                autoFocus
                value={rejectMsg}
                onChange={(e) => setRejectMsg(e.target.value)}
                placeholder="반려 사유를 입력해주세요 (예: 일정이 겹쳐 1주일 후 재신청 부탁드려요)"
                style={{
                  width: '100%', minHeight: 70,
                  padding: 10, borderRadius: 8,
                  border: '1px solid var(--line)',
                  fontSize: 13, fontFamily: 'inherit',
                  resize: 'vertical', outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={() => setRejectMode(false)} className="btn" style={{ flex: 1 }}>
                  취소
                </button>
                <button
                  onClick={onReject}
                  className="btn"
                  style={{
                    flex: 2, background: 'var(--danger, #ef4444)',
                    color: 'white', fontWeight: 700,
                  }}>
                  <Icon name="x" size={14} strokeWidth={2.5} />
                  반려 처리
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

Object.assign(window, { InboxPage });
