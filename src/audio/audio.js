import Sequences from './sequences';
import bindKeys from './keys';
import {NOTES, ALPHA} from './notes';

const AudioContext = window.AudioContext || window.webkitAudioContext;
const notePlannerInterval = 100; // Notes are planned every few milliseconds
const notePlannerBuffer = .25; // Notes are planned this far in advance (in seconds)

const defaultGainEnvelope = {
    attack: 0.1,
    decay: 0.2,
    sustain: 0.7,
    release: 2.0,
};

class GainEnvelope {
    constructor(audioContext, options = {}) {
        if (!audioContext) console.error('GainEnvelope::GainEnvelope(): Invalid audioContext!');
        this.ctx = audioContext;
        this.options = Object.assign({}, defaultGainEnvelope, options);
    }

    newEnvelope(startTime) {
        const gain = this.ctx.createGain();
        gain.gain.cancelScheduledValues(startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(1, startTime + this.options.attack);
        gain.gain.linearRampToValueAtTime(this.options.sustain, startTime + this.options.attack + this.options.decay);
        gain.release = ((stopTime) => {
            gain.gain.cancelScheduledValues(stopTime);
            gain.gain.setValueAtTime(gain.gain.value, stopTime);
            gain.gain.linearRampToValueAtTime(0, stopTime + this.options.release);
            return stopTime + this.options.release;
        }).bind(this);
        return gain;
    }
}

const defaultFilterEnvelope = {
    attack: 0.01,
    decay: 0.01,
    sustain: 1.0,
    release: 0.01,
    type: 'highpass',
    freq: 22500,
    Q: 1
};

class FilterEnvelope {
    constructor(audioContext, options = {}) {
        if (!audioContext) console.error('FilterEnvelope::FilterEnvelope(): Invalid audioContext!');
        this.ctx = audioContext;
        this.options = Object.assign({}, defaultFilterEnvelope, options);
    }

    newEnvelope(startTime) {
        const filter = this.ctx.createBiquadFilter();
        filter.type = this.options.type;
        filter.Q.value = this.options.Q;
        filter.frequency.cancelScheduledValues(startTime);
        filter.frequency.setValueAtTime(0, startTime);
        filter.frequency.linearRampToValueAtTime(this.options.freq, startTime + this.options.attack);
        filter.frequency.linearRampToValueAtTime(this.options.sustain * this.options.freq, startTime + this.options.attack + this.options.decay);
        filter.release = ((stopTime) => {
            filter.frequency.cancelScheduledValues(stopTime);
            filter.frequency.setValueAtTime(filter.frequency.value, stopTime);
            filter.frequency.linearRampToValueAtTime(0, stopTime + this.options.release);
            return stopTime + this.options.release;
        }).bind(this);
        return filter;
    }
}

const defaultVoiceOptions = {
    waveform: 'sawtooth',
    singleGainEnvelope: false,
    singleFilterEnvelope: false,
    unison: 1,
    unisonSpread: 1
};

/**
 * Holds voice information and creates oscillators
 */
class Voice {
    constructor(audioContext, gainEnvelope, filterEnvelope, options = {}) {
        if (!audioContext) console.error('Voice::Voice(): Invalid audioContext!');
        this.ctx = audioContext;
        this.gainEnv = gainEnvelope;
        this.filterEnv = filterEnvelope;
        this.options = Object.assign({}, defaultVoiceOptions, options);
        console.log(this.options);

        this.playing = {};
        this.getOscId = (() => {
            let next = 0;
            return (() => next++);
        })();


        this.play = this.play.bind(this);
        this.release = this.release.bind(this);
        this.stop = this.stop.bind(this);
        this.stopAll = this.stopAll.bind(this);
    }

