import { windStrength, windTime } from '../wind/wind'

/**
 * Background sound, made live in the browser with the Web Audio API.
 *
 * No audio files: the music is played by little synthesizers in code. That
 * means nothing to license or download, and it never loops audibly because
 * the melody is chosen at random as it plays. It has three layers:
 *
 *   1. Pads: soft, slow chords that swell in and fade out, one every 8s.
 *   2. Plucks: occasional gentle notes from a five-note scale, so any
 *      combination sounds pleasant, echoing through a delay.
 *   3. Wind: filtered noise whose volume and brightness follow the same
 *      `windStrength` the curtains and flowers use, so you hear each gust
 *      as you see it.
 *
 * Web Audio basics used here:
 *   - An AudioContext is the sound engine. Browsers only let it start after
 *     the visitor clicks or presses a key, which is why it starts on "Enter".
 *   - Sounds are made by nodes (oscillators, noise) and pass through more
 *     nodes (filters, gains, echo) to the speakers: a little patch cable graph.
 *   - Changes are scheduled on the engine's own clock (`ctx.currentTime`),
 *     which is far more precise than setTimeout.
 *
 * This is the placeholder soundtrack. In the music room milestone, your own
 * tracks will play from files instead, and this will dip under them.
 */

let ctx: AudioContext | null = null
let master: GainNode
let musicBus: GainNode
let windGain: GainNode
let windFilter: BiquadFilterNode
let rustleGain: GainNode
let timer: number | undefined

const MASTER_VOLUME = 0.7
const MUSIC_VOLUME = 0.55

// Note frequencies (Hz). D major's gentle colours.
const N = {
  G2: 98.0, A2: 110.0, B2: 123.47, D3: 146.83, E3: 164.81, Fs3: 185.0, G3: 196.0, A3: 220.0, B3: 246.94,
  Cs4: 277.18, D4: 293.66, E4: 329.63, Fs4: 369.99, A4: 440.0, B4: 493.88, D5: 587.33, E5: 659.25, Fs5: 739.99,
}

const CHORDS = [
  [N.D3, N.Fs3, N.A3, N.Cs4, N.E4], // Dmaj9
  [N.B2, N.D3, N.Fs3, N.A3, N.Cs4], // Bm9
  [N.G2, N.B2, N.D3, N.Fs3, N.A3], // Gmaj9
  [N.A2, N.D3, N.E3, N.G3, N.B3], // A9sus4
]
const SCALE = [N.D4, N.E4, N.Fs4, N.A4, N.B4, N.D5, N.E5, N.Fs5] // D major pentatonic

const CHORD_SECONDS = 8
const STEP_SECONDS = 0.42

let nextChordAt = 0
let chordIndex = 0
let nextStepAt = 0
let lastNote = -1

/** Start the sound. Must be called from a click or key press. Safe to call twice. */
export function startAmbience(muted: boolean, musicOn: boolean) {
  if (ctx) {
    void ctx.resume()
    return
  }
  const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  if (!AudioCtx) return
  ctx = new AudioCtx()

  master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)

  // A soft reverb shared by the music, so it sounds like it's in a room.
  const reverb = ctx.createConvolver()
  reverb.buffer = makeImpulse(ctx, 3.2)
  const reverbGain = ctx.createGain()
  reverbGain.gain.value = 0.45
  reverb.connect(reverbGain).connect(master)

  musicBus = ctx.createGain()
  musicBus.gain.value = musicOn ? MUSIC_VOLUME : 0
  musicBus.connect(master)
  musicBus.connect(reverb)

  // Wind: looping noise through a band-pass filter (lets a band of pitches through).
  const noise = ctx.createBufferSource()
  noise.buffer = makeNoise(ctx, 4)
  noise.loop = true
  windFilter = ctx.createBiquadFilter()
  windFilter.type = 'bandpass'
  windFilter.Q.value = 0.6
  windGain = ctx.createGain()
  windGain.gain.value = 0
  noise.connect(windFilter).connect(windGain).connect(master)

  // Leaves rustling: the same noise, only its highest pitches, quieter.
  const rustleFilter = ctx.createBiquadFilter()
  rustleFilter.type = 'highpass'
  rustleFilter.frequency.value = 3500
  rustleGain = ctx.createGain()
  rustleGain.gain.value = 0
  noise.connect(rustleFilter).connect(rustleGain).connect(master)
  noise.start()

  nextChordAt = ctx.currentTime + 0.2
  nextStepAt = ctx.currentTime + 2
  setMuted(muted)
  // Every 100ms: follow the wind, and schedule any music due in the next 1.5s.
  timer = window.setInterval(tick, 100)
  tick()
}

export function setMuted(muted: boolean) {
  if (!ctx) return
  // setTargetAtTime glides to the new value, avoiding clicks.
  master.gain.setTargetAtTime(muted ? 0 : MASTER_VOLUME, ctx.currentTime, 0.4)
}

