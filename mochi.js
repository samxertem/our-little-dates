'use strict';
// ✿ mochi ✿ — the little cat who peeks up from the bottom of the window.
// Click to pet. She watches the shuffle, cheers when a date is picked, and
// dresses for the season (scarf, flower, sun hat, autumn leaf).
const Mochi = (() => {
  const LINE = '#6e5550';
  const FUR = '#fffaf3';
  const PATCH = '#f6c28b';
  const EAR = '#f7c3cb';
  const tri = (pts, fill) => `<path d="M${pts}Z" fill="${fill}" stroke="${LINE}" stroke-width="1.1" stroke-linejoin="round"/>`;
  const HEAD = 'M-19 4C-20-8-12-15 0-15C12-15 20-8 19 4C18 13-18 13-19 4Z';

  // Only our own constant markup goes into innerHTML here — never anything typed by a person.
  const SVG = `
<svg viewBox="0 0 140 112" aria-hidden="true">
  <g class="m-body">
    <g transform="translate(70 70) scale(2.2)">
      <g class="m-ear m-ear-l">${tri('-17-5L-15.5-21.5L-5.5-13.5', FUR)}<path d="M-14.6-9L-14-17.6L-8.6-13.4Z" fill="${EAR}"/></g>
      <g class="m-ear m-ear-r">${tri('17-5L15.5-21.5L5.5-13.5', PATCH)}<path d="M14.6-9L14-17.6L8.6-13.4Z" fill="${EAR}"/></g>
      <path d="${HEAD}" fill="${FUR}"/>
      <path d="M5-14.4C12-14 17.4-9.4 18.8-2.6C13.6-2 8.4-6.6 5-14.4Z" fill="${PATCH}"/>
      <path d="${HEAD}" fill="none" stroke="${LINE}" stroke-width="1.1"/>
      <g class="m-eyes">
        <ellipse cx="-7" cy="-.6" rx="2.1" ry="2.5" fill="${LINE}"/><ellipse cx="7" cy="-.6" rx="2.1" ry="2.5" fill="${LINE}"/>
        <circle cx="-6.2" cy="-1.6" r=".8" fill="#fff"/><circle cx="7.8" cy="-1.6" r=".8" fill="#fff"/>
      </g>
      <g class="m-happy"><path d="M-9.6 .4q2.6-3.4 5.2 0M4.4 .4q2.6-3.4 5.2 0" stroke="${LINE}" stroke-width="1.15" fill="none" stroke-linecap="round"/></g>
      <path d="M-1.4 2.2h2.8l-1.4 1.5z" fill="#f08ca0"/>
      <path d="M-3.2 4.4q1.6 1.8 3.2 0q1.6 1.8 3.2 0" stroke="${LINE}" stroke-width=".9" fill="none" stroke-linecap="round"/>
      <ellipse cx="-12" cy="4.4" rx="2.8" ry="1.6" fill="#f7a8b8" opacity=".85"/><ellipse cx="12" cy="4.4" rx="2.8" ry="1.6" fill="#f7a8b8" opacity=".85"/>
      <path d="M-17.5 2.2l-6-1M-17.5 5.2l-6 1M17.5 2.2l6-1M17.5 5.2l6 1" stroke="${LINE}" stroke-width=".6" stroke-linecap="round" opacity=".7"/>

      <g class="m-acc acc-winter">
        <path d="M-15.5 8.6C-6 13.4 6 13.4 15.5 8.6L16.4 12.6C6 18-6 18-16.4 12.6Z" fill="#e8798c" stroke="${LINE}" stroke-width=".9" stroke-linejoin="round"/>
        <path d="M7 14.2L9.6 22.4L13.6 21L11.6 13Z" fill="#e8798c" stroke="${LINE}" stroke-width=".9" stroke-linejoin="round"/>
        <path d="M-10 12.4l1.6 1.8M-4 13.2l1.4 1.8M2 13.2l1.4 1.8M8 12.4l1.4 1.6" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".8"/>
      </g>
      <g class="m-acc acc-spring" transform="translate(-11.5 -14) scale(.62)">
        ${[0, 72, 144, 216, 288].map((r) => `<path d="M0 0C-3-2-3.6-6-2-8.4L0-7.2L2-8.4C3.6-6 3-2 0 0Z" fill="#ffd3dd" stroke="#f2a1b5" stroke-width=".6" transform="rotate(${r})"/>`).join('')}
        <circle r="1.9" fill="#f58fa8"/>
      </g>
      <g class="m-acc acc-summer">
        <path d="M-8.5-15.5C-8.5-24 8.5-24 8.5-15.5Z" fill="#f3d48f" stroke="${LINE}" stroke-width=".9"/>
        <path d="M-8.4-17.4H8.4" stroke="#f58fa8" stroke-width="2"/>
        <ellipse cx="0" cy="-15.4" rx="16" ry="3.4" fill="#f6dc9f" stroke="${LINE}" stroke-width=".9"/>
      </g>
      <g class="m-acc acc-autumn" transform="translate(-5 -14.5) rotate(-24) scale(.62)">
        <path d="M0 4V11" stroke="#d8634c" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M0-9L2-4L6-6L5-1L9 0L4 3L5 7L0 5L-5 7L-4 3L-9 0L-5-1L-6-6L-2-4Z" fill="#e9894f" stroke="#d8634c" stroke-width="1" stroke-linejoin="round"/>
      </g>
    </g>
    <g class="m-paw"><ellipse cx="38" cy="104" rx="12" ry="8.5" fill="${FUR}" stroke="${LINE}" stroke-width="2.4"/><path d="M34 112v-4.5M42 112v-4.5" stroke="${LINE}" stroke-width="2" stroke-linecap="round"/></g>
    <g class="m-paw"><ellipse cx="102" cy="104" rx="12" ry="8.5" fill="${FUR}" stroke="${LINE}" stroke-width="2.4"/><path d="M98 112v-4.5M106 112v-4.5" stroke="${LINE}" stroke-width="2" stroke-linecap="round"/></g>
  </g>
</svg>`;

  const LINES = {
    any: [
      'mrrp? ♡', 'purrrrr…', 'pet me again', '*slow blink* ♡', 'is it date night yet?',
      'the next date should involve snacks', "i'm not sitting on the keyboard. promise.",
      'you two are my favourite humans', 'take me on a date too?', 'mew.',
    ],
    spring: ['the cherry trees are out ✿', 'picnic weather!!', 'i found a petal on my nose'],
    summer: ['too hot. ice cream date?', 'beach date? i will guard the towel', 'sunset walk later?'],
    autumn: ['crunchy leaf season ❦', 'cosy café date?', 'pumpkin everything'],
    winter: ['brr. cuddle date?', 'hot chocolate date ❄', 'blanket fort. now.'],
  };
  const PICKED = ['ooh good one!', 'yesss this one', 'i approve ♡', 'can i come too?', 'perfect choice'];

  const el = document.createElement('div');
  el.className = 'mochi';
  el.tabIndex = 0;
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', 'pet mochi the cat');
  el.innerHTML = SVG;
  const bubble = document.createElement('div');
  bubble.className = 'mochi-say';
  bubble.setAttribute('aria-live', 'polite');
  el.append(bubble);
  document.body.append(el);

  let pets = 0;
  let season = 'off';
  let lastLine = '';
  let sayTimer;
  const timers = {};
  const any = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function flash(cls, ms) {
    el.classList.remove(cls);
    void el.offsetWidth; // restart the animation if it is already running
    el.classList.add(cls);
    clearTimeout(timers[cls]);
    timers[cls] = setTimeout(() => el.classList.remove(cls), ms);
  }

  function say(text, ms = 2800) {
    bubble.textContent = text;
    bubble.classList.remove('show');
    void bubble.offsetWidth;
    bubble.classList.add('show');
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => bubble.classList.remove('show'), ms);
  }

  function hearts(n) {
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      s.className = 'mochi-heart';
      s.textContent = '♡';
      s.style.setProperty('--dx', `${Math.random() * 60 - 30}px`);
      s.style.animationDelay = `${i * 110}ms`;
      el.append(s);
      setTimeout(() => s.remove(), 1500 + i * 110);
    }
  }

  function pet() {
    pets += 1;
    Mochi.onPet?.(pets);
    flash('happy', 1500);
    flash('purr', 900);
    hearts(3);
    if (pets % 25 === 0) { say(`that's pet #${pets}. i love you both ♡`); return; }
    const names = typeof data !== 'undefined' ? [`${data.names.a} + ${data.names.b} = ♡`] : [];
    const pool = [...LINES.any, ...(LINES[season] || []), ...names].filter((l) => l !== lastLine);
    lastLine = any(pool);
    say(lastLine);
  }

  el.addEventListener('click', pet);
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pet(); } });

  // little ear twitch every now and then, so she feels alive
  (function idle() {
    setTimeout(() => { flash('twitch', 600); idle(); }, 9000 + Math.random() * 16000);
  })();

  return {
    onPet: null,
    setPets(n) { pets = n; },
    setSeason(s) { season = s; el.dataset.season = s; },
    say,
    watch() { el.classList.add('front', 'watch'); },
    calm() { el.classList.remove('front', 'watch'); },
    cheer(text) {
      el.classList.remove('watch');
      flash('yay', 1700);
      flash('happy', 1900);
      hearts(5);
      say(text || any(PICKED));
    },
  };
})();
