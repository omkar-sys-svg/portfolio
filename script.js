/* ===================== CURSOR ===================== */
const cursor = document.getElementById('cursor');
const ring = document.getElementById('cursorRing');
const canUseCustomCursor = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

if (cursor && ring && canUseCustomCursor) {
  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
  });

  function animateCursor() {
    cursor.style.left = mx + 'px';
    cursor.style.top = my + 'px';
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // Magnetic button effect + cursor expansion
  const magneticBtns = document.querySelectorAll('.magnetic-btn, .software-orb');
  magneticBtns.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
      cursor.classList.add('expand');
      ring.classList.add('expand');
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0px, 0px)';
      cursor.classList.remove('expand');
      ring.classList.remove('expand');
    });
  });
} else {
  document.documentElement.classList.add('native-cursor');
}

function safePlay(video) {
  if (!video || typeof video.play !== 'function') return;
  const result = video.play();
  if (result && typeof result.catch === 'function') {
    result.catch(() => { });
  }
}

/* ===================== NAVBAR & PARALLAX ===================== */
const navbar = document.getElementById('navbar');
const scrollProgress = document.getElementById('scrollProgress');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
const navAnchors = document.querySelectorAll('.nav-links a[href^="#"], .footer-links a[href^="#"]');

function updateScrollUi() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

  if (navbar) navbar.classList.toggle('scrolled', scrollTop > 50);
  document.body.classList.toggle('has-scrolled', scrollTop > 180);
  if (scrollProgress) scrollProgress.style.width = `${Math.min(100, Math.max(0, progress))}%`;
}

window.addEventListener('scroll', updateScrollUi, { passive: true });
window.addEventListener('resize', updateScrollUi);
updateScrollUi();

function closeMobileNav() {
  if (!navbar || !navToggle) return;
  navbar.classList.remove('nav-open');
  document.body.classList.remove('nav-lock');
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.setAttribute('aria-label', 'Open menu');
}

if (navToggle && navbar) {
  navToggle.addEventListener('click', () => {
    const isOpen = navbar.classList.toggle('nav-open');
    document.body.classList.toggle('nav-lock', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  });
}

if (navLinks) {
  navLinks.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', closeMobileNav);
  });
}

window.addEventListener('resize', () => {
  if (window.innerWidth > 768) closeMobileNav();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMobileNav();
});

const pageSections = document.querySelectorAll('section[id]');
if ('IntersectionObserver' in window && pageSections.length && navAnchors.length) {
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const activeId = `#${entry.target.id}`;
      navAnchors.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === activeId);
      });
    });
  }, { rootMargin: '-42% 0px -48% 0px', threshold: 0.01 });

  pageSections.forEach(section => sectionObserver.observe(section));
}

