/* ============================================================
   MAX SOUZA - script.js
   Professional Drummer & Music Portfolio
   ============================================================ */

'use strict';

/* Helpers */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* Navigation scroll effect */
const nav = $('#nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* Mobile hamburger menu */
const hamburger = $('#hamburger');
const navLinks  = $('#nav .nav__links');

hamburger.addEventListener('click', () => {
  const isOpen = hamburger.classList.toggle('open');
  navLinks.classList.toggle('open', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

$$('.nav__links a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
    document.body.style.overflow = '';
  });
});

/* Smooth scroll for anchor links */
$$('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = $(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = 80;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* Hero waveform canvas animation */
(function initHeroWave() {
  const canvas = document.getElementById('waveCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width, height;

  function resize() {
    width  = canvas.width  = canvas.offsetWidth;
    height = canvas.height = canvas.offsetHeight;
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();

  let t = 0;
  function draw() {
    ctx.clearRect(0, 0, width, height);
    const barCount = Math.floor(width / 6);
    const barW = width / barCount;
    for (let i = 0; i < barCount; i++) {
      const x = i * barW;
      const freq1 = Math.sin((i / barCount) * Math.PI * 4 + t) * 0.5 + 0.5;
      const freq2 = Math.sin((i / barCount) * Math.PI * 8 + t * 1.3) * 0.3 + 0.3;
      const freq3 = Math.sin((i / barCount) * Math.PI * 2 + t * 0.7) * 0.2 + 0.2;
      const h = (freq1 + freq2 + freq3) / 3 * height * 0.85 + 4;
      const grad = ctx.createLinearGradient(0, height - h, 0, height);
      grad.addColorStop(0, 'rgba(108,99,255,0.8)');
      grad.addColorStop(1, 'rgba(224,64,251,0.3)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x + 1, height - h, barW - 2, h, [2, 2, 0, 0]);
      ctx.fill();
    }
    t += 0.025;
    requestAnimationFrame(draw);
  }
  draw();
})();

/* Mini waveform bars on music cards */
function drawMiniWave(canvas) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const bars = 20;
  const barW = w / bars;
  ctx.clearRect(0, 0, w, h);
  for (let i = 0; i < bars; i++) {
    const barH = Math.random() * (h * 0.7) + h * 0.15;
    const x = i * barW;
    const grad = ctx.createLinearGradient(0, h - barH, 0, h);
    grad.addColorStop(0, 'rgba(108,99,255,0.7)');
    grad.addColorStop(1, 'rgba(224,64,251,0.3)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x + 1, h - barH, barW - 2, barH, [1, 1, 0, 0]);
    ctx.fill();
  }
}

document.querySelectorAll('.mini-wave').forEach(canvas => drawMiniWave(canvas));

/* ============================================================
   Music Player — com suporte a audio real
   ============================================================ */

const musicas = [
  {
    title: 'Teste de Audio Real',
    genre: 'Demo',
    /* Faixa publica de dominio publico — Internet Archive */
    src: 'https://ia800501.us.archive.org/1/items/testmp3testfile/mpthreetest.mp3'
  },
  { title: 'Chuva de Inverno',                genre: 'Piano Solo',  src: null },
  { title: 'Tarde no Cafe',                   genre: 'Jazz',        src: null },
  { title: 'Horizonte Aberto',                genre: 'Ambient',     src: null },
  { title: 'Preludio em G',                   genre: 'Orquestral',  src: null },
  { title: 'Memoria Viva',                    genre: 'Piano Solo',  src: null },
  { title: 'Noite de Bossa',                  genre: 'Jazz',        src: null },
  { title: 'Carlos Resende — Album Completo', genre: 'Jazz',        src: null },
  { title: 'FUGERE — Album Completo',         genre: 'Rock / Punk', src: null },
];

let currentMusica = -1;
let isPlaying     = false;
let progressTimer = null;
let progressVal   = 0;
let elapsedSecs   = 0;

/* Audio element */
const audioEl = new Audio();
audioEl.volume = 0.8;
audioEl.preload = 'none';

const playerTitle   = document.getElementById('playerTitle');
const playerGenre   = document.getElementById('playerGenre');
const playPauseBtn  = document.getElementById('playPauseBtn');
const prevBtn       = document.getElementById('prevBtn');
const nextBtn       = document.getElementById('nextBtn');
const progressFill  = document.getElementById('progressFill');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl   = document.getElementById('totalTime');

function formatTime(s) {
  if (!isFinite(s) || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  return m + ':' + Math.floor(s % 60).toString().padStart(2, '0');
}

function updatePlayerUI(idx) {
  const m = musicas[idx];
  playerTitle.textContent = m.title;
  playerGenre.textContent = m.genre;
}

/* ---- Progress via real audio ---- */
function stopProgress() {
  clearInterval(progressTimer);
  progressTimer = null;
}

function startProgress() {
  stopProgress();
  progressTimer = setInterval(function () {
    if (!audioEl.src || audioEl.paused) return;
    var dur = audioEl.duration || 0;
    var cur = audioEl.currentTime || 0;
    if (dur > 0) {
      progressFill.style.width = (cur / dur * 100) + '%';
      currentTimeEl.textContent = formatTime(cur);
      totalTimeEl.textContent   = formatTime(dur);
    }
  }, 300);
}

audioEl.addEventListener('ended', function () {
  playNext();
});

audioEl.addEventListener('loadedmetadata', function () {
  totalTimeEl.textContent = formatTime(audioEl.duration);
});

/* ---- Simulated progress for tracks without src ---- */
const DURATION = 30;

function startSimProgress() {
  stopProgress();
  progressTimer = setInterval(function () {
    elapsedSecs += 0.5;
    if (elapsedSecs >= DURATION) { elapsedSecs = 0; playNext(); return; }
    progressFill.style.width = (elapsedSecs / DURATION * 100) + '%';
    currentTimeEl.textContent = formatTime(elapsedSecs);
    totalTimeEl.textContent   = formatTime(DURATION);
  }, 500);
}

function setPlaying(state) {
  isPlaying = state;
  playPauseBtn.textContent = isPlaying ? '\u23F8' : '\u25B6';

  if (isPlaying) {
    var m = musicas[currentMusica];
    if (m && m.src) {
      audioEl.play().catch(function () {});
      startProgress();
    } else {
      startSimProgress();
    }
  } else {
    audioEl.pause();
    stopProgress();
  }
}

function playMusica(idx) {
  /* Reset all cards */
  document.querySelectorAll('.musica-card').forEach(function (c) {
    c.classList.remove('playing');
    var icon = c.querySelector('.play-icon');
    if (icon) icon.textContent = '\u25B6';
  });

  /* Stop current audio */
  audioEl.pause();
  audioEl.src = '';
  stopProgress();

  currentMusica = idx;
  elapsedSecs   = 0;
  progressVal   = 0;
  progressFill.style.width  = '0%';
  currentTimeEl.textContent = '0:00';
  totalTimeEl.textContent   = '0:00';

  updatePlayerUI(idx);

  /* Load real audio if available */
  var m = musicas[idx];
  if (m && m.src) {
    audioEl.src = m.src;
    audioEl.load();
  }

  /* Mark card as playing */
  var el = document.querySelector('[data-musica="' + idx + '"]');
  if (el) {
    var card = el.closest('.musica-card');
    if (card) {
      card.classList.add('playing');
      var icon = card.querySelector('.play-icon');
      if (icon) icon.textContent = '\u23F8';
    }
  }

  setPlaying(true);
}

function playNext() {
  var cards = Array.from(document.querySelectorAll('.musica-card')).filter(function (c) {
    return c.style.display !== 'none';
  });
  if (!cards.length) return;
  var idx = cards.findIndex(function (c) { return c.classList.contains('playing'); });
  var btn = cards[(idx + 1) % cards.length].querySelector('[data-musica]');
  if (btn) playMusica(parseInt(btn.dataset.musica));
}

function playPrev() {
  var cards = Array.from(document.querySelectorAll('.musica-card')).filter(function (c) {
    return c.style.display !== 'none';
  });
  if (!cards.length) return;
  var idx = cards.findIndex(function (c) { return c.classList.contains('playing'); });
  var btn = cards[(idx - 1 + cards.length) % cards.length].querySelector('[data-musica]');
  if (btn) playMusica(parseInt(btn.dataset.musica));
}

document.querySelectorAll('.musica-card__play').forEach(function (btn) {
  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    var musicaIdx = parseInt(btn.dataset.musica);
    if (currentMusica === musicaIdx && isPlaying) {
      setPlaying(false);
      var icon = btn.querySelector('.play-icon');
      if (icon) icon.textContent = '\u25B6';
      var card = btn.closest('.musica-card');
      if (card) card.classList.remove('playing');
    } else {
      playMusica(musicaIdx);
    }
  });
});

playPauseBtn.addEventListener('click', function () {
  if (currentMusica === -1) { playMusica(0); return; }
  if (isPlaying) {
    setPlaying(false);
    var card = document.querySelector('.musica-card.playing');
    if (card) { var icon = card.querySelector('.play-icon'); if (icon) icon.textContent = '\u25B6'; }
  } else {
    setPlaying(true);
    var card = document.querySelector('.musica-card.playing');
    if (card) { var icon = card.querySelector('.play-icon'); if (icon) icon.textContent = '\u23F8'; }
  }
});

nextBtn.addEventListener('click', playNext);
prevBtn.addEventListener('click', playPrev);

document.getElementById('progressBar').addEventListener('click', function (e) {
  var rect = e.currentTarget.getBoundingClientRect();
  var pct  = (e.clientX - rect.left) / rect.width;
  if (musicas[currentMusica] && musicas[currentMusica].src && audioEl.duration) {
    audioEl.currentTime = pct * audioEl.duration;
  } else {
    elapsedSecs = pct * DURATION;
    progressFill.style.width = (pct * 100) + '%';
    currentTimeEl.textContent = formatTime(elapsedSecs);
  }
});

/* Volume slider */
var volumeSlider = document.getElementById('volumeSlider');
volumeSlider.addEventListener('input', function () {
  var vol  = parseFloat(volumeSlider.value);
  audioEl.volume = vol;
  var icon = volumeSlider.previousElementSibling;
  if (!icon) return;
  if (vol === 0)       icon.textContent = '\uD83D\uDD07';
  else if (vol < 0.4)  icon.textContent = '\uD83D\uDD08';
  else if (vol < 0.7)  icon.textContent = '\uD83D\uDD09';
  else                 icon.textContent = '\uD83D\uDD0A';
});

/* Music filter buttons */
document.querySelectorAll('.filter-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.filter-btn').forEach(function (b) {
      b.classList.remove('active');
    });
    btn.classList.add('active');
    var filter = btn.dataset.filter;
    document.querySelectorAll('.musica-card').forEach(function (card) {
      var show = filter === 'all' || card.dataset.genre === filter;
      card.style.display = show ? '' : 'none';
      if (show) {
        card.classList.add('visible');
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }
    });
  });
});

