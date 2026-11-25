// Ember Skillet — audio.js
// All sound is synthesised with WebAudio oscillator beeps: no audio files,
// no network. Everything is guarded so a missing audio device never breaks
// the game (headless browsers included).

export function createSoundBank() {
  const bank = {
    ctx: null,
    muted: false,

    ensure() {
      if (this.ctx || this.muted) return;
      try {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) return;
        this.ctx = new Ctor();
      } catch (err) {
        this.ctx = null;
      }
    },

    resume() {
      this.ensure();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    },

    // One short tone: frequency in Hz, seconds long, sine/square/sawtooth.
    beep(freq, dur, type, vol, delay) {
      if (this.muted) return;
      this.ensure();
      if (!this.ctx) return;
      try {
        const t0 = this.ctx.currentTime + (delay || 0);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, t0);
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t0);
        osc.stop(t0 + dur + 0.02);
      } catch (err) {
        // Audio is decoration; a failure must never stop the game.
      }
    },

    click() {
      this.beep(620, 0.06, 'square', 0.05);
    },

    add(ingredientId) {
      // A plip whose pitch depends on the ingredient, so stacking has a tune.
      const pitch = {
        'bun-bottom': 300,
        patty: 190,
        lettuce: 520,
        tomato: 440,
        cheese: 380,
        'bun-top': 560,
      }[ingredientId] || 400;
      this.beep(pitch, 0.09, 'triangle', 0.14);
      this.beep(pitch * 1.5, 0.07, 'sine', 0.08, 0.03);
    },

    sizzle() {
      // A short burst of filtered noise, faked with fast detuned triangles.
      if (this.muted) return;
      this.ensure();
      if (!this.ctx) return;
      try {
        for (let i = 0; i < 6; i++) {
          this.beep(1400 + Math.random() * 1800, 0.05, 'triangle', 0.03, i * 0.03);
        }
      } catch (err) {}
    },

    serveGood() {
      this.beep(523, 0.1, 'triangle', 0.14);
      this.beep(659, 0.1, 'triangle', 0.14, 0.09);
      this.beep(784, 0.18, 'triangle', 0.16, 0.18);
    },

    serveBad() {
      this.beep(160, 0.22, 'sawtooth', 0.12);
      this.beep(110, 0.28, 'sawtooth', 0.12, 0.12);
    },

    expire() {
      this.beep(392, 0.12, 'triangle', 0.1);
      this.beep(311, 0.12, 'triangle', 0.1, 0.11);
      this.beep(233, 0.26, 'triangle', 0.12, 0.22);
    },

    tick() {
      this.beep(880, 0.05, 'square', 0.05);
    },

    bell() {
      this.beep(1046, 0.5, 'sine', 0.12);
      this.beep(1568, 0.4, 'sine', 0.06, 0.02);
    },

    start() {
      this.beep(392, 0.09, 'triangle', 0.12);
      this.beep(523, 0.09, 'triangle', 0.12, 0.08);
      this.beep(659, 0.16, 'triangle', 0.14, 0.16);
    },

    gameOver() {
      this.beep(523, 0.14, 'triangle', 0.12);
      this.beep(440, 0.14, 'triangle', 0.12, 0.13);
      this.beep(349, 0.14, 'triangle', 0.12, 0.26);
      this.beep(262, 0.3, 'triangle', 0.13, 0.39);
    },
  };
  return bank;
}