/* ===================== HERO EDIT BAY MOTION ===================== */
(function initHeroEditBay() {
  const hero = document.getElementById('hero');
  const stage = document.getElementById('heroMediaStage');
  const canvas = document.getElementById('heroFxCanvas');
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!hero) return;

  if (stage) {
    stage.querySelectorAll('video').forEach((video, index) => {
      video.muted = true;
      video.playsInline = true;
      video.playbackRate = index % 2 === 0 ? 0.86 : 1.08;
      safePlay(video);
    });

    hero.addEventListener('mousemove', (event) => {
      if (reduceMotion) return;
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      stage.style.setProperty('--tilt-y', `${x * 5}deg`);
      stage.style.setProperty('--tilt-x', `${y * -4}deg`);
    });

    hero.addEventListener('mouseleave', () => {
      stage.style.setProperty('--tilt-y', '0deg');
      stage.style.setProperty('--tilt-x', '0deg');
    });
  }

  if (!canvas || reduceMotion) return;

  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let sparks = [];
  let streaks = [];
  let rafId = null;
  const pointer = { x: 0, y: 0, active: false };

  function resizeHeroCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    sparks = Array.from({ length: Math.max(18, Math.floor(width / 46)) }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.9 + 0.5,
      vx: Math.random() * 0.6 - 0.3,
      vy: Math.random() * -0.7 - 0.15,
      alpha: Math.random() * 0.55 + 0.18
    }));

    streaks = Array.from({ length: 4 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      len: Math.random() * 180 + 80,
      speed: Math.random() * 2.2 + 1.2,
      alpha: Math.random() * 0.28 + 0.12
    }));
  }

  function drawHeroFx() {
    ctx.clearRect(0, 0, width, height);

    streaks.forEach((streak) => {
      const gradient = ctx.createLinearGradient(streak.x, streak.y, streak.x + streak.len, streak.y - streak.len * 0.28);
      gradient.addColorStop(0, `rgba(255, 61, 96, 0)`);
      gradient.addColorStop(0.45, `rgba(255, 209, 102, ${streak.alpha})`);
      gradient.addColorStop(1, `rgba(0, 229, 204, 0)`);

      ctx.beginPath();
      ctx.moveTo(streak.x, streak.y);
      ctx.lineTo(streak.x + streak.len, streak.y - streak.len * 0.28);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.stroke();

      streak.x += streak.speed;
      streak.y -= streak.speed * 0.28;
      if (streak.x > width + 160 || streak.y < -80) {
        streak.x = -220;
        streak.y = Math.random() * height;
      }
    });

    sparks.forEach((spark) => {
      const dx = pointer.x - spark.x;
      const dy = pointer.y - spark.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (pointer.active && distance < 150) {
        spark.x -= dx * 0.008;
        spark.y -= dy * 0.008;
      }

      ctx.beginPath();
      ctx.arc(spark.x, spark.y, spark.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 229, 204, ${spark.alpha})`;
      ctx.shadowColor = 'rgba(0, 229, 204, 0.9)';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      spark.x += spark.vx;
      spark.y += spark.vy;

      if (spark.y < -10) {
        spark.y = height + 10;
        spark.x = Math.random() * width;
      }
      if (spark.x < -10) spark.x = width + 10;
      if (spark.x > width + 10) spark.x = -10;
    });

    if (pointer.active) {
      const pulse = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 180);
      pulse.addColorStop(0, 'rgba(255, 209, 102, 0.2)');
      pulse.addColorStop(0.34, 'rgba(255, 61, 96, 0.08)');
      pulse.addColorStop(1, 'rgba(0, 229, 204, 0)');
      ctx.fillStyle = pulse;
      ctx.fillRect(pointer.x - 180, pointer.y - 180, 360, 360);
    }

    rafId = requestAnimationFrame(drawHeroFx);
  }

  hero.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
  });

  hero.addEventListener('mouseleave', () => {
    pointer.active = false;
  });

  window.addEventListener('resize', resizeHeroCanvas);
  resizeHeroCanvas();
  drawHeroFx();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
      rafId = null;
    } else if (!rafId) {
      drawHeroFx();
    }
  });
})();

/* ===================== REVEAL ANIMATIONS ===================== */
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => observer.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('visible'));
}

/* ===================== CINEMATIC SHOWCASE GALLERY ===================== */
const portfolioData = [
  { id: 'r1', title: 'Urban Stories', desc: 'Street-style cinematic cut', src: './vid/reels/reel1.mp4', category: 'reels', aspect: 'portrait' },
  { id: 'r2', title: 'Brand Vibes', desc: 'Fashion brand highlight video', src: './vid/reels/reel2.mp4', category: 'reels', aspect: 'portrait' },
  { id: 'r3', title: 'Dynamic Cut', desc: 'Music-sync kinetic reel', src: './vid/reels/reel3.mp4', category: 'reels', aspect: 'portrait' },
  { id: 'r4', title: 'Aesthetic Flow', desc: 'Moody styling and color-rich cuts', src: './vid/reels/reel4.mp4', category: 'reels', aspect: 'portrait' },
  { id: 'r5', title: 'Action Edit', desc: 'Fast pacing and rhythmic sound design', src: './vid/reels/reel5.mp4', category: 'reels', aspect: 'portrait' },
  { id: 'r6', title: 'Night Life', desc: 'Neon lighting cinematic compilation', src: './vid/reels/reel6.mp4', category: 'reels', aspect: 'portrait' },
  { id: 't1', title: 'Product Launch', desc: '30-second commercial TVC spot', src: './vid/tvc/tvc1.mp4', category: 'tvc', aspect: 'landscape' },
  { id: 'p1', title: 'Tech Talk Snippet', desc: 'Engaging vertical podcast clip with kinetic captions', src: './vid/podcast/pod1.mp4', category: 'podcast', aspect: 'portrait' },
  { id: 'p2', title: 'Creative Minds', desc: 'Insightful storytelling highlight cut', src: './vid/podcast/pod2.mp4', category: 'podcast', aspect: 'portrait' },
  { id: 'p3', title: 'Business Growth', desc: 'Financial discussion snippet with custom animations', src: './vid/podcast/pod3.mp4', category: 'podcast', aspect: 'portrait' }
];

const workGrid = document.getElementById('workGrid');
const filterBtns = document.querySelectorAll('.filter-btn');
let workScrollRaf = null;
let workCardObserver = null;

// Lightbox Elements
const lightbox = document.getElementById('videoLightbox');
const lightboxBg = document.getElementById('lightboxBg');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxVideo = document.getElementById('lightboxVideo');
const lightboxAmbient = document.getElementById('lightboxAmbient');
const lightboxPlayBtn = document.getElementById('lightboxPlayBtn');
const lightboxMuteBtn = document.getElementById('lightboxMuteBtn');
const lightboxVolume = document.getElementById('lightboxVolume');
const lightboxFsBtn = document.getElementById('lightboxFsBtn');
const lightboxProgressWrap = document.getElementById('lightboxProgressWrap');
const lightboxProgressFill = document.getElementById('lightboxProgressFill');
const lightboxTime = document.getElementById('lightboxTime');
const lightboxTitle = document.getElementById('lightboxTitle');
const lightboxDesc = document.getElementById('lightboxDesc');

let activeAmbientVideo = null;
let lastFocusedElement = null;

// Initialize gallery
function renderGallery(filter = 'all') {
  if (!workGrid) return;
  workGrid.innerHTML = '';

  const filteredData = filter === 'all'
    ? portfolioData
    : portfolioData.filter(item => item.category === filter);

  filteredData.forEach((item, index) => {
    const card = document.createElement('div');
    const count = String(index + 1).padStart(2, '0');
    const categoryLabel = item.category === 'tvc' ? 'TVC' : item.category;
    const formatLabel = item.aspect === 'landscape' ? '16:9 Commercial' : '9:16 Social Cut';
    card.className = `work-card work-project-card card-${item.aspect}`;
    card.setAttribute('data-id', item.id);
    card.setAttribute('data-index', count);
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Open ${item.title}`);
    card.style.setProperty('--card-order', index + 1);

    card.innerHTML = `
      <div class="work-card-number">${count}</div>
      <div class="work-card-media">
        <div class="work-card-fallback">
          <span>${categoryLabel}</span>
          <strong>${item.title}</strong>
        </div>
        <video data-src="${item.src}" loop muted playsinline preload="none"></video>
        <div class="work-card-hover-indicator">
          <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="8,5 19,12 8,19"/></svg>
        </div>
        <div class="work-card-progress">
          <div class="work-card-progress-fill"></div>
        </div>
      </div>
      <div class="work-card-content">
        <div class="work-card-copy">
          <span class="work-card-tag">${categoryLabel}</span>
          <h4 class="work-card-title">${item.title}</h4>
          <p class="work-card-desc">${item.desc}</p>
        </div>
        <div class="work-card-craft">
          <span>${formatLabel}</span>
          <span>Open edit</span>
        </div>
      </div>
    `;

    workGrid.appendChild(card);
    setupCardInteractions(card, item);
  });

  initWorkScrollCards(filteredData);
}

