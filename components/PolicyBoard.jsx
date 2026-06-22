// Policy board — admin can write/edit posts, others view only
const PolicyBoardPage = ({ role, currentUserId }) => {
  const data = window.PAPA_DATA;
  const isAdmin = role === 'admin';

  const [posts, setPosts] = React.useState(data.policyPosts);
  const [selectedId, setSelectedId] = React.useState(posts[0]?.id);
  const [editing, setEditing] = React.useState(null); // null | 'new' | post.id
  const [filterCat, setFilterCat] = React.useState('전체');

  const categories = ['전체', ...Array.from(new Set(posts.map(p => p.category)))];
  const visiblePosts = posts
    .filter(p => filterCat === '전체' || p.category === filterCat)
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });

  const selected = posts.find(p => p.id === selectedId) || visiblePosts[0];

  const handleSave = (draft) => {
    if (editing === 'new') {
      const newPost = {
        ...draft,
        id: 'p_' + Date.now(),
        author: getEmployee(currentUserId).name,
        authorId: currentUserId,
        updatedAt: new Date().toISOString().slice(0, 10),
      };
      setPosts(prev => [newPost, ...prev]);
      setSelectedId(newPost.id);
    } else {
      setPosts(prev => prev.map(p => p.id === editing
        ? { ...p, ...draft, updatedAt: new Date().toISOString().slice(0, 10) }
        : p));
    }
    setEditing(null);
  };

  const handleDelete = (id) => {
    if (!confirm('이 게시물을 삭제하시겠어요?')) return;
    setPosts(prev => prev.filter(p => p.id !== id));
    if (selectedId === id) setSelectedId(posts[0]?.id);
  };

  const togglePin = (id) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, pinned: !p.pinned } : p));
  };

  return (
    <>
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>
        <div>
          <div className="eyebrow">POLICY</div>
          <h1 style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-.04em', marginTop: 8, lineHeight: 1 }}>
            근무 규정
          </h1>
          <div style={{ fontSize: 17, color: 'var(--ink-soft)', marginTop: 10, fontWeight: 500 }}>
            {isAdmin
              ? '게시물을 작성·수정·삭제하고 팀에 공지할 수 있어요.'
              : '관리자가 작성한 근무 규정을 확인하세요.'}
          </div>
        </div>
        {isAdmin && (
          <button className="btn btn-primary btn-lg" onClick={() => setEditing('new')}>
            <Icon name="plus" size={16}/> 새 글 작성
          </button>
        )}
      </div>

      {/* Category filter chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {categories.map(c => (
          <button key={c} onClick={() => setFilterCat(c)} style={{
            padding: '8px 14px', borderRadius: 999,
            fontSize: 13, fontWeight: 700,
            background: filterCat === c ? 'var(--ink)' : 'var(--surface)',
            color: filterCat === c ? 'white' : 'var(--ink-soft)',
            border: '1px solid var(--line)',
            transition: 'all .15s',
          }}>
            {c}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, alignItems: 'start' }}>
        {/* List */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '14px 18px', borderBottom: '1px solid var(--line)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--bg)',
          }}>
            <div className="eyebrow">게시판</div>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {visiblePosts.length}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {visiblePosts.map(p => {
              const isActive = selected?.id === p.id;
              return (
                <button key={p.id} onClick={() => setSelectedId(p.id)} style={{
                  display: 'block', textAlign: 'left',
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--line-soft)',
                  background: isActive ? 'var(--accent-soft)' : 'transparent',
                  borderLeft: `3px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                  cursor: 'pointer', transition: 'background .12s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    {p.pinned && <span style={{ fontSize: 11 }}>📌</span>}
                    <span style={{
                      fontSize: 10, fontWeight: 800, letterSpacing: '.06em',
                      padding: '2px 7px', borderRadius: 4,
                      background: 'var(--bg)', color: 'var(--ink-soft)',
                    }}>{p.category}</span>
                  </div>
                  <div style={{
                    fontSize: 14, fontWeight: 700, letterSpacing: '-.01em',
                    color: isActive ? 'var(--accent-dark)' : 'var(--ink)',
                    lineHeight: 1.35,
                  }}>{p.title}</div>
                  <div style={{
                    marginTop: 6, fontSize: 11, color: 'var(--ink-mute)',
                    display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600,
                  }}>
                    <span>{p.author}</span>
                    <span>·</span>
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>{p.updatedAt}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail */}
        {selected && (
          <div className="card" style={{ padding: '32px 36px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 800, letterSpacing: '.08em',
                    padding: '4px 10px', borderRadius: 6,
                    background: 'var(--accent-soft)', color: 'var(--accent-dark)',
                  }}>{selected.category}</span>
                  {selected.pinned && (
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      padding: '4px 10px', borderRadius: 6,
                      background: 'var(--warn-soft)', color: 'var(--warn-ink)',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>📌 공지</span>
                  )}
                </div>
                <h2 style={{
                  fontSize: 32, fontWeight: 800, letterSpacing: '-.03em',
                  lineHeight: 1.2, margin: 0,
                }}>{selected.title}</h2>
                <div style={{
                  marginTop: 14, display: 'flex', alignItems: 'center', gap: 10,
                  fontSize: 13, color: 'var(--ink-soft)', fontWeight: 600,
                }}>
                  <Avatar empId={selected.authorId} size="sm" />
                  <span style={{ color: 'var(--ink)', fontWeight: 700 }}>{selected.author}</span>
                  <span style={{ color: 'var(--ink-mute)' }}>·</span>
                  <span style={{ color: 'var(--ink-mute)', fontVariantNumeric: 'tabular-nums' }}>
                    최종 수정 {selected.updatedAt}
                  </span>
                </div>
              </div>

              {isAdmin && (
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button className="btn-icon" onClick={() => togglePin(selected.id)}
                    title={selected.pinned ? '고정 해제' : '상단 고정'}
                    style={{ background: selected.pinned ? 'var(--warn-soft)' : 'var(--bg)', color: selected.pinned ? 'var(--warn-ink)' : 'var(--ink-soft)' }}>
                    📌
                  </button>
                  <button className="btn btn-ghost" onClick={() => setEditing(selected.id)}>
                    <Icon name="edit" size={14}/> 수정
                  </button>
                  <button className="btn-icon" onClick={() => handleDelete(selected.id)}
                    style={{ background: 'var(--bg)', color: 'var(--danger)' }}>
                    <Icon name="trash" size={14}/>
                  </button>
                </div>
              )}
            </div>

            <div style={{ height: 1, background: 'var(--line)', margin: '24px 0' }}/>

            <div style={{
              fontSize: 15, lineHeight: 1.75, color: 'var(--ink)',
              whiteSpace: 'pre-wrap', wordBreak: 'keep-all',
            }}>
              {selected.body}
            </div>

            {!isAdmin && (
              <div style={{
                marginTop: 28, padding: '12px 16px',
                background: 'var(--bg)', borderRadius: 10,
                fontSize: 12, color: 'var(--ink-mute)', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Icon name="info" size={13}/>
                근무 규정은 관리자만 수정할 수 있습니다. 문의는 #papa-help 채널로 주세요.
              </div>
            )}
          </div>
        )}
      </div>

      {editing && (
        <PolicyEditor
          post={editing === 'new' ? null : posts.find(p => p.id === editing)}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          existingCategories={Array.from(new Set(posts.map(p => p.category)))}
        />
      )}
    </>
  );
};

const PolicyEditor = ({ post, onClose, onSave, existingCategories }) => {
  const [title, setTitle] = React.useState(post?.title || '');
  const [category, setCategory] = React.useState(post?.category || existingCategories[0] || '근무시간');
  const [body, setBody] = React.useState(post?.body || '');
  const [pinned, setPinned] = React.useState(post?.pinned || false);

  const canSave = title.trim() && body.trim();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 720, maxWidth: '92vw' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div className="eyebrow">{post ? 'EDIT POST' : 'NEW POST'}</div>
            <div className="h1" style={{ marginTop: 6 }}>{post ? '게시물 수정' : '새 게시물 작성'}</div>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ background: 'var(--bg)' }}>
            <Icon name="x" size={16}/>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 12, marginBottom: 14 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>제목</div>
            <input className="input" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="예) 유연 출퇴근 제도" style={{ fontSize: 16, fontWeight: 700 }}/>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>카테고리</div>
            <input className="input" value={category} onChange={e => setCategory(e.target.value)}
              list="cat-list"/>
            <datalist id="cat-list">
              {existingCategories.map(c => <option key={c} value={c}/>)}
            </datalist>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>본문</div>
          <textarea className="input" rows="14" value={body} onChange={e => setBody(e.target.value)}
            placeholder="본문을 입력하세요. 줄바꿈은 그대로 표시됩니다."
            style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 14, lineHeight: 1.7 }}/>
        </div>

        <div style={{
          marginBottom: 20, padding: '12px 14px', borderRadius: 10,
          background: 'var(--bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>📌 상단 고정</div>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2, fontWeight: 600 }}>
              게시판 상단에 항상 노출됩니다
            </div>
          </div>
          <button onClick={() => setPinned(!pinned)} style={{
            width: 44, height: 26, borderRadius: 999,
            background: pinned ? 'var(--accent)' : 'var(--line)',
            position: 'relative', transition: 'background .15s',
          }}>
            <span style={{
              position: 'absolute', top: 3, left: pinned ? 21 : 3,
              width: 20, height: 20, borderRadius: '50%',
              background: 'white', transition: 'left .15s',
              boxShadow: '0 1px 3px rgba(0,0,0,.2)',
            }}/>
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-lg" onClick={onClose} style={{ flex: 1 }}>취소</button>
          <button className="btn btn-primary btn-lg"
            onClick={() => onSave({ title: title.trim(), category: category.trim(), body: body.trim(), pinned })}
            disabled={!canSave}
            style={{ flex: 2, opacity: canSave ? 1 : .4, cursor: canSave ? 'pointer' : 'not-allowed' }}>
            {post ? '수정 완료' : '게시하기'}
          </button>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { PolicyBoardPage, PolicyEditor });
