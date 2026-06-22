// Login screen — entry point. Anti-proxy: must log in as yourself to check in.
const LoginScreen = ({ onLogin }) => {
  const data = window.PAPA_DATA;
  const [loginId, setLoginId] = React.useState('');
  const [pw, setPw] = React.useState('');
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [showHints, setShowHints] = React.useState(false);

  // Password reset state
  const [showReset, setShowReset] = React.useState(false);
  const [newPw, setNewPw] = React.useState('');
  const [confirmNewPw, setConfirmNewPw] = React.useState('');

  // Host restriction check
  const allowedHosts = data.allowedHosts || [];
  const currentHost = window.location.hostname;
  const isHostAllowed = allowedHosts.length === 0 || allowedHosts.some(h => h.trim().toLowerCase() === currentHost.toLowerCase());

  const submit = (e) => {
    e.preventDefault();
    setError('');
    const emailKey = loginId.trim().toLowerCase();
    const acct = data.accounts[emailKey];
    if (!acct || acct.pw !== pw) {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.');
      return;
    }

    // Check if initial password '0000' or isInitial flag is set
    if (acct.pw === '0000' || acct.isInitial) {
      setShowReset(true);
      return;
    }

    setBusy(true);
    setTimeout(() => onLogin(acct.userId), 350);
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    setError('');

    if (!newPw) {
      setError('새 비밀번호를 입력해 주세요.');
      return;
    }
    if (newPw === '0000') {
      setError('최초 비밀번호인 0000은 사용할 수 없습니다. 다른 비밀번호를 설정해 주세요.');
      return;
    }
    if (newPw !== confirmNewPw) {
      setError('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    const emailKey = loginId.trim().toLowerCase();
    const acct = data.accounts[emailKey];
    if (acct) {
      acct.pw = newPw;
      delete acct.isInitial;

      // Save changes to localStorage
      if (window.savePapaData) window.savePapaData();

      setBusy(true);
      setTimeout(() => onLogin(acct.userId), 350);
    } else {
      setError('계정 정보를 찾을 수 없습니다.');
    }
  };

  const quickFill = (h) => {
    setLoginId(h.loginId);
    setPw(h.pw);
    setError('');
  };

  // Block screen when accessing from unauthorized host
  if (!isHostAllowed) {
    return (
      <div style={{
        minHeight: '100vh', width: '100%',
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        background: 'var(--bg)',
      }}>
        {/* Left brand panel */}
        <div className="hero-gradient" style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '56px 56px 48px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', right: -80, bottom: -60,
            fontSize: 420, fontWeight: 900, lineHeight: 1,
            color: 'rgba(255,255,255,.06)', letterSpacing: '-.06em', pointerEvents: 'none',
          }}>P</div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, background: 'white',
              color: 'var(--accent)', display: 'grid', placeItems: 'center',
              fontWeight: 800, fontSize: 17,
            }}>P</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-.02em' }}>PAPA</div>
              <div style={{ fontSize: 11, opacity: .8, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 600 }}>
                found / Founded
              </div>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.16em', opacity: .8, textTransform: 'uppercase' }}>
              ACCESS RESTRICTED
            </div>
            <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1.1, marginTop: 14 }}>
              사내 네트워크에서만<br/>접속할 수 있어요
            </div>
          </div>
          <div style={{ position: 'relative', fontSize: 12, opacity: .7, fontWeight: 500 }}>
            © found / Founded. All rights reserved.
          </div>
        </div>

        {/* Right blocked panel */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <div style={{ width: 400, maxWidth: '100%', textAlign: 'center' }}>
            <div style={{
              width: 72, height: 72, borderRadius: 18, margin: '0 auto 24px',
              background: 'var(--danger-soft, rgba(248,99,99,.12))', color: 'var(--danger)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="shield" size={32}/>
            </div>
            <div className="eyebrow" style={{ color: 'var(--danger)' }}>NETWORK NOT AUTHORIZED</div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.03em', marginTop: 8 }}>
              접근이 제한되었습니다
            </h1>
            <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 12, lineHeight: 1.6, fontWeight: 500 }}>
              이 시스템은 관리자가 허용한 사내 서버에서만 접속 가능합니다.<br/>
              사내 네트워크에 연결한 후 다시 시도해 주세요.
            </div>
            <div style={{
              marginTop: 24, padding: '14px 18px', borderRadius: 12,
              background: 'var(--bg)', border: '1px solid var(--line)',
              fontSize: 12, fontWeight: 600, color: 'var(--ink-mute)',
            }}>
              <div style={{ marginBottom: 6 }}>현재 접속 주소</div>
              <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                {currentHost}
              </div>
              <div style={{ marginTop: 10, fontSize: 11, lineHeight: 1.5 }}>
                허용된 서버: {allowedHosts.length > 0 ? allowedHosts.join(', ') : '(설정 없음)'}
              </div>
            </div>
            <button onClick={() => window.location.reload()} className="btn" style={{
              marginTop: 20, fontSize: 13, fontWeight: 700,
            }}>
              <Icon name="refresh-cw" size={13}/>
              새로고침
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      background: 'var(--bg)',
    }}>
      {/* Left brand panel */}
      <div className="hero-gradient" style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '56px 56px 48px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', right: -80, bottom: -60,
          fontSize: 420, fontWeight: 900, lineHeight: 1,
          color: 'rgba(255,255,255,.06)', letterSpacing: '-.06em', pointerEvents: 'none',
        }}>P</div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, background: 'white',
            color: 'var(--accent)', display: 'grid', placeItems: 'center',
            fontWeight: 800, fontSize: 17,
          }}>P</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-.02em' }}>PAPA</div>
            <div style={{ fontSize: 11, opacity: .8, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 600 }}>
              found / Founded
            </div>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.16em', opacity: .8, textTransform: 'uppercase' }}>
            HR · 근태 · 급여 워크스페이스
          </div>
          <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1.1, marginTop: 14 }}>
            본인 계정으로<br/>로그인하고 출근하세요
          </div>
          <div style={{ fontSize: 14, opacity: .85, marginTop: 16, lineHeight: 1.6, maxWidth: 380, fontWeight: 500 }}>
            출퇴근 체크는 로그인한 본인만 가능합니다.<br/>대리 출근을 방지하기 위한 인증 절차예요.
          </div>
        </div>

        <div style={{ position: 'relative', fontSize: 12, opacity: .7, fontWeight: 500 }}>
          © found / Founded. All rights reserved.
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        {showReset ? (
          <form onSubmit={handleResetPassword} style={{ width: 360, maxWidth: '100%' }}>
            <div className="eyebrow">RESET PASSWORD</div>
            <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-.03em', marginTop: 8 }}>
              비밀번호 변경
            </h1>
            <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 8, fontWeight: 500, lineHeight: 1.5 }}>
              최초 로그인 시 안전을 위해 비밀번호 변경이 필수적입니다. 사용할 새 비밀번호를 설정해 주세요.
            </div>

            <div style={{ marginTop: 28 }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>새 비밀번호</div>
              <input
                className="input" type="password" value={newPw} autoFocus
                onChange={e => setNewPw(e.target.value)}
                placeholder="••••••••"
                style={{ fontSize: 15 }}
              />
            </div>
            <div style={{ marginTop: 14 }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>새 비밀번호 확인</div>
              <input
                className="input" type="password" value={confirmNewPw}
                onChange={e => setConfirmNewPw(e.target.value)}
                placeholder="••••••••"
                style={{ fontSize: 15 }}
              />
            </div>

            {error && (
              <div style={{
                marginTop: 14, padding: '10px 14px', borderRadius: 10,
                background: 'var(--danger-soft, rgba(248,99,99,.12))', color: 'var(--danger)',
                fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Icon name="alert-triangle" size={14}/> {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg" disabled={busy}
              style={{ width: '100%', marginTop: 22, opacity: busy ? .7 : 1 }}>
              {busy ? '처리 중…' : '비밀번호 설정 및 로그인'}
            </button>

            <button type="button" className="btn btn-flat" disabled={busy}
              onClick={() => {
                setShowReset(false);
                setNewPw('');
                setConfirmNewPw('');
                setError('');
              }}
              style={{ width: '100%', marginTop: 12, fontSize: 13, fontWeight: 700, color: 'var(--ink-mute)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
              이전으로 돌아가기
            </button>
          </form>
        ) : (
          <form onSubmit={submit} style={{ width: 360, maxWidth: '100%' }}>
            <div className="eyebrow">SIGN IN</div>
            <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-.03em', marginTop: 8 }}>
              로그인
            </h1>
            <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 8, fontWeight: 500 }}>
              회사에서 발급받은 계정으로 접속하세요.
            </div>

            <div style={{ marginTop: 28 }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>아이디</div>
              <input
                className="input" value={loginId} autoFocus autoComplete="username"
                onChange={e => setLoginId(e.target.value)}
                placeholder="예: jihoon"
                style={{ fontSize: 15 }}
              />
            </div>
            <div style={{ marginTop: 14 }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>비밀번호</div>
              <input
                className="input" type="password" value={pw} autoComplete="current-password"
                onChange={e => setPw(e.target.value)}
                placeholder="••••••••"
                style={{ fontSize: 15 }}
              />
            </div>

            {error && (
              <div style={{
                marginTop: 14, padding: '10px 14px', borderRadius: 10,
                background: 'var(--danger-soft, rgba(248,99,99,.12))', color: 'var(--danger)',
                fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Icon name="alert-triangle" size={14}/> {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg" disabled={busy}
              style={{ width: '100%', marginTop: 22, opacity: busy ? .7 : 1 }}>
              {busy ? '로그인 중…' : '로그인'}
            </button>

            {/* Demo hints */}
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--line)' }}>
              <button type="button" onClick={() => setShowHints(s => !s)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, fontWeight: 700, color: 'var(--ink-mute)', background: 'transparent', border: 'none', cursor: 'pointer'
              }}>
                <Icon name="info" size={13}/>
                데모 계정 {showHints ? '숨기기' : '보기'}
                <Icon name={showHints ? 'chevron-down' : 'chevron-right'} size={13}/>
              </button>
              {showHints && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {data.loginHints.map(h => (
                    <button type="button" key={h.loginId} onClick={() => quickFill(h)} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 10,
                      background: 'var(--bg)', border: '1px solid var(--line)',
                      textAlign: 'left', transition: 'all .12s', cursor: 'pointer'
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{h.label}</div>
                        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2 }}>
                          {h.loginId} / {h.pw}
                        </div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>자동 입력</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

window.LoginScreen = LoginScreen;