function loadCardVideo(video) {
  if (!video || video.dataset.loaded === 'true') return;
  const src = video.dataset.src;
  if (!src) return;

  video.src = src;
  video.dataset.loaded = 'true';
  video.load();
}

// Hover play & lightbox trigger
function setupCardInteractions(card, item) {
  const video = card.querySelector('video');
  const progressFill = card.querySelector('.work-card-progress-fill');
  const media = card.querySelector('.work-card-media');

  video.addEventListener('loadeddata', () => {
    if (media) media.classList.add('is-video-ready');
  });

  card.addEventListener('mouseenter', () => {
    loadCardVideo(video);
    safePlay(video);
  });

  card.addEventListener('mouseleave', () => {
    if (!card.classList.contains('is-active')) {
      video.pause();
      video.currentTime = 0;
      progressFill.style.width = '0%';
    }
  });

  video.addEventListener('timeupdate', () => {
    if (video.duration) {
      const pct = (video.currentTime / video.duration) * 100;
      progressFill.style.width = `${pct}%`;
    }
  });

  card.addEventListener('click', () => {
    openLightbox(item);
  });

  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openLightbox(item);
    }
  });
}

function setActiveWorkCard(card) {
  if (!card || !workGrid) return;

  workGrid.querySelectorAll('.work-card').forEach(item => {
    const isActive = item === card;
    const video = item.querySelector('video');
    item.classList.toggle('is-active', isActive);

    if (!video) return;
    if (isActive) {
      loadCardVideo(video);
      safePlay(video);
    } else if (!item.matches(':hover')) {
      video.pause();
    }
  });
}