/* Scroll-triggered fade-in animations */
var observer = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

['.sobre__grid', '.musica-card', '.projeto-card', '.servico-card', '.depo-card', '.contato__info', '.contato__form', '.section-header'].forEach(function (sel) {
  document.querySelectorAll(sel).forEach(function (el, i) {
    el.classList.add('fade-in');
    el.style.transitionDelay = (i * 0.08) + 's';
    observer.observe(el);
  });
});

/* Drum pulse canvas — sobre section */
(function initDrumCanvas() {
  var canvas = document.getElementById('drumCanvas');
  if (!canvas) return;
  var ctx    = canvas.getContext('2d');
  var size   = 280;
  canvas.width  = size;
  canvas.height = size;
  var cx = size / 2;
  var cy = size / 2;

  /* Simulated drum hit pattern: kick, snare, hihat */
  var pattern = [1, 0, 0.4, 0, 0.8, 0, 0.4, 0, 1, 0, 0.4, 0, 0.8, 0.6, 0.4, 0];
  var step    = 0;
  var energy  = 0;
  var t       = 0;

  function easeOut(x) { return 1 - Math.pow(1 - x, 3); }

  function draw() {
    ctx.clearRect(0, 0, size, size);

    /* Advance pattern every ~12 frames */
    t++;
    if (t % 12 === 0) {
      step   = (step + 1) % pattern.length;
      energy = pattern[step];
    }
    energy *= 0.88; /* decay */

    var rings   = 6;
    var baseR   = 30;
    var spacing = (cx - baseR - 8) / rings;

    for (var i = rings; i >= 1; i--) {
      var progress = easeOut(energy);
      var r        = baseR + i * spacing + progress * (i * 4);
      var alpha    = (0.08 + progress * 0.25) * (1 - i / (rings + 2));
      var width    = 1 + progress * (rings - i + 1) * 0.4;

      /* Gradient stroke per ring */
      var grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
      grad.addColorStop(0, 'rgba(108,99,255,' + (alpha * 2.5) + ')');
      grad.addColorStop(1, 'rgba(224,64,251,' + (alpha * 2)   + ')');

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = grad;
      ctx.lineWidth   = width;
      ctx.stroke();
    }

    /* Glow dot at center on hit */
    if (energy > 0.3) {
      var glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 36 * energy);
      glow.addColorStop(0, 'rgba(108,99,255,' + (energy * 0.5) + ')');
      glow.addColorStop(1, 'rgba(108,99,255,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, 36 * energy, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }
  draw();
})();

/* Spotify album covers via oEmbed */
document.querySelectorAll('[data-spotify-id]').forEach(function (el) {
  var id  = el.dataset.spotifyId;
  var url = 'https://open.spotify.com/album/' + id;
  fetch('https://open.spotify.com/oembed?url=' + encodeURIComponent(url))
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data && data.thumbnail_url) {
        el.style.backgroundImage = 'url(' + data.thumbnail_url + ')';
      }
    })
    .catch(function () { /* mantém o gradiente de fallback */ });
});

