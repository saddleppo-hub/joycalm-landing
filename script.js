/* ═══════════════════════════════════════════════════════════
   JoyCalm landing — interactions
   ═══════════════════════════════════════════════════════════ */

/* ───────────────────────────────────────────────────────────
   문의 폼 전송 설정
   ───────────────────────────────────────────────────────────
   FORM_ENDPOINT 를 비워두면(기본값) 방문자의 메일 앱이 열리면서
   입력한 내용이 담긴 메일이 자동 작성됩니다.

   Formspree / Google Apps Script / Getform 등 폼 수집 서비스를
   쓰실 경우 아래 주소만 채워 넣으면 서버로 바로 전송됩니다.
   예) const FORM_ENDPOINT = 'https://formspree.io/f/xxxxxxx';
   ─────────────────────────────────────────────────────────── */
const FORM_ENDPOINT = '';
const CONTACT_EMAIL = 'joycalm.biz@gmail.com';

/* ─────────── 모바일 메뉴 ─────────── */
(function () {
  const toggle = document.getElementById('navToggle');
  const drawer = document.getElementById('navDrawer');
  if (!toggle || !drawer) return;

  toggle.addEventListener('click', () => {
    const open = drawer.hidden;
    drawer.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  });

  drawer.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      drawer.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
})();

/* ─────────── 후기 필터 + 더 보기 ─────────── */
(function () {
  const wrap = document.getElementById('quotes');
  const moreBtn = document.getElementById('moreQuotes');
  if (!wrap) return;

  const quotes = Array.from(wrap.querySelectorAll('.quote'));
  const pills = Array.from(document.querySelectorAll('.filters .pill'));
  const note = document.getElementById('filterNote');
  let filter = 'all';
  let expanded = false;

  /* 처음에는 ★ 대표 후기만 보여주고(전체 18개 · 주제별 3개),
     '더 보기'를 누르면 해당 주제의 나머지가 모두 펼쳐진다 */
  function render() {
    const matched = quotes.filter(q => filter === 'all' || q.dataset.group === filter);
    const shown = expanded ? matched : matched.filter(q => q.dataset.featured === '1');

    quotes.forEach(q => q.classList.add('is-hidden'));
    shown.forEach(q => q.classList.remove('is-hidden'));

    if (moreBtn) {
      const remaining = matched.length - shown.length;
      moreBtn.hidden = remaining <= 0;
      moreBtn.textContent = `후기 ${remaining}개 더 보기`;
    }
  }

  function setNote(pill) {
    if (note) note.textContent = pill.dataset.note || '';
  }

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => {
        p.classList.remove('is-active');
        p.setAttribute('aria-selected', 'false');
        const dot = p.querySelector('.pill-dot');
        if (dot) dot.remove();
      });
      pill.classList.add('is-active');
      pill.setAttribute('aria-selected', 'true');
      const dot = document.createElement('span');
      dot.className = 'pill-dot';
      dot.setAttribute('aria-hidden', 'true');
      pill.prepend(dot);

      filter = pill.dataset.filter;
      expanded = false;          // 주제를 바꾸면 다시 대표 후기만
      setNote(pill);
      render();
    });
  });

  if (moreBtn) {
    moreBtn.addEventListener('click', () => { expanded = true; render(); });
  }

  setNote(pills.find(p => p.classList.contains('is-active')) || pills[0]);
  render();
})();

