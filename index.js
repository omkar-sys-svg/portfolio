/* --- Work tabs filter --- */
document.querySelectorAll('.work-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.work-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const filter = tab.dataset.filter;
    document.querySelectorAll('.work-card').forEach(card => {
      const show = card.dataset.cat === filter;
      card.style.display = show ? 'block' : 'none';
      if (!show) {
        const v = card.querySelector('video');
        if (v) { v.pause(); v.currentTime = 0; }
        updatePlayIcon(card, false);
      }
      if (show) card.style.animation = 'fadeSlideUp 0.5s cubic-bezier(0.22,1,0.36,1) both';
    });
  });
});

/* --- Video controls --- */
function fmtTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m + ':' + String(sec).padStart(2, '0');
}
function updatePlayIcon(card, playing) {
  const iconPlay  = card.querySelector('.icon-play');
  const iconPause = card.querySelector('.icon-pause');
  if (!iconPlay) return;
  iconPlay.style.display  = playing ? 'none'  : 'block';
  iconPause.style.display = playing ? 'block' : 'none';
}
function updateMuteIcon(card, muted) {
  const iconMute   = card.querySelector('.icon-mute');
  const iconUnmute = card.querySelector('.icon-unmute');
  if (!iconMute) return;
  iconMute.style.display   = muted ? 'block' : 'none';
  iconUnmute.style.display = muted ? 'none'  : 'block';
}

document.querySelectorAll('.work-card').forEach(card => {
  const video      = card.querySelector('video');
  const playBtn    = card.querySelector('.play-pause');
  const muteBtn    = card.querySelector('.mute-btn');
  const fill       = card.querySelector('.vid-progress-fill');
  const bar        = card.querySelector('.vid-progress-bar');
  const timeLabel  = card.querySelector('.vid-time');
  if (!video) return;

  /* Play / Pause */
  playBtn.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();
    if (video.paused) { video.play(); updatePlayIcon(card, true); }
    else              { video.pause(); updatePlayIcon(card, false); }
  });

  /* Mute / Unmute */
  muteBtn.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();
    video.muted = !video.muted;
    updateMuteIcon(card, video.muted);
  });
  updateMuteIcon(card, true); /* starts muted */

  /* Progress fill + time */
  video.addEventListener('timeupdate', () => {
    if (!video.duration) return;
    const pct = (video.currentTime / video.duration) * 100;
    fill.style.width = pct + '%';
    timeLabel.textContent = fmtTime(video.currentTime);
  });

  /* Seek on bar click */
  bar.addEventListener('click', e => {
    e.stopPropagation();
    const rect = bar.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    video.currentTime = ratio * video.duration;
  });

  /* Auto-play on hover, pause on leave */
  card.addEventListener('mouseenter', () => {
    video.play().then(() => updatePlayIcon(card, true)).catch(() => {});
  });
  card.addEventListener('mouseleave', () => {
    video.pause();
    updatePlayIcon(card, false);
  });
});