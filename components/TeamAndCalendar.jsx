// Team status + Late feed (for seniors/admin) + Mini calendar
const TeamStatus = ({ attendance, employees, lateCounter, onSelectMember }) => {
  return (
    <div className="card fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="eyebrow">팀 현황</div>
          <div className="h2" style={{ marginTop: 6 }}>오늘 누가 있나요?</div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-mute)', fontWeight: 600 }}>
          {employees.filter(e => attendance[e.id]?.status === 'working' || attendance[e.id]?.status === 'halfday').length} / {employees.length} 근무
        </div>
      </div>

      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {employees.map(emp => {
          const att = attendance[emp.id] || {};
          return (
            <div key={emp.id}
              onClick={() => onSelectMember && onSelectMember(emp.id)}
              style={{
                display: 'grid',
                gridTemplateColumns: '40px 1fr auto auto',
                alignItems: 'center', gap: 14,
                padding: '10px 8px', marginLeft: -8, marginRight: -8,
                borderRadius: 10,
                borderBottom: '1px solid var(--line-soft)',
                cursor: 'pointer',
                transition: 'background .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Avatar empId={emp.id} size="md" />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {emp.name}
                  {att.wasLate && <span className="pill pill-danger" style={{ fontSize: 10, padding: '2px 7px' }}>지각</span>}
                  {att.lunch === 90 && (att.status === 'working' || att.status === 'halfday') && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 3,
                      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
                      background: att.lunchStatus === 'approved' ? 'rgba(61,207,166,.18)' : 'rgba(245,166,35,.22)',
                      color: att.lunchStatus === 'approved' ? 'var(--ok-ink, #1d7a5a)' : 'var(--warn-ink)',
                      border: `1px solid ${att.lunchStatus === 'approved' ? 'rgba(61,207,166,.5)' : 'rgba(245,166,35,.5)'}`,
                    }}>
                      <Icon name="coffee" size={9}/>
                      점심 1.5h
                      {att.lunchSlot && <span style={{ opacity: .7, fontWeight: 600 }}>· {att.lunchSlot === 'early' ? '12:00' : '12:30'}</span>}
                      {att.lunchStatus === 'pending' && <span style={{ opacity: .7, fontWeight: 600 }}>· 대기</span>}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2 }}>
                  {emp.title} · {emp.team}
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {att.status === 'working' && `${att.checkIn} → ${att.plannedOut}`}
                {att.status === 'halfday' && `반차 · ${att.plannedOut}`}
                {att.status === 'vacation' && '—'}
                {att.status === 'not_checked_in' && '출근 전'}
              </div>
              <StatusChip status={att.status} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MemberProfilePopup = ({ empId, currentUserId, onClose }) => {
  if (!empId) return null;
  const emp = getEmployee(empId);
  if (!emp) return null;
  const tenureYears = getTenureYears(emp.joined);
  const isMe = empId === currentUserId;
  const fileRef = React.useRef(null);
  const [cropSrc, setCropSrc] = React.useState(null); // data URL of picked image awaiting crop
  const [, force] = React.useReducer(x => x + 1, 0);

  const handlePick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-pick same file
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert('이미지는 8MB 이하로 업로드해주세요.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result);
    reader.readAsDataURL(file);
  };

  const handleCropDone = (dataUrl) => {
    savePhoto(empId, dataUrl);
    setCropSrc(null);
    force();
  };

  const handleRemove = () => {
    if (!confirm('프로필 사진을 삭제하시겠습니까?')) return;
    savePhoto(empId, null);
    force();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 420, padding: 0, overflow: 'hidden' }}>
        {/* Colored header */}
        <div className={emp.color} style={{ padding: '32px 32px 24px', position: 'relative', color: 'white' }}>
          <button onClick={onClose} style={{
            position: 'absolute', top: 16, right: 16,
            width: 32, height: 32, borderRadius: 10,
            background: 'rgba(255,255,255,.2)', color: 'white',
            display: 'grid', placeItems: 'center',
          }}>
            <Icon name="x" size={16}/>
          </button>

          {/* Avatar (photo or initials) with optional camera overlay */}
          <div style={{ position: 'relative', width: 72, height: 72 }}>
            {emp.photo ? (
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                backgroundImage: `url(${emp.photo})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                border: '3px solid rgba(255,255,255,.45)',
              }}/>
            ) : (
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'rgba(255,255,255,.2)',
                display: 'grid', placeItems: 'center',
                fontSize: 26, fontWeight: 800, letterSpacing: '-.02em',
                border: '3px solid rgba(255,255,255,.3)',
              }}>{emp.initials}</div>
            )}
            {isMe && (
              <button
                onClick={() => fileRef.current?.click()}
                title="사진 변경"
                style={{
                  position: 'absolute', right: -4, bottom: -4,
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'white', color: 'var(--ink)',
                  border: '2px solid white',
                  boxShadow: '0 4px 10px rgba(0,0,0,.18)',
                  display: 'grid', placeItems: 'center',
                  cursor: 'pointer',
                }}>
                <Icon name="edit" size={12}/>
              </button>
            )}
            {isMe && (
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handlePick}
                style={{ display: 'none' }}
              />
            )}
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.02em' }}>{emp.name}</div>
            <div style={{ fontSize: 13, fontWeight: 500, opacity: .85, marginTop: 4 }}>
              {emp.title} · {emp.team}
            </div>
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <RolePill role={emp.role}/>
            <span className="pill" style={{ background: 'rgba(255,255,255,.22)', color: 'white' }}>
              {tenureYears}년차
            </span>
          </div>
        </div>

        {/* Contact info */}
        <div style={{ padding: '24px 32px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {isMe && (
            <div style={{
              padding: '10px 12px', borderRadius: 10,
              background: 'var(--bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)' }}>
                <Icon name="info" size={11}/> 본인 프로필 — 사진을 변경할 수 있습니다
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="btn"
                  style={{ padding: '6px 10px', fontSize: 11 }}>
                  <Icon name="edit" size={11}/> 사진 변경
                </button>
                {emp.photo && (
                  <button
                    onClick={handleRemove}
                    className="btn"
                    style={{ padding: '6px 10px', fontSize: 11, color: 'var(--danger)' }}>
                    <Icon name="trash" size={11}/>
                  </button>
                )}
              </div>
            </div>
          )}
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>이메일</div>
            <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
              {emp.email}
            </div>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>휴대폰</div>
            <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums' }}>
              {emp.phone}
            </div>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>생일</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>
              {emp.birthday.replace('-', '월 ')}일
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <a href={`mailto:${emp.email}`} className="btn btn-primary" style={{ flex: 1 }}>
              <Icon name="message" size={14}/> 메일 보내기
            </a>
            <a href={`tel:${emp.phone}`} className="btn btn-ghost" style={{ flex: 1 }}>
              전화 걸기
            </a>
          </div>
        </div>
      </div>
      {cropSrc && (
        <PhotoCropModal
          src={cropSrc}
          onCancel={() => setCropSrc(null)}
          onSave={handleCropDone}
        />
      )}
    </div>
  );
};

// Photo crop modal — circular frame with pan + zoom
const PhotoCropModal = ({ src, onCancel, onSave }) => {
  const FRAME = 280;        // visible circular crop frame size on screen
  const OUTPUT = 320;       // saved image resolution
  const [img, setImg] = React.useState(null);
  const [scale, setScale] = React.useState(1);
  const [minScale, setMinScale] = React.useState(1);
  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  const dragRef = React.useRef(null);

  React.useEffect(() => {
    const i = new Image();
    i.onload = () => {
      // Initial scale = cover (fill the circle)
      const cover = Math.max(FRAME / i.width, FRAME / i.height);
      setMinScale(cover);
      setScale(cover);
      setPos({ x: 0, y: 0 });
      setImg(i);
    };
    i.src = src;
  }, [src]);

  // Constrain pan so image always covers the circle
  const clamp = React.useCallback((p, s, w, h) => {
    const halfW = (w * s) / 2;
    const halfH = (h * s) / 2;
    const limX = Math.max(0, halfW - FRAME / 2);
    const limY = Math.max(0, halfH - FRAME / 2);
    return {
      x: Math.max(-limX, Math.min(limX, p.x)),
      y: Math.max(-limY, Math.min(limY, p.y)),
    };
  }, []);

  const onMouseDown = (e) => {
    e.preventDefault();
    dragRef.current = { x: e.clientX, y: e.clientY, startX: pos.x, startY: pos.y };
  };
  const onMouseMove = (e) => {
    if (!dragRef.current || !img) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setPos(clamp({ x: dragRef.current.startX + dx, y: dragRef.current.startY + dy }, scale, img.width, img.height));
  };
  const onMouseUp = () => { dragRef.current = null; };

  React.useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  });

  // Touch support
  const onTouchStart = (e) => {
    const t = e.touches[0];
    dragRef.current = { x: t.clientX, y: t.clientY, startX: pos.x, startY: pos.y };
  };
  const onTouchMove = (e) => {
    if (!dragRef.current || !img) return;
    const t = e.touches[0];
    const dx = t.clientX - dragRef.current.x;
    const dy = t.clientY - dragRef.current.y;
    setPos(clamp({ x: dragRef.current.startX + dx, y: dragRef.current.startY + dy }, scale, img.width, img.height));
  };

  const onWheel = (e) => {
    if (!img) return;
    e.preventDefault();
    const next = Math.max(minScale, Math.min(minScale * 4, scale * (e.deltaY < 0 ? 1.06 : 0.94)));
    setScale(next);
    setPos(clamp(pos, next, img.width, img.height));
  };

  const onScaleChange = (e) => {
    if (!img) return;
    const next = parseFloat(e.target.value);
    setScale(next);
    setPos(clamp(pos, next, img.width, img.height));
  };

  const handleSave = () => {
    if (!img) return;
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT; canvas.height = OUTPUT;
    const ctx = canvas.getContext('2d');
    // Map screen frame → output canvas
    const ratio = OUTPUT / FRAME;
    const drawW = img.width * scale * ratio;
    const drawH = img.height * scale * ratio;
    const cx = OUTPUT / 2 + pos.x * ratio;
    const cy = OUTPUT / 2 + pos.y * ratio;
    ctx.drawImage(img, cx - drawW / 2, cy - drawH / 2, drawW, drawH);
    onSave(canvas.toDataURL('image/jpeg', 0.88));
  };

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,18,28,.7)',
        backdropFilter: 'blur(8px)', zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: 18, width: 380, maxWidth: '100%',
          padding: 24, boxShadow: '0 32px 90px rgba(0,0,0,.32)',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div className="eyebrow">프로필 사진</div>
            <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2, letterSpacing: '-.01em' }}>
              원형 안에 맞추기
            </div>
          </div>
          <button onClick={onCancel} className="btn-icon" style={{ background: 'var(--bg)' }}>
            <Icon name="x" size={15}/>
          </button>
        </div>

        {/* Crop stage */}
        <div
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onWheel={onWheel}
          style={{
            position: 'relative',
            width: FRAME, height: FRAME,
            margin: '0 auto',
            background: '#0e1320',
            borderRadius: 12,
            overflow: 'hidden',
            cursor: dragRef.current ? 'grabbing' : 'grab',
            userSelect: 'none',
            touchAction: 'none',
          }}>
          {img && (
            <img
              src={src}
              draggable={false}
              style={{
                position: 'absolute',
                left: '50%', top: '50%',
                width: img.width * scale,
                height: img.height * scale,
                transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
                pointerEvents: 'none',
              }}
            />
          )}
          {/* Circular mask overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            boxShadow: `0 0 0 9999px rgba(15,18,28,.55)`,
            borderRadius: '50%',
            pointerEvents: 'none',
          }}/>
          {/* Inner circle outline */}
          <div style={{
            position: 'absolute', inset: 0,
            border: '2px solid rgba(255,255,255,.92)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}/>
          {/* Crosshair guides */}
          <div style={{
            position: 'absolute', left: '50%', top: 0, bottom: 0,
            width: 1, background: 'rgba(255,255,255,.18)', pointerEvents: 'none',
          }}/>
          <div style={{
            position: 'absolute', top: '50%', left: 0, right: 0,
            height: 1, background: 'rgba(255,255,255,.18)', pointerEvents: 'none',
          }}/>
        </div>

        {/* Zoom slider */}
        <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon name="image" size={13} />
          <input
            type="range"
            min={minScale}
            max={minScale * 4}
            step={0.01}
            value={scale}
            onChange={onScaleChange}
            style={{ flex: 1, accentColor: 'var(--accent)' }}
          />
          <Icon name="image" size={18} />
        </div>

        <div style={{
          fontSize: 11, color: 'var(--ink-mute)', textAlign: 'center',
          marginTop: 10, fontWeight: 500,
        }}>
          드래그하여 위치 조정 · 슬라이더로 확대/축소 · 마우스 휠 지원
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <button className="btn" onClick={onCancel} style={{ flex: 1 }}>취소</button>
          <button className="btn btn-primary" onClick={handleSave} style={{ flex: 1 }}>
            <Icon name="check" size={14} strokeWidth={2.5}/>
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

window.MemberProfilePopup = MemberProfilePopup;
window.PhotoCropModal = PhotoCropModal;

const LateLogFeed = ({ lateLogs, employees }) => {
  // group by date
  const sorted = [...lateLogs].sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
  return (
    <div className="card fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="eyebrow" style={{ color: 'var(--danger)' }}>시니어 · 관리자 전용</div>
          <div className="h2" style={{ marginTop: 6 }}>지각 기록</div>
        </div>
        <span className="pill pill-mute">최근 {sorted.length}건</span>
      </div>

      <div style={{ marginTop: 20, maxHeight: 340, overflow: 'auto', paddingRight: 4 }}>
        {sorted.map((log, i) => {
          const emp = getEmployee(log.empId);
          const isToday = log.date === window.PAPA_DATA.today.date;
          return (
            <div key={log.id} style={{
              display: 'grid',
              gridTemplateColumns: '64px 40px 1fr auto',
              alignItems: 'center', gap: 14,
              padding: '12px 0',
              borderTop: i === 0 ? 'none' : '1px solid var(--line-soft)',
            }}>
              <div>
                <div className="mono" style={{ fontSize: 12, fontWeight: 700, color: isToday ? 'var(--danger)' : 'var(--ink)' }}>
                  {log.date.slice(5).replace('-', '/')}
                </div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', marginTop: 2 }}>
                  {log.time}
                </div>
              </div>
              <Avatar empId={log.empId} size="sm" />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  {emp.name} <span style={{ color: 'var(--ink-mute)', fontWeight: 500 }}>· +{log.delta}분</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {log.reason}
                </div>
              </div>
              <div style={{
                fontSize: 20, fontWeight: 800,
                color: log.delta > 30 ? 'var(--danger)' : log.delta > 15 ? 'var(--warn)' : 'var(--ink-mute)',
                fontVariantNumeric: 'tabular-nums',
              }}>
                +{log.delta}<span style={{ fontSize: 11, fontWeight: 600, marginLeft: 2 }}>m</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MiniCalendar = ({ events }) => {
  const [month, setMonth] = React.useState(3); // 0=Jan, 3=Apr
  const year = 2026;

  // days in month + first weekday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const today = month === 3 ? 21 : -1;
  const monthName = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'][month];

  // Derive birthday events for this month from employee roster
  const employees = window.PAPA_DATA.employees;
  const birthdayEvents = employees
    .filter(e => parseInt(e.birthday.slice(0, 2), 10) === month + 1)
    .map(e => ({
      date: `${year}-${String(month + 1).padStart(2, '0')}-${e.birthday.slice(3)}`,
      type: 'birthday',
      empId: e.id,
      label: `${e.name} 생일`,
    }));

  // Merge with explicit events, filter to current month
  const allEvents = [...events, ...birthdayEvents].filter(e => {
    const [ey, em] = e.date.split('-').map(Number);
    return ey === year && em === month + 1;
  });

  // Dedupe birthdays (explicit events may already include one)
  const seen = new Set();
  const dedupedEvents = allEvents.filter(e => {
    const key = `${e.date}|${e.type}|${e.empId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Index by day
  const byDate = {};
  dedupedEvents.forEach(e => {
    const d = parseInt(e.date.slice(8), 10);
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(e);
  });

  // Priority: vacation > halfday > birthday > late (for day background tint)
  const priority = { vacation: 4, halfday: 3, birthday: 2, late: 1 };

  const cells = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  const typeColor = (t) => ({
    vacation: { bg: 'rgba(245,166,35,.14)', dot: 'var(--warn)', border: 'rgba(245,166,35,.35)' },
    halfday:  { bg: 'rgba(77,106,255,.10)', dot: 'var(--accent)', border: 'rgba(77,106,255,.28)' },
    birthday: { bg: 'rgba(248,99,99,.12)', dot: 'var(--danger)', border: 'rgba(248,99,99,.32)' },
    late:     { bg: 'var(--bg)', dot: 'var(--ink-mute)', border: 'var(--line)' },
  })[t];

  const typeIcon = (t) => ({
    vacation: '🌴',
    halfday: '◐',
    birthday: '🎂',
    late: '·',
  })[t];

  return (
    <div className="card fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="eyebrow">팀 캘린더</div>
          <div className="h2" style={{ marginTop: 6 }}>{monthName} {year}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button className="btn-icon" style={{ background: 'var(--bg)' }} onClick={() => setMonth(m => Math.max(0, m - 1))}>
            <Icon name="chevron-right" size={14} strokeWidth={2.5} style={{ transform: 'rotate(180deg)' }}/>
          </button>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-mute)', minWidth: 50, textAlign: 'center' }}>
            {monthName}
          </div>
          <button className="btn-icon" style={{ background: 'var(--bg)' }} onClick={() => setMonth(m => Math.min(11, m + 1))}>
            <Icon name="chevron-right" size={14} strokeWidth={2.5}/>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginTop: 18 }}>
        {['일','월','화','수','목','금','토'].map((d, i) => (
          <div key={d} style={{
            textAlign: 'center', padding: '6px 0',
            fontSize: 10, fontWeight: 700, letterSpacing: '.08em',
            color: i === 0 ? 'var(--danger)' : i === 6 ? 'var(--accent)' : 'var(--ink-mute)',
          }}>{d}</div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={i}/>;
          const isToday = d === today;
          const evs = byDate[d] || [];
          // pick top-priority event for background tint
          const top = evs.slice().sort((a, b) => (priority[b.type] || 0) - (priority[a.type] || 0))[0];
          const bgStyle = top && !isToday ? typeColor(top.type) : null;

          return (
            <div key={i} style={{
              minHeight: 72,
              padding: 6,
              borderRadius: 10,
              background: isToday ? 'var(--accent)' : bgStyle ? bgStyle.bg : 'transparent',
              border: isToday ? 'none' : bgStyle ? `1px solid ${bgStyle.border}` : '1px solid transparent',
              color: isToday ? 'white' : 'var(--ink)',
              display: 'flex', flexDirection: 'column',
              position: 'relative',
              cursor: evs.length ? 'pointer' : 'default',
              transition: 'all .15s',
            }}>
              {/* Day number */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 4,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{d}</div>
                {evs.length > 0 && (
                  <div style={{
                    fontSize: 10, fontWeight: 700,
                    opacity: .7,
                  }}>
                    {evs.length > 1 ? `+${evs.length}` : ''}
                  </div>
                )}
              </div>

              {/* Event preview: avatar stack */}
              {evs.length > 0 && (
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Show up to 2 events as mini pills, rest as avatar stack */}
                  {evs.slice(0, 2).map((e, j) => {
                    const emp = getEmployee(e.empId);
                    if (!emp) return null;
                    return (
                      <div key={j} title={e.label} style={{
                        display: 'flex', alignItems: 'center', gap: 3,
                        padding: '2px 4px 2px 2px',
                        borderRadius: 6,
                        background: isToday ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.7)',
                        fontSize: 9, fontWeight: 700,
                        overflow: 'hidden',
                      }}>
                        <span style={{ fontSize: 10, flexShrink: 0 }}>{typeIcon(e.type)}</span>
                        <span style={{
                          fontSize: 9,
                          color: isToday ? 'white' : 'var(--ink)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>{emp.name.slice(1)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{
        marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--line-soft)',
        display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 11, color: 'var(--ink-soft)', fontWeight: 600,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13 }}>🌴</span> 연차
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13 }}>◐</span> 반차
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13 }}>🎂</span> 생일
        </div>
      </div>
    </div>
  );
};

const LunchLog = ({ lunchLog }) => {
  return (
    <div className="card fade-in" style={{ background: 'var(--warn-soft)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="eyebrow" style={{ color: 'var(--warn-ink)' }}>🍚 밥먹어요 방</div>
          <div className="h3" style={{ marginTop: 4 }}>오늘의 점심</div>
        </div>
        <button className="btn" style={{ background: 'white', color: 'var(--warn-ink)', fontSize: 12, padding: '8px 12px' }}>
          <Icon name="plus" size={12} /> 1.5h 신청
        </button>
      </div>
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {lunchLog.map((l, i) => {
          const emp = getEmployee(l.empId);
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar empId={l.empId} size="xs" />
              <div style={{ fontSize: 12, fontWeight: 700 }}>{emp.name}</div>
              <span className={`pill ${l.duration === 90 ? 'pill-warn' : 'pill-mute'}`}
                    style={{ fontSize: 10, padding: '2px 7px' }}>
                {l.duration === 90 ? '1.5h' : '1h'}
              </span>
              {l.note && (
                <div style={{ fontSize: 11, color: 'var(--ink-soft)', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {l.note}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PolicyStrip = ({ policies }) => {
  return (
    <div className="card fade-in" style={{ gridColumn: 'span 12', padding: '20px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 140 }}>
          <div className="eyebrow">근무 규정</div>
          <div className="h3" style={{ marginTop: 4 }}>꼭 알아두기</div>
        </div>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {policies.map(p => (
            <div key={p.key} style={{ borderLeft: '2px solid var(--accent)', paddingLeft: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{p.title}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4, lineHeight: 1.5 }}>{p.body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { TeamStatus, LateLogFeed, MiniCalendar, LunchLog, PolicyStrip, MemberProfilePopup });
