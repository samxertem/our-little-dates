'use strict';
// ✿ "our shared board", inside the ♡ us window ✿
// Start sharing on one phone, type its code on the other, done.
(function sharingUi() {
  const sharing = window.store.sharing;
  if (!sharing) return; // a build without the shared board: the section just stays hidden
  $('#share').hidden = false;

  const LABEL = { syncing: 'syncing…', synced: 'all synced ♡', offline: 'offline · will catch up', error: 'trouble syncing' };
  const msg = (text) => { $('#shareMsg').textContent = text; };
  const defaultNames = () => data.names.a === 'me' && data.names.b === 'her';

  function friendly(err) {
    const m = String(err?.message || err);
    if (/no board with that code/i.test(m)) return "hmm, there's no board with that code. check the letters ♡";
    if (/8 devices/.test(m)) return 'that board already has 8 devices. stop sharing on an old one first';
    if (!navigator.onLine || /fetch|network|timed? ?out/i.test(m)) return 'no internet right now, try again in a bit';
    return `couldn't do that :( ${m}`;
  }

  // People type codes every which way: "mochi 7k3q x9pa", "7K3QX9PA", "MOCHI-7K3Q-X9PA"…
  function tidyCode(raw) {
    let c = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (c.startsWith('MOCHI')) c = c.slice(5);
    return /^[A-Z0-9]{8}$/.test(c) ? `MOCHI-${c.slice(0, 4)}-${c.slice(4)}` : null;
  }

  function show() {
    const on = sharing.paired;
    const s = on ? sharing.status : 'off';
    $('#shareOff').hidden = on;
    $('#shareOn').hidden = !on;
    $('#shareCodeShow').textContent = sharing.code || '';
    $('#sharePill').textContent = LABEL[s] || '';
    $('#sharePill').dataset.state = s;
    $('#namesBtn').dataset.sync = s; // a tiny dot on the ♡ us button
    // on the phone that joined, the second name is the one holding it
    const joined = sharing.me === 'b';
    $('#nameLabelA').textContent = joined ? 'your person ♡' : 'you';
    $('#nameLabelB').textContent = joined ? 'you' : 'her';
  }
  sharing.onStatus(show);
  show();

  // whatever is typed in the name boxes right now counts, even before "save ♡"
  function namesFromForm() {
    const f = $('#namesForm').elements;
    data.names = { a: f.a.value.trim() || 'me', b: f.b.value.trim() || 'her' };
  }

  async function busy(btn, work) {
    if (btn.disabled) return;
    btn.disabled = true;
    msg('');
    try { await work(); } catch (err) { msg(friendly(err)); } finally { btn.disabled = false; show(); }
  }

  $('#shareStart').addEventListener('click', (e) => busy(e.currentTarget, async () => {
    namesFromForm();
    await window.store.save(data);
    await sharing.create();
    render();
    msg(defaultNames()
      ? 'shared! tip: write your real names above, so both phones know whose idea is whose ♡'
      : 'shared! now join from the other phone with that code ♡');
  }));

  async function join() {
    const code = tidyCode($('#shareCode').value);
    if (!code) { msg('codes look like MOCHI-7K3Q-X9PA ♡'); return; }
    await sharing.join(code);
    const f = $('#namesForm').elements; // the board's names arrive with it
    f.a.value = data.names.a;
    f.b.value = data.names.b;
    $('#shareCode').value = '';
    msg("joined!! you're sharing one board now ♡");
    Mochi.cheer("we're connected!!");
  }
  $('#shareJoin').addEventListener('click', (e) => busy(e.currentTarget, join));
  $('#shareCode').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault(); // don't submit the names form
    busy($('#shareJoin'), join);
  });

  $('#shareLeave').addEventListener('click', (e) => {
    const btn = e.currentTarget;
    if (!btn.classList.contains('armed')) { btn.classList.add('armed'); btn.textContent = 'sure? tap again'; return; }
    btn.classList.remove('armed');
    btn.textContent = 'stop sharing on this device';
    busy(btn, async () => {
      await sharing.leave();
      msg('this device stopped sharing. everything is still saved here ♡');
    });
  });

  // opening ♡ us: fresh status, and a quick sync so what you see is current
  $('#namesBtn').addEventListener('click', () => {
    msg('');
    $('#shareLeave').classList.remove('armed');
    $('#shareLeave').textContent = 'stop sharing on this device';
    show();
    if (sharing.paired) sharing.syncNow();
  });
})();
