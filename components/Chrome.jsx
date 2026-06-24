// Sidebar & Topbar
const navItems = [
  { key: 'dashboard', label: '대시보드',    icon: 'home',       roles: ['admin','senior','member'] },
  { key: 'inbox',     label: '결재함',       icon: 'inbox',      roles: ['admin','senior'] },
  { key: 'calendar',  label: '캘린더',       icon: 'calendar',   roles: ['admin','senior','member'] },
  { key: 'org',       label: '조직도',       icon: 'users',      roles: ['admin','senior','member'] },
  { key: 'payroll',   label: '급여',         icon: 'wallet',     roles: ['admin','senior','member','accountant'] },
  { key: 'cert',      label: '재직증명서',    icon: 'file-text',  roles: ['admin','senior','member'] },
  { key: 'policy',    label: '근무 규정',    icon: 'book',       roles: ['admin','senior','member'] },
  { key: 'settings',  label: '서버 설정',    icon: 'settings',   roles: ['admin'] },
];

const Sidebar = ({ role, currentUserId, active, onNav, inboxCount, onLogout }) => {
  const me = getEmployee(currentUserId);
  const items = navItems.filter(i => i.roles.includes(role));
  return (
    <aside style={{
      background: 'var(--surface)',
      borderRight: '1px solid var(--line)',
      padding: '24px 16px',
      display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0, height: '100vh',
    }}>
      {/* Logo */}
      <div style={{ padding: '8px 12px 28px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div>
          <div style={{ fontSize: 20, letterSpacing: '-.03em', fontFamily: "'Montserrat', 'Pretendard', sans-serif" }}>
            <span style={{ fontWeight: 500 }}>found/</span><span style={{ fontWeight: 800 }}>Founded</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 600, marginTop: 4 }}>
            PAPA Workspace
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {items.map(item => {
          const isActive = active === item.key;
          const badge = item.key === 'inbox' && inboxCount > 0 ? inboxCount : null;
          return (
            <button
              key={item.key}
              onClick={() => onNav(item.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 10,
                fontSize: 14, fontWeight: 600,
                color: isActive ? 'var(--accent-dark)' : 'var(--ink-soft)',
                background: isActive ? 'var(--accent-soft)' : 'transparent',
                justifyContent: 'flex-start', textAlign: 'left',
                transition: 'all .15s',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--line-soft)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon name={item.icon} size={17} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {badge && (
                <span style={{
                  background: 'var(--danger)', color: 'white',
                  fontSize: 11, fontWeight: 700,
                  minWidth: 20, height: 20, padding: '0 6px', borderRadius: 999,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>{badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div style={{
        marginTop: 24, padding: 12, borderRadius: 12,
        background: 'var(--line-soft)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Avatar empId={currentUserId} size="sm" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {me?.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {me?.title}
          </div>
        </div>
        <button onClick={onLogout} title="로그아웃" className="btn-icon"
          style={{ background: 'transparent', color: 'var(--ink-mute)', width: 30, height: 30 }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--danger)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-mute)'; }}>
          <Icon name="logout" size={15}/>
        </button>
      </div>
    </aside>
  );
};

const Topbar = ({ today, currentUserId, role, notifCount }) => {
  const me = getEmployee(currentUserId);
  return (
    <header style={{
      height: 72,
      padding: '0 40px',
      display: 'flex', alignItems: 'center', gap: 20,
      borderBottom: '1px solid var(--line)',
      background: 'var(--surface)',
      position: 'sticky', top: 0, zIndex: 10,
    }}>
      {/* Left: date */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <div className="eyebrow" style={{ fontSize: 11 }}>오늘</div>
        <div style={{ fontSize: 15, fontWeight: 700 }}>
          {today.label} <span style={{ color: 'var(--ink-mute)', fontWeight: 500 }}>· {today.weekday}</span>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 14px',
        background: 'var(--bg)',
        borderRadius: 10,
        minWidth: 240,
        color: 'var(--ink-mute)',
      }}>
        <Icon name="search" size={15} />
        <span style={{ fontSize: 13 }}>이름·프로젝트·문서 검색</span>
        <span className="mono" style={{
          marginLeft: 'auto', fontSize: 10,
          padding: '2px 6px', background: 'var(--surface)',
          borderRadius: 4, color: 'var(--ink-mute)',
        }}>⌘K</span>
      </div>

      {/* Notif */}
      <button className="btn-icon" style={{ position: 'relative', color: 'var(--ink-soft)' }}>
        <Icon name="bell" size={18} />
        {notifCount > 0 && (
          <span style={{
            position: 'absolute', top: 6, right: 6,
            width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)',
            border: '2px solid var(--surface)',
          }}></span>
        )}
      </button>

      {/* User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar empId={currentUserId} size="sm" />
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{me?.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <RolePill role={role} />
          </div>
        </div>
      </div>
    </header>
  );
};

Object.assign(window, { Sidebar, Topbar, navItems });