function updateWorkScrollMotion() {
  if (!workGrid) return;
  if (window.innerWidth <= 760) {
    const cards = Array.from(workGrid.querySelectorAll('.work-project-card'));
    cards.forEach(card => {
      card.classList.add('in-view');
      card.classList.remove('is-active');
      card.style.removeProperty('--card-y');
      card.style.removeProperty('--card-scale');
      card.style.removeProperty('--card-opacity');
      card.style.removeProperty('--scroll-tilt');
    });
    return;
  }

  const cards = Array.from(workGrid.querySelectorAll('.work-project-card'));
  if (!cards.length) return;

  const vh = window.innerHeight || 1;
  const focusLine = vh * 0.54;
  let activeCard = cards[0];
  let activeScore = -1;

  cards.forEach((card, index) => {
    const rect = card.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const distance = Math.abs(center - focusLine);
    const focus = Math.max(0, 1 - distance / (vh * 0.72));
    const drift = (index % 2 === 0 ? -1 : 1) * (1 - focus) * 26;
    const tilt = (1 - focus) * 2;
    const cardY = 30 - focus * 30;
    const cardScale = 0.965 + focus * 0.035;
    const cardOpacity = 0.54 + focus * 0.46;
    const mediaScale = 1.04 - focus * 0.025;
    const mediaBrightness = 0.72 + focus * 0.2;
    const mediaSaturation = 0.95 + focus * 0.2;
    const frameOpacity = 0.28 + focus * 0.42;

    card.style.setProperty('--scroll-focus', focus.toFixed(3));
    card.style.setProperty('--scroll-drift', `${drift.toFixed(2)}px`);
    card.style.setProperty('--scroll-tilt', `${tilt.toFixed(2)}deg`);
    card.style.setProperty('--card-y', `${cardY.toFixed(2)}px`);
    card.style.setProperty('--card-scale', cardScale.toFixed(3));
    card.style.setProperty('--card-opacity', cardOpacity.toFixed(3));
    card.style.setProperty('--media-scale', mediaScale.toFixed(3));
    card.style.setProperty('--media-brightness', mediaBrightness.toFixed(3));
    card.style.setProperty('--media-saturation', mediaSaturation.toFixed(3));
    card.style.setProperty('--frame-opacity', frameOpacity.toFixed(3));

    if (focus > activeScore) {
      activeScore = focus;
      activeCard = card;
    }
  });

  setActiveWorkCard(activeCard);

}

function requestWorkScrollUpdate() {
  if (workScrollRaf) return;
  workScrollRaf = requestAnimationFrame(() => {
    workScrollRaf = null;
    updateWorkScrollMotion();
  });
}

function initWorkScrollCards(items = []) {
  if (!workGrid) return;

  const cards = Array.from(workGrid.querySelectorAll('.work-project-card'));

  if (workCardObserver) {
    workCardObserver.disconnect();
  }

  if (!('IntersectionObserver' in window)) {
    cards.forEach(card => {
      card.classList.add('in-view');
      loadCardVideo(card.querySelector('video'));
    });
    updateWorkScrollMotion();
    return;
  }

  workCardObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      entry.target.classList.toggle('in-view', entry.isIntersecting);
      if (entry.isIntersecting) {
        loadCardVideo(entry.target.querySelector('video'));
      }
    });
  }, { threshold: 0.18, rootMargin: '-5% 0px -10%' });

  cards.forEach(card => workCardObserver.observe(card));
  updateWorkScrollMotion();
}

window.addEventListener('scroll', requestWorkScrollUpdate, { passive: true });
window.addEventListener('resize', requestWorkScrollUpdate);

// Filter click handler
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    renderGallery(btn.dataset.filter);
  });
});

