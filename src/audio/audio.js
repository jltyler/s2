import Sequences from './sequences';
import bindKeys from './keys';
import {NOTES, ALPHA} from './notes';

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioContext = undefined; // AudioContext instance is created when S2Audio::init is called
const notePlannerInterval = 100; // Delay between planning notes
const notePlannerBuffer = .25; // Notes are plannesd this far in advance (in seconds)

const defaultGainEnvelope = {
    attack: 0.1,
    decay: 0.2,
    sustain: 1.0,
    release: 2.0,
};

/**
 * Stores gain envelope information. Creates GainNodes and schedules changes on the gain AudioParam
 */
class GainEnvelope {
    /**
     * Create a new GainEnvelope
     * @param {Object} options GainEnvelope options object
     * @param {number} options.attack Attack (in seconds). Default: 0.1
     * @param {number} options.decay Decay (in seconds). Default: 0.2
     * @param {number} options.sustain Sustain level.  Default: 1.0
     * @param {number} options.release Release (in seconds). Default: 2.0
     */
    constructor(options = {}) {
        if (!audioContext) console.error('GainEnvelope::GainEnvelope(): Invalid audioContext!');
        this.options = Object.assign({}, defaultGainEnvelope, options);
        this.attachRelease = this.attachRelease.bind(this);
        this.newEnvelope = this.newEnvelope.bind(this);
    }