    play(frequency, destination, startTime, stopTime=0) {
        const gain = this.gainEnv.newEnvelope(startTime);
        const filter = this.filterEnv.newEnvelope(startTime);
        let oscs = undefined;

        if (this.options.unison > 1) {
            oscs = [];
            const minVal = this.options.unisonSpread / 2 * -1;
            const inc = this.options.unisonSpread / (this.options.unison - 1);
            for (let i = 0; i < this.options.unison; ++i) {
                const o = this.ctx.createOscillator();
                oscs.push(o);
                o.type = this.options.waveform;
                o.frequency.value = frequency * Math.pow(ALPHA, minVal + inc * i);
                o.connect(gain);
                o.start(startTime);
            }
        } else {
            oscs = this.ctx.createOscillator();
            oscs.type = this.options.waveform;
            oscs.frequency.value = frequency;
            oscs.connect(gain);
            oscs.start(startTime);
        }
        gain.connect(filter).connect(destination || this.ctx.destination);

        const id = this.getOscId();
        this.playing[id] = [oscs, gain, filter];

        if (stopTime) {
            const releaseTime = gain.release(stopTime) + 0.01;
            filter.release(stopTime);
            if (Array.isArray(oscs)) {
                oscs.forEach(o => o.stop(releaseTime));
            } else {
                oscs.stop(releaseTime);
            }
            setTimeout(() => delete this.playing[id], (releaseTime + 1) * 1000);
        }
        // else console.log('Undefined note length.');

        return id;
    }

    release(id) {
        const osc = this.playing[id][0];
        const gain = this.playing[id][1];
        const filter = this.playing[id][2];
        // console.log('release gain:',gain);
        const releaseTime = gain.release(this.ctx.currentTime);
        filter.release(this.ctx.currentTime);
        if (Array.isArray(osc)) {
            osc.forEach(o => o.stop(releaseTime));
        } else {
            osc.stop(releaseTime);
        }
        delete this.playing[id];
    }

    stop(id) {
        const osc = this.playing[id][0];
        if (Array.isArray(osc)) {
            osc.forEach(o => o.stop());
        } else {
            osc.stop();
        }
        delete this.playing[id];
    }

    stopAll() {
        for (const id in Object.keys(this.playing)) {
            const osc = this.playing[id][0];
            if (Array.isArray(osc)) {
                osc.forEach(o => o.stop());
            } else {
                osc.stop();
            }
        }
        this.playing = {};
    }
}

class NotePlanner {
    constructor(sequence, voice, audioContext, destination) {
        // console.log('New NotePlanner', sequence, voice, audioContext);
        this.voice = voice;
        this.sequence = [...sequence];
        this.ctx = audioContext;
        this.destination = destination;

        this.playing = [];
        this.startTime = audioContext.currentTime;
        this.running = false;
        this.plan = this.plan.bind(this);
    }

    start () {
        this.running = true;
        this.startTime = this.ctx.currentTime;
        this.playing = [...this.sequence];
        this.plan();
    }

    plan() {
        // console.log('Planning notes', this.playing);

        if (!this.playing.length) return;
        let note = this.playing[0];
        let i = 0;
        while (note && note.start + this.startTime < this.ctx.currentTime + notePlannerBuffer) {
            // console.log('Planning note', note.freq, note.start, note.stop);

            this.voice.play(note.freq, this.destination, this.startTime + note.start, this.startTime + note.stop);

            ++i;
            note = this.playing[i];
        }

        console.log('Planned ' + i + ' notes.');

        this.playing.splice(0, i);
        // console.log('this.playing after splice', this.playing);

        if (this.running)
            setTimeout(this.plan, notePlannerInterval);
    }

    stop() {
        this.running = false;
    }
}

class S2Audio {
    constructor() {
        this.ctx = new AudioContext();

        this.start = this.start.bind(this);
    }

    start () {
        const ge = new GainEnvelope(this.ctx, {release: .1, sustain: 1});
        const fe = new FilterEnvelope(this.ctx, {attack: 0.001, decay: 0.1, sustain: 0.08, release: 0.5, Q: 10, freq: 11250, type: 'lowpass'})
        const comp = this.ctx.createDynamicsCompressor();
        comp.connect(this.ctx.destination);
        const v = new Voice(this.ctx, ge, fe, {waveform: 'sawtooth', unison: 8, unisonSpread: 0.5});
        const voices = {};
        bindKeys(
            (note) => {
                voices[note] = v.play(NOTES[note], comp, this.ctx.currentTime);
            },
            (note) => {
                v.release(voices[note]);
            }
        );
        // const np = new NotePlanner(Sequences.testSequence, v, this.ctx, comp);

        // np.start();
    }

    startSequence() {
        const np = new NotePlanner(Sequences.testSequence, v, this.ctx, comp);

        np.start();
    }
}

export default S2Audio;