// Format time utility
function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Lightbox Controllers
function openLightbox(item) {
  if (!lightbox) return;
  lastFocusedElement = document.activeElement;
  if (workGrid) {
    workGrid.querySelectorAll('video').forEach(video => video.pause());
  }

  // Set project details
  lightboxTitle.innerText = item.title;
  lightboxDesc.innerText = item.desc;

  // Set video source
  lightboxVideo.src = item.src;

  // Ambient video glow setup
  if (activeAmbientVideo) {
    activeAmbientVideo.remove();
  }
  activeAmbientVideo = document.createElement('video');
  activeAmbientVideo.className = 'lightbox-ambient-video';
  activeAmbientVideo.src = item.src;
  activeAmbientVideo.muted = true;
  activeAmbientVideo.loop = true;
  activeAmbientVideo.playsInline = true;
  lightboxAmbient.after(activeAmbientVideo);

  // Show lightbox
  lightbox.classList.add('active');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.classList.add('lightbox-open');

  // Audio state
  lightboxVideo.muted = false;
  lightboxVideo.volume = lightboxVolume ? lightboxVolume.value : 1;
  updateMuteUI();

  // Start videos
  safePlay(lightboxVideo);
  safePlay(activeAmbientVideo);
  updatePlayUI(true);
  if (lightboxClose) lightboxClose.focus();
}

function closeLightbox() {
  if (!lightbox) return;

  lightbox.classList.remove('active');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('lightbox-open');

  lightboxVideo.pause();
  lightboxVideo.src = '';
  if (lightboxProgressFill) lightboxProgressFill.style.width = '0%';
  if (lightboxTime) lightboxTime.innerText = '0:00 / 0:00';
  if (activeAmbientVideo) {
    activeAmbientVideo.pause();
    activeAmbientVideo.remove();
    activeAmbientVideo = null;
  }

  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
    lastFocusedElement.focus();
  }
}

function togglePlay() {
  if (lightboxVideo.paused) {
    safePlay(lightboxVideo);
    if (activeAmbientVideo) safePlay(activeAmbientVideo);
    updatePlayUI(true);
  } else {
    lightboxVideo.pause();
    if (activeAmbientVideo) activeAmbientVideo.pause();
    updatePlayUI(false);
  }
}

function updatePlayUI(isPlaying) {
  const iconPlay = lightboxPlayBtn.querySelector('.icon-play');
  const iconPause = lightboxPlayBtn.querySelector('.icon-pause');
  const playerWrapper = document.querySelector('.lightbox-player-wrapper');

  if (isPlaying) {
    iconPlay.style.display = 'none';
    iconPause.style.display = 'block';
    if (playerWrapper) playerWrapper.classList.remove('paused');
  } else {
    iconPlay.style.display = 'block';
    iconPause.style.display = 'none';
    if (playerWrapper) playerWrapper.classList.add('paused');
  }
}

function toggleMute() {
  lightboxVideo.muted = !lightboxVideo.muted;
  updateMuteUI();
}

function updateMuteUI() {
  const iconUnmute = lightboxMuteBtn.querySelector('.icon-unmute');
  const iconMute = lightboxMuteBtn.querySelector('.icon-mute');

  if (lightboxVideo.muted) {
    iconUnmute.style.display = 'none';
    iconMute.style.display = 'block';
    if (lightboxVolume) lightboxVolume.value = 0;
  } else {
    iconUnmute.style.display = 'block';
    iconMute.style.display = 'none';
    if (lightboxVolume) lightboxVolume.value = lightboxVideo.volume || 1;
  }
}

// Lightbox Listeners
if (lightboxPlayBtn) lightboxPlayBtn.addEventListener('click', togglePlay);
if (lightboxMuteBtn) lightboxMuteBtn.addEventListener('click', toggleMute);
if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
if (lightboxBg) lightboxBg.addEventListener('click', closeLightbox);

if (lightboxVolume) {
  lightboxVolume.addEventListener('input', (e) => {
    const val = e.target.value;
    lightboxVideo.volume = val;
    lightboxVideo.muted = val == 0;
    updateMuteUI();
  });
}