    /**
     * Create a new GainNode, schedule the envelope changes, and return it
     * @param {number} startTime When the scheduled changes should start occuring
     */
    newEnvelope(startTime) {
        const gain = audioContext.createGain();
        gain.gain.cancelScheduledValues(startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(1, startTime + this.options.attack);
        gain.gain.linearRampToValueAtTime(this.options.sustain, startTime + this.options.attack + this.options.decay);
        this.attachRelease(gain);
        return gain;
    }

    /**
     * Attaches a release function that recieves a time to schedule the release envelope settings.
     * @param {GainNode} gain GainNode to attach the function to
     */
    attachRelease(gain) {
        gain.release = ((stopTime) => {
            gain.gain.cancelScheduledValues(stopTime);
            gain.gain.setValueAtTime(gain.gain.value, stopTime);
            gain.gain.linearRampToValueAtTime(0, stopTime + this.options.release);
            return stopTime + this.options.release;
        }).bind(this);
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

/**
 * Stores filter frequency envelope options. Creates BiquadFilterNodes and schedules changes on the frequency AudioParam
 */
class FilterEnvelope {
    /**
     * Create a new FilterEnvelope
     * @param {Object} options FilterEnvelope options object
     * @param {number} options.attack Attack (in seconds). Default: 0.1
     * @param {number} options.decay Decay (in seconds). Default: 0.2
     * @param {number} options.sustain Sustain level multiplier.  Default: 1.0
     * @param {number} options.release Release (in seconds). Default: 2.0
     * @param {string} options.type Filter type. Default: 'highpass'
     * @param {number} options.freq Maximum frequency. Default: 22500
     * @param {number} options.Q Quality factor. Default: 1
     */
    constructor(options = {}) {
        if (!audioContext) console.error('FilterEnvelope::FilterEnvelope(): Invalid audioContext!');
        this.options = Object.assign({}, defaultFilterEnvelope, options);
        this.attachRelease = this.attachRelease.bind(this);
        this.newEnvelope = this.newEnvelope.bind(this);
    }

    /**
     * Create a new BiquadFilterNode, schedule the envelope changes, and return it
     * @param {number} startTime When the scheduled changes should start occuring
     */
    newEnvelope(startTime) {
        const filter = audioContext.createBiquadFilter();
        filter.type = this.options.type;
        filter.Q.value = this.options.Q;
        filter.frequency.cancelScheduledValues(startTime);
        filter.frequency.setValueAtTime(0, startTime);
        filter.frequency.linearRampToValueAtTime(this.options.freq, startTime + this.options.attack);
        filter.frequency.linearRampToValueAtTime(this.options.sustain * this.options.freq, startTime + this.options.attack + this.options.decay);
        this.attachRelease(filter);
        return filter;
    }

    /**
     * Attaches a release function that recieves a time to schedule the release envelope settings.
     * @param {BiquadFilterNode} filter BiquadFilterNode to attach the function to
     */
    attachRelease(filter) {
        filter.release = ((stopTime) => {
            filter.frequency.cancelScheduledValues(stopTime);
            filter.frequency.setValueAtTime(filter.frequency.value, stopTime);
            filter.frequency.linearRampToValueAtTime(0, stopTime + this.options.release);
            return stopTime + this.options.release;
        }).bind(this);
    }
}

const defaultVoiceOptions = {
    waveform: 'sawtooth',
    singleGainEnvelope: false,
    singleFilterEnvelope: false,
    unison: 1,
    unisonSpread: 1,
    tremoloFrequency: 10,
    tremoloAmplitude: 0,
};

/**
 * Stops an oscillator or an array of oscillators at the specified time
 */
const stopOscs = (osc, stopTime = 0) => {
    if (Array.isArray(osc)) {
        osc.forEach(o => o.stop(stopTime));
    } else {
        osc.stop(stopTime);
    }
};

/**
 * Holds voice information and creates oscillators
 */
class Voice {
    /**
     * Create a new voice
     * @param {GainEnvelope} gainEnvelope GainEnvelope instance to use
     * @param {FilterEnvelope} filterEnvelope FilterEnvelope instance to use
     * @param {Object} options Voice options object
     * @param {string} options.waveform String representing waveform type. Default: 'sawtooth'
     * @param {number} options.unison How many seperate oscillators to use for unison. Default: 1
     * @param {number} options.unisonSpread How far the oscillator frequencies should be spread. Default: 1 semitone
     * @param {number} options.tremoloFrequency Frequency for the tremolo effect on the oscillator frequency. Default: 10
     * @param {number} options.tremoloAmplitude Amplitude for the tremolo effect. Default: 0
     */
    constructor(gainEnvelope, filterEnvelope, options = {}) {
        if (!audioContext) console.error('Voice::Voice(): Invalid audioContext!');
        this.gainEnv = gainEnvelope;
        this.filterEnv = filterEnvelope;
        this.options = Object.assign({}, defaultVoiceOptions, options);
        console.log(this.options);

        this.playing = {};
        this.getOscId = (() => {
            let next = 0;
            return (() => next++);
        })();

        this.newOscillator = this.newOscillator.bind(this);
        this.play = this.play.bind(this);
        this.release = this.release.bind(this);
        this.stop = this.stop.bind(this);
        this.stopAll = this.stopAll.bind(this);
    }

    /**
     * Creates new oscillator node
     * @private
     */
    newOscillator(frequency, tremoloGain, destination, startTime) {
        o = audioContext.createOscillator();
        o.type = this.options.waveform;
        o.frequency.value = frequency;
        tremoloGain.connect(o.detune);
        o.connect(destination);
        o.start(startTime);
        return o;
    }

    /**
     * Creates new oscillators and envelope nodes and plays a note on them. Returns the id of the note played.
     * NOTE: If you don't provide a stopTime you must call the release or stop yourself and provide the id returned from this function
     * @param {number} frequency Frequency to play
     * @param {AudioDestinationNode} destination Destination node (uses audioContext.destination if this is falsey)
     * @param {number} startTime When to play the note
     * @param {number} [stopTime] When to release the note. If this is not provided you must manually call release or stop on the Voice
     * @returns {number} Internal id for note. An id must be provided when calling release or stop
     */
    play(frequency, destination, startTime, stopTime=0) {
        const gain = this.gainEnv.newEnvelope(startTime);
        const filter = this.filterEnv.newEnvelope(startTime);

        const tremoloOsc = audioContext.createOscillator();
        const tremoloGain = audioContext.createGain();
        tremoloOsc.frequency.value = this.options.tremoloFrequency;
        tremoloGain.gain.value = this.options.tremoloAmplitude;
        tremoloOsc.connect(tremoloGain);
        tremoloOsc.start(startTime);

        let oscs = undefined;

        if (this.options.unison > 1) {
            oscs = [];
            const minVal = this.options.unisonSpread / 2 * -1;
            const inc = this.options.unisonSpread / (this.options.unison - 1);
            for (let i = 0; i < this.options.unison; ++i) {
                oscs.push(this.newOscillator(frequency * Math.pow(ALPHA, minVal + inc * i), tremoloGain, gain, startTime));
            }
        } else {
            oscs = this.newOscillator(frequency, tremoloGain, gain, startTime);
        }
        gain.connect(filter).connect(destination || audioContext.destination);

        const id = this.getOscId();
        this.playing[id] = [oscs, gain, filter];

        if (stopTime) {
            const releaseTime = gain.release(stopTime) + 0.01;
            filter.release(stopTime);
            stopOscs(oscs, releaseTime);
            setTimeout(() => delete this.playing[id], (releaseTime + 1) * 1000);
        }
        // else console.log('Undefined note length.');

        return id;
    }

    /**
     * Start release schedule on note
     * @param {number} id Id of note that was returned by play()
     */
    release(id) {
        const osc = this.playing[id][0];
        const gain = this.playing[id][1];
        const filter = this.playing[id][2];
        // console.log('release gain:',gain);
        const releaseTime = gain.release(audioContext.currentTime);
        filter.release(audioContext.currentTime);
        stopOscs(osc, releaseTime);
        delete this.playing[id];
    }

    /**
     * Immediately stop note
     * @param {number} id Id of note that was returned by play()
     */
    stop(id) {
        const osc = this.playing[id][0];
        stopOscs(osc);
        delete this.playing[id];
    }

    /**
     * Immediately stop all notes
     */
    stopAll() {
        for (const id in Object.keys(this.playing)) {
            const osc = this.playing[id][0];
            stopOscs(osc);
        }
        this.playing = {};
    }
}

/**
 * Uses a sequence to play notes on a Voice
 */
class NotePlanner {
    /**
     * Create a new NotePlanner
     * @param {NoteSequence} sequence Sequence of notes to play
     * @param {Voice} voice Voice to play the notes with
     * @param {AudioDestinationNode} destination Final destination of sound signal
     */
    constructor(sequence, voice, destination) {
        // console.log('New NotePlanner', sequence, voice, audioContext);
        this.voice = voice;
        this.sequence = [...sequence];
        this.destination = destination;

        this.remaining = [];
        this.startTime = audioContext.currentTime;
        this.running = false;
        this.plan = this.plan.bind(this);
    }

    /**
     * Start playing the sequence right now
     */
    start () {
        this.running = true;
        this.startTime = audioContext.currentTime;
        this.remaining = [...this.sequence];
        this.plan();
    }

    /**
     * Plan the notes
     * @private
     */
    plan() {
        // console.log('Planning notes', this.playing);

        if (!this.remaining.length) return;
        let note = this.remaining[0];
        let i = 0;
        while (note && note.start + this.startTime < audioContext.currentTime + notePlannerBuffer) {
            // console.log('Planning note', note.freq, note.start, note.stop);

            this.voice.play(note.freq, this.destination, this.startTime + note.start, this.startTime + note.stop);

            ++i;
            note = this.remaining[i];
        }

        console.log('Planned ' + i + ' notes.');

        this.remaining.splice(0, i);
        // console.log('this.playing after splice', this.playing);

        if (this.running)
            setTimeout(this.plan, notePlannerInterval);
    }

    stop() {
        this.running = false;
    }
}

/**
 * Main audio controller for s2. You must call init() after creating this and before anything else
 */
class S2Audio {
    constructor() {
        this.init = this.init.bind(this);
        this.start = this.start.bind(this);
        this.startSequence = this.startSequence.bind(this);
        this.initialized = false;
    }

    init() {
        if (this.initialized) {console.log("S2Audio::init(): Already initialized!"); return;}
        audioContext = new AudioContext();
        this.voices = [];
        this.initialized = true;
    }

    start () {
        if (!this.initialized) return;
        const ge = new GainEnvelope({release: .1, sustain: 1});
        const fe = new FilterEnvelope({attack: 0.001, decay: 0.1, sustain: 0.08, release: 0.5, Q: 10, freq: 11250, type: 'lowpass'})
        const comp = audioContext.createDynamicsCompressor();
        comp.connect(audioContext.destination);
        const v = new Voice(ge, fe, {waveform: 'sawtooth', unison: 12, unisonSpread: 0.2, tremoloFrequency: 8, tremoloAmplitude: 80});
        const voices = {};
        bindKeys(
            (note) => {
                voices[note] = v.play(NOTES[note], comp, this.ctx.currentTime);
            },
            (note) => {
                v.release(voices[note]);
            }
        );
        // const np = new NotePlanner(Sequences.testSequence, v, comp);

        // np.start();
    }

    startSequence() {
        const np = new NotePlanner(Sequences.testSequence, v, this.ctx, comp);

        np.start();
    }
}

export default S2Audio;