// 조직도 (Org Chart) — admin can add/edit/delete; senior+member: view only
const OrgPage = ({ role, currentUserId, onSelectMember }) => {
  const data = window.PAPA_DATA;
  const isAdmin = role === 'admin';

  const [employees, setEmployees] = React.useState(data.employees);
  const [showForm, setShowForm] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState(null); // emp id or null (for new)
  const [confirmDelete, setConfirmDelete] = React.useState(null);

  const departments = data.departments || [];
  const teams = data.teams || [];
  const titleOrder = data.titleOrder || [];

  // Group: department → team → title → members
  const grouped = departments.map(d => {
    const deptMembers = employees.filter(e => e.department === d.key);
    const deptTeams = (d.key === 'EX') ? [] : teams.filter(t => t.dept === d.key);
    
    const groupMembersByTitle = (members) => {
      const byTitle = titleOrder.map(title => ({
        title, members: members.filter(m => m.title === title)
      })).filter(g => g.members.length > 0);
      
      const otherMembers = members.filter(m => !titleOrder.includes(m.title));
      if (otherMembers.length > 0) {
        const uniqueOtherTitles = [...new Set(otherMembers.map(m => m.title))];
        uniqueOtherTitles.forEach(t => {
          byTitle.push({ title: t || '미지정', members: otherMembers.filter(m => m.title === t) });
        });
      }
      return byTitle;
    };
    
    const teamsGrouped = deptTeams.map(t => {
      const tMembers = deptMembers.filter(e => e.team === t.key);
      const byTitle = groupMembersByTitle(tMembers);
      return { team: t, byTitle, count: tMembers.length };
    }).filter(tg => tg.count > 0);

    const noTeamMembers = deptMembers.filter(e => !e.team || !deptTeams.find(t => t.key === e.team));
    if (noTeamMembers.length > 0) {
      const byTitle = groupMembersByTitle(noTeamMembers);
      teamsGrouped.unshift({ team: { key: '소속 없음', label: '소속 없음' }, byTitle, count: noTeamMembers.length });
    }

    return { department: d, teamsGrouped, count: deptMembers.length };
  }).filter(g => g.count > 0);

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
      
      const newEmployees = employees.map(e => e.id === editTarget ? { ...e, ...form } : e);
      setEmployees(newEmployees);
      window.PAPA_DATA.employees = newEmployees;
    } else {
      const newId = form.id || `e${Date.now().toString(36).slice(-4)}`;
      const initials = form.name ? form.name.slice(-2).toUpperCase() : 'NN';
      const colorIdx = employees.length % 8;
      const newEmp = {
        ...form,
        id: newId,
        initials: form.initials || initials,
        color: `av-${colorIdx}`,
        birthday: form.birthday || '',
        email: form.email ? form.email.trim().toLowerCase() : '',
        phone: form.phone ? form.phone.trim() : '',
      };
      
      const newEmployees = [...employees, newEmp];
      setEmployees(newEmployees);
      window.PAPA_DATA.employees = newEmployees;

      // Create login account with password '0000' and email as key
      const emailKey = form.email.trim().toLowerCase();
      if (!data.accounts[emailKey]) {
        data.accounts[emailKey] = {
          pw: '0000',
          userId: newId,
          isInitial: true
        };
      }

      // Initialize leaveBalance
      if (!data.leaveBalance) data.leaveBalance = {};
      data.leaveBalance[newId] = {
        total: 15, used: 0, refresh: 0, refreshUsed: 0, tenure: 1
      };
    }

    // Save to localStorage/Firestore
    if (window.savePapaData) {
      sessionStorage.setItem('papa_pending_toast', '구성원 정보가 저장되었습니다.');
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
    
    const newEmployees = employees.filter(e => e.id !== empId);
    setEmployees(newEmployees);
    window.PAPA_DATA.employees = newEmployees;
    
    setConfirmDelete(null);

    // Save to Firestore
    if (window.savePapaData) {
      sessionStorage.setItem('papa_pending_toast', '구성원이 삭제되었습니다.');
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
        sessionStorage.setItem('papa_pending_toast', '비밀번호가 초기화되었습니다.');
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
            fontSize: 32, marginTop: 8, letterSpacing: '-.02em', display: 'flex', alignItems: 'center', gap: 10
          }}>
            <div style={{ fontFamily: "'Montserrat', 'Pretendard', sans-serif" }}>
              <span style={{ fontWeight: 500 }}>found/</span><span style={{ fontWeight: 800 }}>Founded</span>
            </div>
            <span style={{ fontWeight: 800 }}>· {employees.length}명</span>
          </h1>
          <div style={{ marginTop: 8, color: 'var(--ink-mute)', fontSize: 14, fontWeight: 500 }}>
            총 {employees.length}명
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

      {/* Department layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {grouped.map(({ department, teamsGrouped, count }) => (
          <div key={department.key} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Department header */}
            <div style={{
              padding: '24px 28px',
              background: department.key === 'EX'
                ? 'var(--ink)'
                : department.key === 'ID'
                ? 'linear-gradient(135deg, #2548d6 0%, #4d6aff 100%)'
                : department.key === 'VD'
                ? 'linear-gradient(135deg, #6db82c 0%, #b5e54f 100%)'
                : 'linear-gradient(135deg, #F5A623 0%, #F7B84D 100%)', // Orange for AI team
              color: 'white',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', right: -20, top: -20,
                fontSize: 120, fontWeight: 900, opacity: .14, letterSpacing: '-.05em',
                lineHeight: 1, fontFamily: 'var(--font-display, inherit)',
              }}>{department.key}</div>
              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', opacity: .8 }}>
                  {department.full.toUpperCase()}
                </div>
                <div style={{
                  fontSize: 28, fontWeight: 800, marginTop: 4, letterSpacing: '-.02em',
                  display: 'flex', alignItems: 'baseline', gap: 10,
                }}>
                  {department.label}
                  <span style={{ fontSize: 14, fontWeight: 600, opacity: .85 }}>
                    {count}명
                  </span>
                </div>
              </div>
            </div>

            {/* Teams inside department */}
            <div style={{ padding: '10px 18px 18px' }}>
              {teamsGrouped.length === 0 ? (
                <div style={{
                  padding: '28px 16px', textAlign: 'center',
                  color: 'var(--ink-mute)', fontSize: 13, fontWeight: 500,
                }}>아직 구성원이 없습니다</div>
              ) : (
                teamsGrouped.map((tg, idx) => (
                  <div key={tg.team.key}>
                    {idx > 0 && <div className="divider" style={{ margin: '16px 0' }}/>}
                    {tg.team.key !== '소속 없음' && (
                      <div className="h3" style={{ marginBottom: 12, marginTop: idx === 0 ? 8 : 0, color: 'var(--ink)' }}>{tg.team.key}</div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {tg.byTitle.flatMap(({ members }) => members).map(emp => (
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
                  </div>
                ))
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
          employees={employees}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
          onSave={handleSave}
          titleOrder={titleOrder}
          departments={departments}
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

  const getTitleBadgeStyle = (title) => {
    switch (title) {
      case '대표이사': return { background: 'var(--ink)', color: 'white', border: 'none' };
      case '디렉터': return { background: 'var(--accent)', color: 'white', border: 'none' };
      case '팀장':
      case '랩장': return { background: 'var(--accent-soft)', color: 'var(--accent-dark)', border: 'none' };
      case '시니어디자이너':
      case '시니어 디자이너': return { background: 'rgba(61,207,166,.18)', color: 'var(--ok-ink, #1d7a5a)', border: '1px solid rgba(61,207,166,.45)' };
      case '디자이너': return { background: 'var(--bg-deeper)', color: 'var(--ink-soft)', border: '1px solid #d1d8e5' };
      case '인턴': return { background: 'rgba(245,166,35,.18)', color: 'var(--warn-ink, #b56b00)', border: '1px solid rgba(245,166,35,.4)' };
      default: return { background: 'var(--line)', color: 'var(--ink-mute)', border: 'none' };
    }
  };

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
          {emp.name} <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-mute)', letterSpacing: 0 }}>{emp.empNo}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{emp.team || emp.department}</span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, letterSpacing: 0,
            ...getTitleBadgeStyle(emp.title)
          }}>{emp.title === '시니어디자이너' ? '시니어 디자이너' : emp.title}</span>
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

const OrgEditForm = ({ emp, employees, onClose, onSave, titleOrder, departments, teams, onResetPw }) => {
  const [form, setForm] = React.useState(emp || {
    id: '', empNo: '', name: '', en: '', email: '', phone: '', joined: '', department: departments[1]?.key || 'ID', team: teams[0]?.key || '', title: titleOrder[0], role: 'member', birthday: ''
  });

  const isExecutive = ['대표이사', '디렉터'].includes(form.title);

  const generateEmpNo = (dateStr) => {
    if (!dateStr || dateStr.length < 4) return '';
    const year = dateStr.substring(2, 4);
    const sameYear = employees.filter(e => e.empNo && e.empNo.startsWith(year));
    const maxSeq = sameYear.reduce((max, e) => {
      const seq = parseInt(e.empNo.substring(2), 10);
      return isNaN(seq) ? max : (seq > max ? seq : max);
    }, 0);
    return `${year}${String(maxSeq + 1).padStart(3, '0')}`;
  };

  const update = (key, val) => {
    setForm(prev => {
      const next = { ...prev, [key]: val };
      if (key === 'joined' && !emp && !prev.empNo) {
        next.empNo = generateEmpNo(val);
      }
      if (key === 'title') {
        if (['대표이사', '디렉터'].includes(val)) {
          next.department = 'EX';
          next.team = '';
        }
      }
      if (key === 'department') {
        const deptTeams = teams.filter(t => t.dept === val);
        next.team = deptTeams.length > 0 ? deptTeams[0].key : '';
      }
      return next;
    });
  };

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
          <FormField label="사번 *" value={form.empNo} onChange={v => update('empNo', v)} placeholder="22001" />

          <FormSelect label="직무 (Department)" value={form.department} onChange={v => update('department', v)}
            options={departments.map(d => ({ value: d.key, label: `${d.label} · ${d.full}` }))} />
            
          <FormSelect label="소속 팀" value={form.team} onChange={v => update('team', v)}
            options={[{value: '', label: '소속 없음'}].concat(teams.filter(t => t.dept === form.department).map(t => ({ value: t.key, label: t.key })))} 
            disabled={isExecutive} />

          <FormSelect label="직급" value={form.title} onChange={v => update('title', v)}
            options={titleOrder.map(t => ({ value: t, label: t }))} />

          <FormSelect label="권한" value={form.role} onChange={v => update('role', v)}
            options={[
              { value: 'admin', label: '관리자 (admin)' },
              { value: 'senior', label: '리더 (senior)' },
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