/* Contact form validation */
var contactForm  = document.getElementById('contactForm');
var formFeedback = document.getElementById('formFeedback');

contactForm.addEventListener('submit', function (e) {
  e.preventDefault();
  var nome     = document.getElementById('nome').value.trim();
  var email    = document.getElementById('email').value.trim();
  var mensagem = document.getElementById('mensagem').value.trim();
  formFeedback.className   = 'form-feedback';
  formFeedback.textContent = '';
  if (!nome) {
    showFeedback('error', 'Por favor, informe seu nome.');
    document.getElementById('nome').focus();
    return;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showFeedback('error', 'Por favor, informe um email valido.');
    document.getElementById('email').focus();
    return;
  }
  if (!mensagem) {
    showFeedback('error', 'Por favor, escreva uma mensagem.');
    document.getElementById('mensagem').focus();
    return;
  }
  var submitBtn = contactForm.querySelector('button[type="submit"]');
  submitBtn.textContent = 'Enviando...';
  submitBtn.disabled    = true;
  setTimeout(function () {
    showFeedback('success', 'Mensagem enviada! Responderei em ate 24 horas.');
    contactForm.reset();
    submitBtn.textContent = 'Enviar Mensagem';
    submitBtn.disabled    = false;
  }, 1200);
});

function showFeedback(type, message) {
  formFeedback.className   = 'form-feedback ' + type;
  formFeedback.textContent = message;
  formFeedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