if (lightboxVideo) {
  lightboxVideo.addEventListener('timeupdate', () => {
    if (lightboxVideo.duration) {
      const pct = (lightboxVideo.currentTime / lightboxVideo.duration) * 100;
      if (lightboxProgressFill) lightboxProgressFill.style.width = `${pct}%`;
      if (lightboxTime) {
        lightboxTime.innerText = `${formatTime(lightboxVideo.currentTime)} / ${formatTime(lightboxVideo.duration)}`;
      }

      // Sync ambient video occasionally if drift occurs
      if (activeAmbientVideo && Math.abs(activeAmbientVideo.currentTime - lightboxVideo.currentTime) > 0.3) {
        activeAmbientVideo.currentTime = lightboxVideo.currentTime;
      }
    }
  });

  lightboxVideo.addEventListener('ended', () => {
    updatePlayUI(false);
  });
}

if (lightboxProgressWrap) {
  lightboxProgressWrap.addEventListener('click', (e) => {
    const rect = lightboxProgressWrap.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const time = pct * lightboxVideo.duration;

    lightboxVideo.currentTime = time;
    if (activeAmbientVideo) activeAmbientVideo.currentTime = time;
  });
}

if (lightboxFsBtn) {
  lightboxFsBtn.addEventListener('click', () => {
    const playerWrapper = document.querySelector('.lightbox-player-wrapper');
    if (!document.fullscreenElement) {
      playerWrapper.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen().catch(() => { });
    }
  });
}

// Escape key to close lightbox
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLightbox();
});

// Render initial grid
renderGallery();

/* ===================== TESTIMONIALS AUTO-SCROLL ===================== */
const testiSlider = document.getElementById('testiSlider');
if (testiSlider) {
  // Clone all cards for infinite loop
  const cards = testiSlider.innerHTML;
  testiSlider.innerHTML += cards;
}

/* ===================== WORK SECTION — ANIMATED PARTICLE CANVAS ===================== */
(function initWorkCanvas() {
  const canvas = document.getElementById('workBgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const section = canvas.closest('.work-showcase');
  let particles = [];
  let w, h;
  let animId;

  function resize() {
    const rect = section.getBoundingClientRect();
    w = canvas.width = rect.width;
    h = canvas.height = rect.height;
  }

  function createParticles() {
    particles = [];
    const count = Math.floor((w * h) / 18000);
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.8 + 0.4,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -(Math.random() * 0.25 + 0.08),
        alpha: Math.random() * 0.5 + 0.15
      });
    }
  }

  function drawParticles() {
    ctx.clearRect(0, 0, w, h);

    // Draw particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 229, 204, ${p.alpha})`;
      ctx.fill();

      p.x += p.vx;
      p.y += p.vy;

      // Wrap around
      if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
      if (p.x < -5) p.x = w + 5;
      if (p.x > w + 5) p.x = -5;
    }

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = dx * dx + dy * dy;
        if (dist < 12000) {
          const alpha = (1 - dist / 12000) * 0.12;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0, 229, 204, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    animId = requestAnimationFrame(drawParticles);
  }

  if (!('IntersectionObserver' in window)) {
    resize();
    createParticles();
    drawParticles();
    window.addEventListener('resize', () => {
      resize();
      createParticles();
    });
    return;
  }

  // Use IntersectionObserver to only animate when visible
  const canvasObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        resize();
        if (particles.length === 0) createParticles();
        drawParticles();
      } else {
        cancelAnimationFrame(animId);
      }
    });
  }, { threshold: 0.05 });

  window.addEventListener('resize', () => {
    resize();
    createParticles();
  });

  canvasObserver.observe(section);
})();

