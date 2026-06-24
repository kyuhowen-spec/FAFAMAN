// 조직도 (Org Chart) — admin can add/edit/delete; senior+member: view only
const OrgPage = ({ role, currentUserId, onSelectMember }) => {
  const data = window.PAPA_DATA;
  const isAdmin = role === 'admin';

  const [employees, setEmployees] = React.useState(data.employees);
  const [showForm, setShowForm] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState(null); // emp id or null (for new)
  const [confirmDelete, setConfirmDelete] = React.useState(null);

  // Sync back to global so other components reflect roster changes within session
  React.useEffect(() => { window.PAPA_DATA.employees = employees; }, [employees]);

  const teams = data.teams;
  const titleOrder = data.titleOrder;

  // Group: team → title → members
  const grouped = teams.map(t => {
    const members = employees.filter(e => e.team === t.key);
    const byTitle = titleOrder.map(title => ({
      title,
      members: members.filter(m => m.title === title),
    })).filter(g => g.members.length > 0);
    return { team: t, byTitle, count: members.length };
  });

  const handleSave = (form) => {
    if (form.id && employees.find(e => e.id === form.id && form.id !== editTarget)) {
      // duplicate id
      alert('이미 사용 중인 사번입니다.');
      return;
    }
    if (editTarget) {
      // Update account email if changed
      const oldEmp = employees.find(e => e.id === editTarget);
      if (oldEmp && oldEmp.email !== form.email) {
        const oldEmailKey = oldEmp.email.trim().toLowerCase();
        const newEmailKey = form.email.trim().toLowerCase();
        if (data.accounts[oldEmailKey]) {
          data.accounts[newEmailKey] = data.accounts[oldEmailKey];
          delete data.accounts[oldEmailKey];
        }
      }
      setEmployees(prev => prev.map(e => e.id === editTarget ? { ...e, ...form } : e));
    } else {
      const newId = form.id || `e${Date.now().toString(36).slice(-4)}`;
      const initials = form.name ? form.name.slice(-2).toUpperCase() : 'NN';
      const colorIdx = employees.length % 8;
      const newEmp = {
        ...form,
        id: newId,
        initials: form.initials || initials,
        color: `av-${colorIdx}`,
      };
      setEmployees(prev => [...prev, newEmp]);

      // Create login account with password '0000' and email as key
      const emailKey = form.email.trim().toLowerCase();
      if (!data.accounts[emailKey]) {
        data.accounts[emailKey] = {
          pw: '0000',
          userId: newId,
          isInitial: true
        };
      }
    }

    // Save to localStorage
    if (window.savePapaData) {
      setTimeout(() => {
        window.savePapaData();
      }, 50);
    }

    setShowForm(false);
    setEditTarget(null);
  };

  const handleDelete = (empId) => {
    const emp = employees.find(e => e.id === empId);
    if (emp && emp.email) {
      delete data.accounts[emp.email.trim().toLowerCase()];
    }
    setEmployees(prev => prev.filter(e => e.id !== empId));
    setConfirmDelete(null);

    // Save to Firestore
    if (window.savePapaData) {
      setTimeout(() => {
        window.savePapaData();
      }, 50);
    }
  };

  const handleResetPassword = (empId) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp || !emp.email) return;

    if (window.confirm(`${emp.name}님의 비밀번호를 '0000'으로 초기화 하시겠습니까?`)) {
      const emailKey = emp.email.trim().toLowerCase();
      data.accounts[emailKey] = {
        pw: '0000',
        userId: emp.id,
        isInitial: true
      };
      
      // Force re-render to update the '최초 로그인 대기' badge
      setEmployees([...employees]);
      
      if (window.savePapaData) {
        window.savePapaData();
      }
    }
  };

  const editingEmp = editTarget ? employees.find(e => e.id === editTarget) : null;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
        <div>
          <div className="eyebrow">조직도</div>
          <h1 style={{
            fontSize: 32, fontWeight: 800, marginTop: 8, letterSpacing: '-.02em',
          }}>Found Founded · {employees.length}명</h1>
          <div style={{ marginTop: 8, color: 'var(--ink-mute)', fontSize: 14, fontWeight: 500 }}>
            ID 팀 {employees.filter(e => e.team === 'ID').length}명 · VD 팀 {employees.filter(e => e.team === 'VD').length}명
          </div>
        </div>
        {isAdmin ? (
          <button className="btn btn-primary" onClick={() => { setEditTarget(null); setShowForm(true); }}>
            <Icon name="plus" size={14} strokeWidth={2.5} />
            구성원 등록
          </button>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', borderRadius: 999,
            background: 'var(--bg)', border: '1px solid var(--line)',
            fontSize: 12, fontWeight: 600, color: 'var(--ink-mute)',
          }}>
            <Icon name="info" size={13} />
            보기 전용 · 변경은 관리자에게 요청
          </div>
        )}
      </div>

      {/* Two-column team layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
        {grouped.map(({ team, byTitle, count }) => (
          <div key={team.key} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Team header */}
            <div style={{
              padding: '24px 28px',
              background: team.key === 'ID'
                ? 'linear-gradient(135deg, #2548d6 0%, #4d6aff 100%)'
                : 'linear-gradient(135deg, #6db82c 0%, #b5e54f 100%)',
              color: 'white',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', right: -20, top: -20,
                fontSize: 120, fontWeight: 900, opacity: .14, letterSpacing: '-.05em',
                lineHeight: 1, fontFamily: 'var(--font-display, inherit)',
              }}>{team.key}</div>
              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', opacity: .8 }}>
                  {team.full.toUpperCase()}
                </div>
                <div style={{
                  fontSize: 28, fontWeight: 800, marginTop: 4, letterSpacing: '-.02em',
                  display: 'flex', alignItems: 'baseline', gap: 10,
                }}>
                  {team.label} 팀
                  <span style={{ fontSize: 14, fontWeight: 600, opacity: .85 }}>
                    {count}명
                  </span>
                </div>
              </div>
            </div>

            {/* Title groups */}
            <div style={{ padding: 18 }}>
              {byTitle.length === 0 ? (
                <div style={{
                  padding: '28px 16px', textAlign: 'center',
                  color: 'var(--ink-mute)', fontSize: 13, fontWeight: 500,
                }}>아직 구성원이 없습니다</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {byTitle.flatMap(({ members }) => members).map(emp => (
                    <OrgRow
                      key={emp.id}
                      emp={emp}
                      isAdmin={isAdmin}
                      onView={() => onSelectMember && onSelectMember(emp.id)}
                      onEdit={() => { setEditTarget(emp.id); setShowForm(true); }}
                      onDelete={() => setConfirmDelete(emp.id)}
                      onResetPw={() => handleResetPassword(emp.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Title legend strip */}
      <div className="card" style={{
        padding: '18px 24px',
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '.1em',
          color: 'var(--ink-mute)', textTransform: 'uppercase',
        }}>직급 체계</div>
        {titleOrder.map((title, i) => (
          <React.Fragment key={title}>
            {i > 0 && <span style={{ color: 'var(--line)', fontSize: 12 }}>›</span>}
            <span style={{
              fontSize: 13, fontWeight: 700, color: 'var(--ink)',
            }}>{title}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-mute)' }}>
              {employees.filter(e => e.title === title).length}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Add/Edit form modal */}
      {showForm && isAdmin && (
        <OrgEditForm
          emp={editingEmp}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
          onSave={handleSave}
          titleOrder={titleOrder}
          teams={teams}
          onResetPw={editingEmp ? () => handleResetPassword(editingEmp.id) : null}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && isAdmin && (
        <ConfirmDelete
          emp={employees.find(e => e.id === confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => handleDelete(confirmDelete)}
        />
      )}
    </div>
  );
};

const OrgRow = ({ emp, isAdmin, onView, onEdit, onDelete, onResetPw }) => {
  const [hover, setHover] = React.useState(false);
  const data = window.PAPA_DATA;
  const emailKey = emp.email ? emp.email.trim().toLowerCase() : '';
  const acct = data.accounts[emailKey];
  const isInitialPending = acct && (acct.pw === '0000' || acct.isInitial);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onView}
      style={{
        display: 'grid',
        gridTemplateColumns: '36px 1fr auto',
        alignItems: 'center', gap: 12,
        padding: '10px 12px',
        borderRadius: 10,
        background: hover ? 'var(--bg)' : 'transparent',
        cursor: 'pointer',
        transition: 'background .15s',
      }}>
      <Avatar empId={emp.id} size="md" />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {emp.name}
          {emp.role === 'admin' && (
            <span style={{
              fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
              background: 'var(--ink)', color: 'white', letterSpacing: '.05em',
            }}>ADMIN</span>
          )}
          {emp.role === 'senior' && (
            <span style={{
              fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
              background: 'var(--accent-soft)', color: 'var(--accent)', letterSpacing: '.05em',
            }}>SENIOR</span>
          )}
          {emp.role === 'member' && emp.title !== '인턴' && (
            <span style={{
              fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
              background: 'rgba(61,207,166,.18)', color: 'var(--ok-ink, #1d7a5a)',
              letterSpacing: '.05em',
              border: '1px solid rgba(61,207,166,.45)',
            }}>MEMBER</span>
          )}
          {emp.title === '인턴' && (
            <span style={{
              fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
              background: 'rgba(245,166,35,.18)', color: 'var(--warn-ink, #b56b00)',
              letterSpacing: '.05em',
              border: '1px solid rgba(245,166,35,.4)',
            }}>INTERN</span>
          )}
          {isInitialPending && (
            <span style={{
              fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
              background: 'rgba(235,94,85,.12)', color: '#eb5e55', letterSpacing: '.05em',
              border: '1px solid rgba(235,94,85,.35)',
            }}>최초 로그인 대기</span>
          )}
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {emp.title} · {emp.email}
        </div>
      </div>
      {isAdmin ? (
        <div style={{ display: 'flex', gap: 4, opacity: hover ? 1 : 0, transition: 'opacity .15s' }}>
          <button
            onClick={(e) => { e.stopPropagation(); onResetPw(); }}
            className="btn-icon"
            style={{ background: 'var(--bg)', width: 30, height: 30, color: '#b56b00' }}
            title="비밀번호 초기화">
            <Icon name="key" size={13} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="btn-icon"
            style={{ background: 'var(--bg)', width: 30, height: 30 }}
            title="수정">
            <Icon name="edit" size={13} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="btn-icon"
            style={{ background: 'var(--bg)', width: 30, height: 30, color: 'var(--danger)' }}
            title="삭제">
            <Icon name="trash" size={13} />
          </button>
        </div>
      ) : (
        <div style={{ width: 24 }}/>
      )}
    </div>
  );
};

const OrgEditForm = ({ emp, onClose, onSave, titleOrder, teams, onResetPw }) => {
  const [form, setForm] = React.useState(emp ? { ...emp } : {
    name: '', en: '', email: '', phone: '',
    title: '디자이너', team: 'ID', role: 'member',
    joined: new Date().toISOString().slice(0, 10),
    birthday: '01-01',
  });

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      alert('이름과 이메일은 필수입니다.');
      return;
    }
    onSave(form);
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(20,22,32,.55)',
      backdropFilter: 'blur(6px)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        style={{
          background: 'white', borderRadius: 16,
          width: 560, maxWidth: '100%', maxHeight: '90vh', overflow: 'auto',
          boxShadow: '0 24px 80px rgba(0,0,0,.18)',
        }}>
        <div style={{
          padding: '24px 28px',
          borderBottom: '1px solid var(--line-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div className="eyebrow">{emp ? '구성원 수정' : '구성원 등록'}</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4, letterSpacing: '-.01em' }}>
              {emp ? `${emp.name} 정보 수정` : '새 구성원 추가'}
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn-icon" style={{ background: 'var(--bg)' }}>
            <Icon name="x" size={16} />
          </button>
        </div>

        <div style={{ padding: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="이름 *" value={form.name} onChange={v => update('name', v)} />
          <FormField label="영문 이름" value={form.en} onChange={v => update('en', v)} />
          <div style={{ gridColumn: 'span 2' }}>
            <FormField label="이메일 *" value={form.email} onChange={v => update('email', v)} type="email" />
          </div>
          <FormField label="휴대폰" value={form.phone} onChange={v => update('phone', v)} placeholder="010-0000-0000" />
          <FormField label="입사일" value={form.joined} onChange={v => update('joined', v)} type="date" />

          <FormSelect label="소속 팀" value={form.team} onChange={v => update('team', v)}
            options={teams.map(t => ({ value: t.key, label: `${t.label} · ${t.full}` }))} />
          <FormSelect label="직급" value={form.title} onChange={v => update('title', v)}
            options={titleOrder.map(t => ({ value: t, label: t }))} />

          <FormSelect label="권한" value={form.role} onChange={v => update('role', v)}
            options={[
              { value: 'admin', label: '관리자 (admin)' },
              { value: 'senior', label: '시니어 (senior)' },
              { value: 'member', label: '멤버 (member)' },
            ]} />
          <FormField label="생일 (MM-DD)" value={form.birthday} onChange={v => update('birthday', v)} placeholder="04-21" />
        </div>

        <div style={{
          padding: '18px 28px',
          borderTop: '1px solid var(--line-soft)',
          display: 'flex', justifyContent: 'space-between', gap: 8,
          background: 'var(--bg)',
        }}>
          <div>
            {emp && onResetPw && (
              <button type="button" className="btn btn-ghost" onClick={() => { onResetPw(); onClose(); }} style={{ color: '#b56b00', borderColor: 'rgba(245,166,35,.4)', background: 'rgba(245,166,35,.08)' }}>
                <Icon name="key" size={14} />
                비밀번호 초기화 (0000)
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn" onClick={onClose}>취소</button>
            <button type="submit" className="btn btn-primary">
              <Icon name="check" size={14} strokeWidth={2.5} />
              {emp ? '저장' : '등록'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

const FormField = ({ label, value, onChange, type = 'text', placeholder }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-mute)', letterSpacing: '.04em' }}>
      {label}
    </span>
    <input
      type={type}
      value={value || ''}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: '10px 12px',
        borderRadius: 8,
        border: '1px solid var(--line)',
        fontSize: 14, fontWeight: 500,
        outline: 'none',
        fontFamily: 'inherit',
      }}
    />
  </label>
);

const FormSelect = ({ label, value, onChange, options }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-mute)', letterSpacing: '.04em' }}>
      {label}
    </span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: '10px 12px',
        borderRadius: 8,
        border: '1px solid var(--line)',
        fontSize: 14, fontWeight: 500,
        outline: 'none',
        background: 'white',
        fontFamily: 'inherit',
        cursor: 'pointer',
      }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </label>
);

const ConfirmDelete = ({ emp, onCancel, onConfirm }) => (
  <div onClick={onCancel} style={{
    position: 'fixed', inset: 0, background: 'rgba(20,22,32,.55)',
    backdropFilter: 'blur(6px)', zIndex: 110,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24,
  }}>
    <div onClick={(e) => e.stopPropagation()} style={{
      background: 'white', borderRadius: 16,
      width: 420, padding: 28,
      boxShadow: '0 24px 80px rgba(0,0,0,.18)',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: 'var(--danger-soft, rgba(248,99,99,.14))',
        color: 'var(--danger)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
      }}>
        <Icon name="trash" size={20} />
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.01em' }}>
        {emp.name} 삭제
      </div>
      <div style={{ fontSize: 14, color: 'var(--ink-mute)', marginTop: 8, lineHeight: 1.5 }}>
        조직도에서 <strong style={{ color: 'var(--ink)' }}>{emp.title} · {emp.team}</strong> 항목이 제거됩니다.
        이 작업은 되돌릴 수 없습니다.
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 24, justifyContent: 'flex-end' }}>
        <button className="btn" onClick={onCancel}>취소</button>
        <button className="btn" onClick={onConfirm} style={{
          background: 'var(--danger)', color: 'white', fontWeight: 700,
        }}>
          <Icon name="trash" size={13} />
          삭제
        </button>
      </div>
    </div>
  </div>
);

Object.assign(window, { OrgPage });
