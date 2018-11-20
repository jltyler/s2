import Sequences from './sequences';
import bindKeys from './keys';
import Notes from './notes';

const AudioContext = window.AudioContext || window.webkitAudioContext;
const notePlannerInterval = 100; // Notes are planned every few milliseconds
const notePlannerBuffer = .25; // Notes are planned this far in advance (in seconds)



class GainEnvelope {
    constructor() {

    }
}

const defaultVoiceOptions = {
    attack: 0.1,
    decay: 0.2,
    sustain: 0.7,
    release: 2.0,
    singleEnvelope: false
};

/**
 * Holds voice information and creates oscillators
 */
class Voice {
    constructor(audioContext, options = {}) {
        if (!audioContext) console.error('Voice::Voice(): Invalid audioContext!');
        this.ctx = audioContext;
        this.options = Object.assign({}, defaultVoiceOptions, options);
        console.log(this.options);
        this.playing = {};
        this.getOscId = (() => {
            let next = 0;
            return (() => next++);
        })();


        this.play = this.play.bind(this);
        this.stop = this.stop.bind(this);
        this.release = this.release.bind(this);
        this.stopAll = this.stopAll.bind(this);
    }

    play(frequency, startTime, stopTime=0, destination=undefined) {
        const osc = this.ctx.createOscillator();
        osc.frequency.value = frequency;

        const gain = this.ctx.createGain();
        gain.gain.cancelScheduledValues(startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(1, startTime + this.options.attack);
        gain.gain.linearRampToValueAtTime(this.options.sustain, startTime + this.options.attack + this.options.decay);

        osc.connect(gain).connect(destination || this.ctx.destination);

        const id = this.getOscId();
        this.playing[id] = [osc, gain];

        osc.start(startTime);
        if (stopTime) {
            gain.gain.linearRampToValueAtTime(0, stopTime + this.options.release);
            osc.stop(stopTime + this.options.release + .1);
            setTimeout(() => this.stop(id), (stopTime - startTime + this.options.release + 1) * 1000);
        }

        return id;
    }

    release(id) {
        const gain = this.playing[id][1];
        // console.log('release gain:',gain);
        gain.gain.cancelScheduledValues(this.ctx.currentTime);
        gain.gain.setValueAtTime(gain.gain.value, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + this.options.release);

        this.playing[id][0].stop(this.ctx.currentTime + this.options.release + .1);
        delete this.playing[id];
    }

    stop(id) {
        this.playing[id][0].stop();
        delete this.playing[id];
    }

    stopAll() {
        for (const id in Object.keys(this.playing)) {
            this.playing[id][0].stop();
        }
        this.playing = {};
    }
}

class NotePlanner {
    constructor(sequence, voice, audioContext) {
        // console.log('New NotePlanner', sequence, voice, audioContext);
        this.voice = voice;
        this.sequence = [...sequence];
        this.ctx = audioContext;

        this.playing = [...sequence];
        this.startTime = audioContext.currentTime;
        this.running = false;
        this.plan = this.plan.bind(this);
    }

    start () {
        this.running = true;
        this.plan();
    }

    plan() {
        console.log('Planning notes', this.playing);

        if (!this.playing.length) return;
        let note = this.playing[0];
        let i = 0;
        while (note && note.start + this.startTime < this.ctx.currentTime + notePlannerBuffer) {
            console.log('Planning note', note.freq, note.start, note.stop);

            this.voice.play(note.freq, this.startTime + note.start, this.startTime + note.stop)

            // Temporary
            // const tOsc = this.ctx.createOscillator();
            // tOsc.frequency.value = note.freq;
            // tOsc.connect(this.ctx.destination);
            // tOsc.start(this.startTime + note.start);
            // tOsc.stop(this.startTime + note.stop);
            ++i;
            note = this.playing[i];
        }

        console.log('Done planning notes.', i);

        this.playing.splice(0, i);
        console.log('this.playing after splice', this.playing);

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
        this.tempo = 60.0;
        this.voices = [];
        // const osc = this.ctx.createOscillator();
        // osc.frequency.value = 440;

        // const envGain = this.ctx.createGain();
        // envGain.gain.cancelScheduledValues(this.ctx.currentTime);
        // envGain.gain.setValueAtTime(0, this.ctx.currentTime);
        // envGain.gain.linearRampToValueAtTime(1, this.ctx.currentTime + 2);
        // envGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 3);
        // osc.connect(envGain);
        // envGain.connect(this.ctx.destination);
        // osc.start();
        // osc.stop(this.ctx.currentTime + 4);
    }

    start () {
        const getId = (() => {
            let next = 0;
            return (() => next++);
        })();
        // const np = new NotePlanner(Sequences.testSequence, null, this.ctx);
        // np.start()
        const v = new Voice(this.ctx, {release: 1, sustain: 0.1});
        const voices = {};
        bindKeys(
            (note) => {
                const id = getId();
                voices[note] = v.play(Notes[note], this.ctx.currentTime);
            },
            (note) => {
                v.release(voices[note]);
            }
        );
        // const np = new NotePlanner(Sequences.testSequence, v, this.ctx)
        // np.start();
    }

    startSequence() {

    }
}

export default S2Audio;