/* ===================== 3D TILT EFFECT ON WORK CARDS ===================== */
(function initTiltCards() {
  const grid = document.getElementById('workGrid');
  if (!grid) return;

  // Track tilt state per card
  const tiltState = new WeakMap();

  function lerp(a, b, t) { return a + (b - a) * t; }

  function handleMouseMove(e) {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateY = ((x - centerX) / centerX) * 8;
    const rotateX = ((centerY - y) / centerY) * 6;

    let state = tiltState.get(card);
    if (!state) {
      state = { currentX: 0, currentY: 0, targetX: 0, targetY: 0, rafId: null };
      tiltState.set(card, state);
    }
    state.targetX = rotateX;
    state.targetY = rotateY;

    if (!state.rafId) {
      animateTilt(card, state);
    }
  }

  function animateTilt(card, state) {
    state.currentX = lerp(state.currentX, state.targetX, 0.1);
    state.currentY = lerp(state.currentY, state.targetY, 0.1);

    card.style.transform = `perspective(800px) rotateX(${state.currentX}deg) rotateY(${state.currentY}deg) scale3d(1.02, 1.02, 1.02)`;

    if (Math.abs(state.currentX - state.targetX) > 0.01 || Math.abs(state.currentY - state.targetY) > 0.01) {
      state.rafId = requestAnimationFrame(() => animateTilt(card, state));
    } else {
      state.rafId = null;
    }
  }

  function handleMouseLeave(e) {
    const card = e.currentTarget;
    const state = tiltState.get(card);
    if (state) {
      state.targetX = 0;
      state.targetY = 0;
      if (!state.rafId) {
        animateReset(card, state);
      }
    }
  }

  function animateReset(card, state) {
    state.currentX = lerp(state.currentX, 0, 0.08);
    state.currentY = lerp(state.currentY, 0, 0.08);

    card.style.transform = `perspective(800px) rotateX(${state.currentX}deg) rotateY(${state.currentY}deg) scale3d(1, 1, 1)`;

    if (Math.abs(state.currentX) > 0.01 || Math.abs(state.currentY) > 0.01) {
      state.rafId = requestAnimationFrame(() => animateReset(card, state));
    } else {
      card.style.transform = '';
      state.rafId = null;
    }
  }

  function attachTiltListeners() {
    const cards = grid.querySelectorAll('.work-card:not(.work-project-card)');
    cards.forEach(card => {
      card.addEventListener('mousemove', handleMouseMove);
      card.addEventListener('mouseleave', handleMouseLeave);
    });
  }

  // Patch renderGallery to add tilt after render
  const _origRenderGallery = renderGallery;
  window.renderGallery = function (filter) {
    _origRenderGallery(filter);
    attachTiltListeners();
  };

  // Attach to initially rendered cards
  attachTiltListeners();
})();

/* ===================== EDITOR SKILL STACK ===================== */
(function initEditorSkillStack() {
  const layers = document.querySelectorAll('.skills-layer[data-skill-panel]');
  const steps = document.querySelectorAll('.skills-path-step[data-skill-panel]');
  const title = document.getElementById('skillFocusTitle');
  const text = document.getElementById('skillFocusText');
  const list = document.getElementById('skillFocusList');
  if (!layers.length || !steps.length || !title || !text || !list) return;

  const details = {
    story: {
      title: 'Hook & Story',
      text: 'A strong opening and clean sequence.',
      points: ['Opening hook', 'Clean flow', 'Tighter cut']
    },
    motion: {
      title: 'Fast Editing',
      text: 'Clean cuts, timing, captions, and versions.',
      points: ['Beat timing', 'Captions', 'Review cuts']
    },
    vfx: {
      title: 'Motion Polish',
      text: 'Titles, transitions, overlays, and light VFX.',
      points: ['Titles', 'Transitions', 'AI assist']
    },
    finish: {
      title: 'Final Delivery',
      text: 'Color, sound, captions, and export formats.',
      points: ['4K files', 'Social formats', 'Ready to upload']
    }
  };

  function activateSkill(skillName) {
    const detail = details[skillName];
    if (!detail) return;

    layers.forEach(layer => {
      layer.classList.toggle('is-active', layer.dataset.skillPanel === skillName);
    });

    steps.forEach(step => {
      step.classList.toggle('is-active', step.dataset.skillPanel === skillName);
    });

    title.textContent = detail.title;
    text.textContent = detail.text;
    list.innerHTML = detail.points.map(point => `<span>${point}</span>`).join('');
  }

  layers.forEach(layer => {
    layer.tabIndex = 0;
    layer.addEventListener('mouseenter', () => activateSkill(layer.dataset.skillPanel));
    layer.addEventListener('focusin', () => activateSkill(layer.dataset.skillPanel));
    layer.addEventListener('click', () => activateSkill(layer.dataset.skillPanel));
  });

  steps.forEach(step => {
    step.addEventListener('mouseenter', () => activateSkill(step.dataset.skillPanel));
    step.addEventListener('focusin', () => activateSkill(step.dataset.skillPanel));
    step.addEventListener('click', () => activateSkill(step.dataset.skillPanel));
  });

  activateSkill('story');
})();
