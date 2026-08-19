$(document).ready(function () {
  const $flipbook = $('#flipbook');
  let soundEnabled = true;

  // Web Audio API Synthesizer for soft page turn sound effect
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;

  function playPageTurnSound() {
    if (!soundEnabled) return;
    try {
      if (!audioCtx) {
        audioCtx = new AudioContext();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      // Synthesize paper rustle noise
      const bufferSize = audioCtx.sampleRate * 0.25; // 250ms duration
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const whiteNoise = audioCtx.createBufferSource();
      whiteNoise.buffer = buffer;

      // Low pass filter for soft paper rustle
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, audioCtx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.25);

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      whiteNoise.start();
    } catch (e) {
      console.log('Audio playback notice:', e);
    }
  }

  // Initialize Turn.js
  $flipbook.turn({
    width: 920,
    height: 600,
    autoCenter: true,
    elevation: 50,
    gradients: true,
    duration: 800,
    acceleration: true,
    when: {
      turning: function (event, page, pageObject) {
        playPageTurnSound();
      },
      turned: function (event, page, view) {
        updatePageIndicator(page);
      }
    }
  });

  // Page Indicator Update
  function updatePageIndicator(page) {
    const totalPages = $flipbook.turn('pages');
    if (page === 1) {
      $('#page-number').text('Couverture');
    } else if (page === totalPages) {
      $('#page-number').text('Quatrième de couverture');
    } else {
      // In double-page mode, display range or right page number
      const view = $flipbook.turn('view');
      if (view[0] === 0) {
        $('#page-number').text(`Page ${view[1]} sur ${totalPages}`);
      } else if (view[1] === 0) {
        $('#page-number').text(`Page ${view[0]} sur ${totalPages}`);
      } else {
        $('#page-number').text(`Pages ${view[0]}-${view[1]} sur ${totalPages}`);
      }
    }
  }

  // Button Handlers
  $('#prev-btn').on('click', function () {
    $flipbook.turn('previous');
  });

  $('#next-btn').on('click', function () {
    $flipbook.turn('next');
  });

  $('#sound-toggle').on('click', function () {
    soundEnabled = !soundEnabled;
    const $icon = $(this).find('.sound-icon');
    const $text = $(this).find('.sound-text');
    if (soundEnabled) {
      $icon.text('🔊');
      $text.text('Son: Activé');
      playPageTurnSound();
    } else {
      $icon.text('🔇');
      $text.text('Son: Désactivé');
    }
  });

  // Keyboard Navigation
  $(document).on('keydown', function (e) {
    if (e.keyCode === 37) { // Left arrow
      $flipbook.turn('previous');
    } else if (e.keyCode === 39) { // Right arrow
      $flipbook.turn('next');
    }
  });

  // Initial call
  updatePageIndicator(1);
});
