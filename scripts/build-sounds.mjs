// Synthesizes every sound effect in src/assets/sounds from code (sine and triangle tones, a pinch of noise), so the
// game ships no third-party audio. Output: 22.05 kHz, 16-bit mono WAV. Run: `pnpm sounds:build`.
import { Buffer } from "node:buffer";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const RATE = 22050;
const PEAK = 0.85;
const OUT = "src/assets/sounds";

/** Equal-tempered note frequency: 0 = A4 (440 Hz). */
const note = (semitones) => 440 * 2 ** (semitones / 12);
const C5 = note(3);
const E5 = note(7);
const G5 = note(10);
const C6 = note(15);
const E6 = note(19);
const G6 = note(22);
const C7 = note(27);

// Seeded noise, so every run writes identical files.
let seed = 7;
const noise = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return (seed / 0x7fffffff) * 2 - 1;
};

const sine = (phase) => Math.sin(2 * Math.PI * phase);
const triangle = (phase) => 1 - 4 * Math.abs((phase % 1) - 0.5);

/**
 * One voice added into buf: a tone gliding from `from` to `to` Hz, starting at `at` seconds for `length` seconds, with
 * a short attack and an exponential decay. `bell` adds a soft octave partial for a chime.
 */
const voice = (buf, { at = 0, length, from, to = from, gain = 1, decay = 6, wave = sine, bell = 0 }) => {
    const start = Math.round(at * RATE);
    const count = Math.round(length * RATE);
    const attack = Math.min(0.006 * RATE, count / 4);
    let phase = 0;
    for (let i = 0; i < count && start + i < buf.length; i++) {
        const t = i / count;
        phase += (from + (to - from) * t) / RATE;
        const envelope = Math.min(1, i / attack) * Math.exp(-decay * t) * (1 - t ** 8);
        buf[start + i] += gain * envelope * (wave(phase) + bell * sine(phase * 2));
    }
};

/** A short noise tick, for the physical "click" of a block landing. */
const tick = (buf, { at = 0, length = 0.02, gain = 0.3 }) => {
    const start = Math.round(at * RATE);
    const count = Math.round(length * RATE);
    for (let i = 0; i < count; i++) buf[start + i] += gain * noise() * (1 - i / count) ** 3;
};

const render = (seconds, draw) => {
    const buf = new Float64Array(Math.round(seconds * RATE));
    draw(buf);
    const max = buf.reduce((m, v) => Math.max(m, Math.abs(v)), 0) || 1;
    return buf.map((v) => (v / max) * PEAK);
};

const wav = (samples) => {
    const data = Buffer.alloc(samples.length * 2);
    samples.forEach((v, i) => data.writeInt16LE(Math.round(v * 32767), i * 2));
    const header = Buffer.alloc(44);
    header.write("RIFF", 0);
    header.writeUInt32LE(36 + data.length, 4);
    header.write("WAVEfmt ", 8);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20); // PCM
    header.writeUInt16LE(1, 22); // mono
    header.writeUInt32LE(RATE, 24);
    header.writeUInt32LE(RATE * 2, 28);
    header.writeUInt16LE(2, 32);
    header.writeUInt16LE(16, 34);
    header.write("data", 36);
    header.writeUInt32LE(data.length, 40);
    return Buffer.concat([header, data]);
};

const SOUNDS = {
    // UI tap: a tiny high blip.
    tap: render(0.05, (b) => voice(b, { length: 0.05, from: 1040, decay: 5 })),
    // Picking up a piece: a short upward chirp.
    pickup: render(0.07, (b) => voice(b, { length: 0.07, from: 700, to: 900, decay: 4 })),
    // Turning a piece: a quick two-step swoosh upward.
    turn: render(0.12, (b) => {
        voice(b, { length: 0.06, from: 520, to: 780, wave: triangle, decay: 4 });
        voice(b, { at: 0.05, length: 0.07, from: 780, to: 1170, wave: triangle, decay: 4 });
    }),
    // A piece lands: a low thump with a soft click on top.
    place: render(0.14, (b) => {
        voice(b, { length: 0.14, from: 200, to: 170, decay: 7 });
        tick(b, { length: 0.015, gain: 0.25 });
    }),
    // Can't drop here: a gentle low buzz that bends down.
    invalid: render(0.18, (b) => voice(b, { length: 0.18, from: 310, to: 250, wave: triangle, decay: 5 })),
    // A line clears: a bright three-note chime.
    clear: render(0.68, (b) =>
        [C6, E6, G6].forEach((f, i) => voice(b, { at: i * 0.06, length: 0.55, from: f, bell: 0.3, decay: 5 }))
    ),
    // A streak: the same chime climbing one note higher.
    combo: render(0.67, (b) =>
        [E6, G6, C7].forEach((f, i) => voice(b, { at: i * 0.05, length: 0.55, from: f, bell: 0.35, decay: 5 }))
    ),
    // The whole board is clear: a rising arpeggio that rings out as a chord.
    perfect: render(0.92, (b) =>
        [C5, E5, G5, C6, E6].forEach((f, i) =>
            voice(b, { at: i * 0.07, length: 0.92 - i * 0.07, from: f, bell: 0.3, decay: 3.5, gain: 0.8 })
        )
    ),
    // Out of space: three soft falling notes, sad but friendly.
    gameover: render(0.96, (b) =>
        [G5, E5, C5].forEach((f, i) =>
            voice(b, { at: i * 0.18, length: 0.96 - i * 0.18, from: f, wave: triangle, decay: 4, gain: 0.7 })
        )
    ),
    // Keep playing: a sweep up with a sparkle at the top.
    revive: render(0.7, (b) => {
        voice(b, { length: 0.5, from: 340, to: 1140, decay: 2.5, bell: 0.2 });
        voice(b, { at: 0.42, length: 0.28, from: C7, bell: 0.4, decay: 6, gain: 0.5 });
    }),
};

for (const [name, samples] of Object.entries(SOUNDS)) {
    writeFileSync(join(OUT, `${name}.wav`), wav(samples));
    console.log(`${OUT}/${name}.wav (${(samples.length / RATE).toFixed(2)}s)`);
}