export function setMusicOn(on: boolean) {
  if (!ctx) return
  musicBus.gain.setTargetAtTime(on ? MUSIC_VOLUME : 0, ctx.currentTime, 0.8)
}

export function stopAmbience() {
  window.clearInterval(timer)
  void ctx?.close()
  ctx = null
  delay = null
}

function tick() {
  if (!ctx) return
  const now = ctx.currentTime

  const wind = windStrength(windTime())
  windFilter.frequency.setTargetAtTime(280 + wind * 650, now, 0.3)
  windGain.gain.setTargetAtTime(0.02 + wind * 0.11, now, 0.3)
  rustleGain.gain.setTargetAtTime(wind * wind * 0.025, now, 0.3)

  const horizon = now + 1.5
  while (nextChordAt < horizon) {
    playChord(CHORDS[chordIndex % CHORDS.length], nextChordAt)
    chordIndex++
    nextChordAt += CHORD_SECONDS
  }
  while (nextStepAt < horizon) {
    // Mostly silence: a note on roughly one step in four, never the same note twice running.
    if (Math.random() < 0.26) {
      let note = Math.floor(Math.random() * SCALE.length)
      if (note === lastNote) note = (note + 2) % SCALE.length
      lastNote = note
      playPluck(SCALE[note], nextStepAt)
    }
    nextStepAt += STEP_SECONDS
  }
}

function playChord(notes: number[], at: number) {
  const c = ctx!
  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 900
  const gain = c.createGain()
  // Envelope: fade in over 2.5s, hold, fade out past the next chord's start so they overlap.
  gain.gain.setValueAtTime(0, at)
  gain.gain.linearRampToValueAtTime(0.045, at + 2.5)
  gain.gain.setValueAtTime(0.045, at + CHORD_SECONDS - 1)
  gain.gain.linearRampToValueAtTime(0, at + CHORD_SECONDS + 2.5)
  filter.connect(gain).connect(musicBus)

  for (const freq of notes) {
    // Two slightly detuned oscillators per note give a soft, shimmering "chorus".
    for (const detune of [-5, 5]) {
      const osc = c.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = freq
      osc.detune.value = detune
      osc.connect(filter)
      osc.start(at)
      osc.stop(at + CHORD_SECONDS + 2.6)
    }
  }
  // A quiet bass note an octave below the root.
  const bass = c.createOscillator()
  bass.type = 'sine'
  bass.frequency.value = notes[0] / 2
  const bassGain = c.createGain()
  bassGain.gain.setValueAtTime(0, at)
  bassGain.gain.linearRampToValueAtTime(0.06, at + 2)
  bassGain.gain.linearRampToValueAtTime(0, at + CHORD_SECONDS + 1.5)
  bass.connect(bassGain).connect(musicBus)
  bass.start(at)
  bass.stop(at + CHORD_SECONDS + 1.6)
}

let delay: DelayNode | null = null

function playPluck(freq: number, at: number) {
  const c = ctx!
  if (!delay) {
    // An echo: the delay feeds part of its output back into itself.
    delay = c.createDelay(2)
    delay.delayTime.value = STEP_SECONDS * 1.5
    const feedback = c.createGain()
    feedback.gain.value = 0.32
    const tone = c.createBiquadFilter()
    tone.type = 'lowpass'
    tone.frequency.value = 2200
    delay.connect(tone).connect(feedback).connect(delay)
    tone.connect(musicBus)
  }
  const osc = c.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = freq
  // A quieter octave above adds a bell-like edge.
  const overtone = c.createOscillator()
  overtone.type = 'sine'
  overtone.frequency.value = freq * 2
  const overtoneGain = c.createGain()
  overtoneGain.gain.value = 0.25

  const gain = c.createGain()
  gain.gain.setValueAtTime(0, at)
  gain.gain.linearRampToValueAtTime(0.05, at + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 2.2)

  osc.connect(gain)
  overtone.connect(overtoneGain).connect(gain)
  gain.connect(musicBus)
  gain.connect(delay)
  for (const o of [osc, overtone]) {
    o.start(at)
    o.stop(at + 2.3)
  }
}

function makeNoise(c: AudioContext, seconds: number) {
  const buffer = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate)
  const data = buffer.getChannelData(0)
  // "Brownish" noise: each sample drifts from the last, which sounds softer than pure hiss.
  let last = 0
  for (let i = 0; i < data.length; i++) {
    last = (last + 0.04 * (Math.random() * 2 - 1)) / 1.02
    data[i] = last * 3.5
  }
  return buffer
}

/** A reverb "impulse": what a clap would sound like in the room. Decaying noise is a fine fake. */
function makeImpulse(c: AudioContext, seconds: number) {
  const length = c.sampleRate * seconds
  const buffer = c.createBuffer(2, length, c.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch)
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3)
  }
  return buffer
}