/* ─────────── 아카이브 라이트박스 ─────────── */
(function () {
  const gallery = document.getElementById('gallery');
  const box = document.getElementById('lightbox');
  const img = document.getElementById('lbImg');
  if (!gallery || !box || !img) return;

  const items = Array.from(gallery.querySelectorAll('.gitem'));
  let index = 0;
  let lastFocus = null;

  function show(i) {
    index = (i + items.length) % items.length;
    const btn = items[index];
    img.src = btn.dataset.src;
    img.alt = btn.querySelector('img').alt;
  }

  function open(i) {
    lastFocus = document.activeElement;
    show(i);
    box.hidden = false;
    document.body.style.overflow = 'hidden';
    document.getElementById('lbClose').focus();
  }

  function close() {
    box.hidden = true;
    img.src = '';
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  items.forEach((btn, i) => btn.addEventListener('click', () => open(i)));

  document.getElementById('lbClose').addEventListener('click', close);
  document.getElementById('lbPrev').addEventListener('click', () => show(index - 1));
  document.getElementById('lbNext').addEventListener('click', () => show(index + 1));
  box.addEventListener('click', (e) => { if (e.target === box) close(); });

  document.addEventListener('keydown', (e) => {
    if (box.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });
})();

/* ─────────── 문의하기 폼 ─────────── */
(function () {
  const form = document.getElementById('leadForm');
  if (!form) return;

  const note = document.getElementById('formNote');
  const submitBtn = document.getElementById('submitBtn');

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE_RE = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;   // 010-1234-5678 / 02-123-4567 등

  function setError(id, message) {
    const input = document.getElementById(id);
    const field = input.closest('.field') || input.closest('.check');
    const slot = form.querySelector(`.err[data-for="${id}"]`);
    if (field) field.classList.toggle('has-err', Boolean(message));
    if (slot) slot.textContent = message || '';
    return !message;
  }

  /* 전화번호 자동 하이픈 */
  const phone = document.getElementById('f-phone');
  phone.addEventListener('input', () => {
    const d = phone.value.replace(/\D/g, '').slice(0, 11);
    const head = d.startsWith('02') ? 2 : 3;   // 서울 지역번호는 두 자리
    let out = d;
    if (d.length > head && d.length <= head + 4) out = `${d.slice(0, head)}-${d.slice(head)}`;
    else if (d.length > head + 4) out = `${d.slice(0, head)}-${d.slice(head, d.length - 4)}-${d.slice(-4)}`;
    phone.value = out;
  });

  function validate() {
    const name = document.getElementById('f-name').value.trim();
    const email = document.getElementById('f-email').value.trim();
    const tel = phone.value.trim();
    const agreed = document.getElementById('f-agree').checked;

    const ok = [
      setError('f-name', name.length >= 2 ? '' : '이름을 2자 이상 입력해 주세요.'),
      setError('f-email', EMAIL_RE.test(email) ? '' : '올바른 이메일 주소를 입력해 주세요.'),
      setError('f-phone', PHONE_RE.test(tel) ? '' : '연락 가능한 전화번호를 입력해 주세요. (예: 010-1234-5678)'),
      setError('f-agree', agreed ? '' : '개인정보 수집·이용에 동의해 주세요.')
    ];
    return ok.every(Boolean);
  }

  function payload() {
    const data = new FormData(form);
    return {
      name: (data.get('name') || '').trim(),
      email: (data.get('email') || '').trim(),
      phone: (data.get('phone') || '').trim(),
      org: (data.get('org') || '').trim(),
      interest: data.get('interest') || '',
      message: (data.get('message') || '').trim()
    };
  }

  function mailtoFallback(p) {
    const body = [
      `이름: ${p.name}`,
      `이메일: ${p.email}`,
      `전화번호: ${p.phone}`,
      `소속·직함: ${p.org || '-'}`,
      `관심 프로그램: ${p.interest}`,
      '',
      '문의 내용',
      p.message || '-',
      '',
      '— JoyCalm 홈페이지 문의'
    ].join('\n');

    const url = `mailto:${CONTACT_EMAIL}`
      + `?subject=${encodeURIComponent(`[조이캄 문의] ${p.name} · ${p.interest}`)}`
      + `&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    note.className = 'form-note';
    note.textContent = '';

    if (!validate()) {
      note.className = 'form-note bad';
      note.textContent = '입력 내용을 다시 확인해 주세요.';
      const firstErr = form.querySelector('.has-err input, .has-err select');
      if (firstErr) firstErr.focus();
      return;
    }

    const p = payload();

    if (!FORM_ENDPOINT) {
      mailtoFallback(p);
      note.className = 'form-note ok';
      note.textContent = '메일 작성 창을 열었습니다. 내용을 확인하시고 전송해 주세요. 창이 열리지 않으면 joycalm.biz@gmail.com 으로 보내주세요.';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '보내는 중…';

    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
      });
      if (!res.ok) throw new Error('전송 실패');

      form.reset();
      note.className = 'form-note ok';
      note.textContent = '문의가 접수되었습니다. 영업일 기준 2일 이내에 회신드리겠습니다.';
    } catch (err) {
      note.className = 'form-note bad';
      note.textContent = '전송에 실패했습니다. joycalm.biz@gmail.com 으로 직접 보내주시면 빠르게 확인하겠습니다.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '문의 보내기';
    }
  });
})();

/* ─────────── 스크롤 등장 효과 ─────────── */
(function () {
  const targets = document.querySelectorAll(
    '.hero-figure, .stats, .tile, .founder-photo, .founder-body, .cred, .prog, .quote, .contact-info, .form-card'
  );
  if (!('IntersectionObserver' in window) || !targets.length) return;

  targets.forEach(t => t.classList.add('reveal'));

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

  targets.forEach(t => io.observe(t));
})();
