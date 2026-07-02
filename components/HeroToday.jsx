// Today's me hero - refined compact design
const HeroToday = ({ me, attendance, penaltyMode, onCheckIn, onCheckOut, onChangeLunch, onShowLeaveForm, onShowOvertimeForm, clockSecs }) => {
  const emp = getEmployee(me);
  const att = attendance[me] || {};
  const status = att.status || 'not_checked_in';
  const isWorking = status === 'working';
  const isVacation = status === 'vacation';
  const isHalfday = status === 'halfday';
  const isCheckedOut = status === 'checked_out';
  const notIn = status === 'not_checked_in';

  // 퇴근 후 다시 출근 가능 (오후 6시부터 다음날 오전 9시 전까지는 차단)
  const canCheckIn = (() => {
    if (!notIn && !isCheckedOut) return false; // 이미 근무중이면 출근 불가
    if (isCheckedOut) {
      const now = new Date();
      const kstTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (9 * 3600000));
      const h = kstTime.getHours();
      if (h >= 18 || h < 9) {
        return false; 
      }
      return true;
    }
    return true;
  })();

  const today = window.PAPA_DATA.today.date;
  const penalty = penaltyMode?.[me];
  const inPenalty = penalty && penalty.startDate <= today && today <= penalty.endDate;

  // Parse HH:MM strings to minutes
  const toMin = (t) => { if (!t) return 0; const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const checkInMin = toMin(att.checkIn);
  const plannedOutMin = toMin(att.plannedOut);
  const totalWorkMin = (isWorking || isHalfday) ? plannedOutMin - checkInMin : 0;
  const elapsedMin = Math.floor(clockSecs / 60);
  const progressPct = totalWorkMin > 0 ? Math.min(100, (elapsedMin / totalWorkMin) * 100) : 0;

  const h = Math.floor(clockSecs / 3600);
  const m = Math.floor((clockSecs % 3600) / 60);
  const durationText = h > 0 ? `${h}시간 ${m}분` : `${m}분`;

  // labels
  let statusLabel, subLabel, clockLabel;
  if (isWorking) {
    statusLabel = '근무중';
    clockLabel = fmtClock(clockSecs);
    subLabel = emp.role === 'admin'
      ? `오늘 ${att.checkIn} 출근 · 현재 ${durationText}째 근무중`
      : `오늘 ${att.checkIn} 출근 · 현재 ${durationText}째 근무중 · ${att.plannedOut} 퇴근 예정`;
  } else if (isHalfday) {
    statusLabel = '반차 근무중';
    clockLabel = fmtClock(clockSecs);
    subLabel = `오늘 ${att.checkIn} 출근 · 현재 ${durationText}째 근무중 · ${att.plannedOut} 퇴근 예정`;
  } else if (isVacation) {
    statusLabel = '오늘은 연차';
    clockLabel = '—';
    subLabel = '즐거운 하루 보내세요 🌿';
  } else if (isCheckedOut) {
    statusLabel = '퇴근 완료';
    clockLabel = '—';
    subLabel = '오늘도 수고하셨어요 · 내일 9시 이후 출근 가능';
  } else {
    statusLabel = '출근 전';
    clockLabel = '00:00';
    subLabel = '9–11시 자율 출근 · 버튼을 눌러 체크인';
  }

  return (
    <div className="card-lg hero-gradient fade-in" style={{
      padding: 0, overflow: 'hidden', position: 'relative',
      gridColumn: 'span 8',
    }}>
      <div style={{ padding: '28px 32px 24px', position: 'relative' }}>
        {/* Top row: greeting + status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <div className="eyebrow">오늘 · {window.PAPA_DATA.today.label} {window.PAPA_DATA.today.weekday}</div>
            <div style={{ marginTop: 6, fontSize: 26, fontWeight: 800, letterSpacing: '-.03em', color: 'white' }}>
              안녕하세요, {emp.name}님
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,.16)', padding: '6px 12px', borderRadius: 999 }}>
            <span className="status-dot" style={{
              background: isWorking || isHalfday ? 'var(--ok)' : isVacation ? 'var(--warn)' : 'rgba(255,255,255,.6)',
              boxShadow: '0 0 0 3px rgba(255,255,255,.12)',
            }}></span>
            <span style={{ fontSize: 12, fontWeight: 600 }}>{statusLabel}</span>
          </div>
        </div>

        {/* Penalty banner */}
        {inPenalty && (
          <div style={{
            marginBottom: 18, padding: '12px 16px',
            background: 'rgba(248,99,99,.92)', color: 'white',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,.25)',
            display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: '0 4px 14px rgba(0,0,0,.15)',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: 'rgba(255,255,255,.22)',
              display: 'grid', placeItems: 'center',
              fontSize: 18,
            }}>🔥</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', opacity: .92 }}>
                벌칙 근태 적용 중
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2, letterSpacing: '-.01em' }}>
                매일 10시까지 출근해야 해요 · {penalty.reason}
              </div>
            </div>
            <div style={{
              fontSize: 11, fontWeight: 700, opacity: .92,
              padding: '6px 10px', borderRadius: 8,
              background: 'rgba(255,255,255,.18)',
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
            }}>
              {penalty.startDate.slice(5).replace('-','.')} – {penalty.endDate.slice(5).replace('-','.')}
            </div>
          </div>
        )}

        {/* Middle: clock + context */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'end', gap: 28,
          padding: '18px 0',
        }}>
          <div>
            <div className="eyebrow" style={{ color: 'rgba(255,255,255,.7)', marginBottom: 8 }}>
              {isWorking || isHalfday ? '근무 시간' : isVacation ? '상태' : '오늘 근무'}
            </div>
            <div style={{
              fontSize: 56, fontWeight: 800,
              lineHeight: 1, letterSpacing: '-.04em',
              fontVariantNumeric: 'tabular-nums',
              fontFeatureSettings: "'tnum'",
            }}>
              {clockLabel}
            </div>
            <div style={{ marginTop: 10, fontSize: 13, color: 'rgba(255,255,255,.78)', fontWeight: 500 }}>
              {subLabel}
            </div>
          </div>

          {/* Right-side: check-in + out times */}
          {(isWorking || isHalfday) && (
            <div style={{
              display: 'flex', gap: 0,
              background: 'rgba(255,255,255,.1)', borderRadius: 12,
              padding: 2, alignSelf: 'end',
            }}>
              <div style={{ padding: '10px 18px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.7)', fontWeight: 600, letterSpacing: '.1em' }}>IN</div>
                <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{att.checkIn}</div>
              </div>
              <div style={{ width: 1, background: 'rgba(255,255,255,.2)' }}/>
              <div style={{ padding: '10px 18px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.7)', fontWeight: 600, letterSpacing: '.1em' }}>OUT</div>
                <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{att.plannedOut}</div>
              </div>
            </div>
          )}
        </div>

        {/* Day progress bar */}
        {(isWorking || isHalfday) && (
          <div style={{ marginTop: 14 }}>
            <div style={{
              height: 6, borderRadius: 999,
              background: 'rgba(255,255,255,.14)', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                width: `${progressPct}%`,
                background: 'white', borderRadius: 999,
                transition: 'width .6s ease',
              }}/>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,.68)', letterSpacing: '.02em', fontVariantNumeric: 'tabular-nums' }}>
              <span>{Math.round(progressPct)}% 진행</span>
              <span>{fmtDuration(Math.max(0, totalWorkMin - elapsedMin))} 남음</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 22 }}>
          {(notIn || isCheckedOut) && (
            <button className="btn btn-lg btn-white" onClick={onCheckIn}
              disabled={!canCheckIn}
              style={{ opacity: canCheckIn ? 1 : .45, cursor: canCheckIn ? 'pointer' : 'not-allowed' }}>
              <Icon name="play" size={13} />
              {isCheckedOut ? (canCheckIn ? '다시 출근하기' : '퇴근 완료 · 내일 출근 가능') : '지금 출근하기'}
            </button>
          )}
          {(isWorking || isHalfday) && (
            <button className="btn btn-lg" style={{
              background: 'rgba(255,255,255,.14)', color: 'white',
              border: '1px solid rgba(255,255,255,.24)',
            }} onClick={onCheckOut}>
              <Icon name="stop" size={12} />
              퇴근하기
            </button>
          )}
          <button className="btn btn-lg" style={{
            background: 'rgba(255,255,255,.14)', color: 'white',
            border: '1px solid rgba(255,255,255,.24)',
          }} onClick={onShowLeaveForm}>
            <Icon name="plane" size={14} />
            휴가 신청
          </button>
          <button className="btn btn-lg" style={{
            background: 'rgba(255,255,255,.14)', color: 'white',
            border: '1px solid rgba(255,255,255,.24)',
          }} onClick={onShowOvertimeForm}>
            <Icon name="moon" size={14} />
            야근 신청
          </button>

          {/* Lunch selector — not for admin */}
          {(isWorking || isHalfday) && emp.role !== 'admin' && (
            <div style={{
              marginLeft: 'auto',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {att.lunch === 90 && att.lunchSlot && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 999,
                  background: att.lunchStatus === 'approved' ? 'rgba(61,207,166,.22)' : 'rgba(245,166,35,.25)',
                  color: 'white', fontSize: 11, fontWeight: 700,
                  border: `1px solid ${att.lunchStatus === 'approved' ? 'rgba(61,207,166,.6)' : 'rgba(245,166,35,.6)'}`,
                }}>
                  <Icon name="coffee" size={11}/>
                  {att.lunchSlot === 'early' ? '12:00–13:30' : '12:30–14:00'}
                  <span style={{ opacity: .8 }}>·</span>
                  {att.lunchStatus === 'approved' ? '승인' : '대기중'}
                </div>
              )}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 2,
                background: 'rgba(255,255,255,.12)', borderRadius: 10, padding: 2,
              }}>
                {[60, 90].map(m => (
                  <button key={m} onClick={() => onChangeLunch(m)} style={{
                    padding: '8px 14px', borderRadius: 8,
                    fontSize: 12, fontWeight: 700,
                    background: att.lunch === m ? 'white' : 'transparent',
                    color: att.lunch === m ? 'var(--accent)' : 'rgba(255,255,255,.82)',
                    transition: 'all .15s',
                  }}>
                    점심 {m === 60 ? '1h' : '1.5h'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

window.HeroToday = HeroToday;
