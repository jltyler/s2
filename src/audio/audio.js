import Sequences from './sequences';
import {bind as bindKeys, unbind as unbindKeys, release as releaseKeys} from './keys';
import {NOTES, ALPHA} from './notes';

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioContext = undefined; // AudioContext instance is created when S2Audio::init is called
const notePlannerInterval = 100; // Delay between planning notes
const notePlannerBuffer = .25; // Notes are plannesd this far in advance (in seconds)


const defaultEnvelope = {
    attack: 0.1,
    decay: 0.2,
    sustain: 1.0,
    release: 2.0,
    singular: false
};

class Envelope {
    constructor(options = {}) {
        if (!audioContext) console.error('Envelope::Envelope(): Invalid audioContext!');
        this.options = Object.assign({}, defaultEnvelope, options);
    }

    connect(destination) {
        const gain = audioContext.createGain();
    }
}

const defaultLFO = {
    frequency: 1,
    amplitude: 10,
    waveform: 'sine',
    singular: false
};

class LFO {
    constructor(options = {}) {
        if (!audioContext) console.error('LFO::LFO(): Invalid audioContext!');
        this.options = Object.assign({}, defaultLFO, options);

        // If singular envelope is selected these will hold the nodes' references
        this.osc = null;
        this.gain = null;

        if (this.options.singular) this.enableSingular();

        this.connections = {
            'frequency': null,
            'amplitude': null,
        };

        this.connect = this.connect.bind(this);
        this.enableSingular = this.enableSingular.bind(this);
        this.disableSingular = this.disableSingular.bind(this);
        this.newLFO = this.newLFO.bind(this);
        this.setFrequency = this.setFrequency.bind(this);
        this.setAmplitude = this.setAmplitude.bind(this);
        this.connectFrequency = this.connectFrequency.bind(this);
        this.connectAmplitude = this.connectAmplitude.bind(this);
        this.addConnection = this.addConnection.bind(this);

    }

    connect(destination) {
        if (this.options.singular) {
            this.gain.connect(destination);
        } else {
            this.newLFO().connect(destination);
        }
    }

    enableSingular() {
        this.options.singular = true;
        this.osc = audioContext.createOscillator();
        this.osc.frequency.value = this.options.frequency;
        this.connectFrequency(this.osc);

        this.gain = audioContext.createGain();
        this.gain.gain.value = this.options.amplitude;
        this.connectAmplitude(this.gain);

        this.osc.connect(this.gain);
        this.osc.start();
    }

    disableSingular() {
        this.options.singular = false;
        this.osc.stop();
        this.osc = null;
        this.gain = null;
    }

    newLFO() {
        const osc = audioContext.createOscillator();
        osc.frequency.value = this.options.frequency;
        this.connectFrequency(osc);

        const gain = audioContext.createGain();
        gain.gain.value = this.options.amplitude;
        this.connectAmplitude(gain);

        osc.start();
        osc.connect(gain);
        return gain;
    }

    setFrequency(freq) {
        this.options.frequency = freq;
        if (this.options.singular) this.osc.frequency.value = freq;
    }

    setAmplitude(amp) {
        this.options.amplitude = amp;
        if (this.options.singular) this.gain.gain.value = amp;
    }

    connectFrequency(osc) {
        if (this.connections.frequency) {
            this.connections.frequency.connect(osc.detune);
        }
    }

    connectAmplitude(gain) {
        if (this.connections.amplitude) {
            this.connections.amplitude.connect(gain.gain);
        }
    }

    addConnection(param, source) {
        if (param in this.connections) {
            if (source instanceof LFO || source instanceof Envelope) {
                this.connections[param] = source;
                if (this.options.singular) {
                    this.connectFrequency(this.osc);
                    this.connectAmplitude(this.gain);
                }
            } else console.warn(`Source is NOT a valid connector!`);
        } else console.warn(`Parameter '${param}' is NOT a valid AudioParam!`);
    }
}

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
        this.setOption = this.setOption.bind(this);
        this.getOption = this.getOption.bind(this);
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

    setOption(key, value) {
        if (key in this.options) {
            this.options[key] = value;
        }
    }

    getOption(key) {
        return this.options[key];
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
        this.setOption = this.setOption.bind(this);
        this.getOption = this.getOption.bind(this);
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

    setOption(key, value) {
        if (key in this.options) {
            this.options[key] = value;
        }
    }

    getOption(key) {
        return this.options[key];
    }
}

const defaultVoiceOptions = {
    waveform: 'sawtooth',
    octave: 0,
    detune: 0,
    fine: 0,
    gain: 1.0,
    pan: 0.0,
    unison: 1,
    unisonSpread: 1,
    destination: undefined,
    useEnvelope: false,
    attack: 0.1,
    decay: 0.1,
    sustain: 1.0,
    release: 1.5,
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
     * @param {number} options.octave Increase or decrease by octaves. Default: 0
     * @param {number} options.detune Detune measured in semitones. Default: 0
     * @param {number} options.pan Pan to left or right. Default: 0
     * @param {number} options.unison How many seperate oscillators to use for unison. Default: 1
     * @param {number} options.unisonSpread How far the oscillator frequencies should be spread. Default: 1 semitone
     */
    constructor(options = {}) {
        if (!audioContext) console.error('Voice::Voice(): Invalid audioContext!');
        this.options = Object.assign({}, defaultVoiceOptions, options);
        this.gainEnv = new GainEnvelope({});
        console.log(this.options);

        this.playing = {};
        this.getOscId = (() => {
            let next = 0;
            return (() => next++);
        })();

        this.connections = {
            'detune': null,
            'pan': null,
        };

        this.newOscillator = this.newOscillator.bind(this);
        this.play = this.play.bind(this);
        this.connectOscParams = this.connectOscParams.bind(this);
        this.connectParams = this.connectParams.bind(this);
        this.release = this.release.bind(this);
        this.stop = this.stop.bind(this);
        this.stopAll = this.stopAll.bind(this);
        this.addConnection = this.addConnection.bind(this);
        this.setOption = this.setOption.bind(this);
        this.getOption = this.getOption.bind(this);

    }

    /**
     * Creates new oscillator node
     * @private
     */
    newOscillator(frequency, destination, startTime) {
        const o = audioContext.createOscillator();
        o.type = this.options.waveform;
        o.frequency.value = frequency;
        o.connect(destination);
        o.start(startTime);
        return o;
    }

    /**
     * Creates new oscillators and envelope nodes and plays a note on them. Returns the id of the note played.
     * NOTE: If you don't provide a stopTime you must call the release or stop yourself and provide the id returned from this function
     * @param {number} frequency Frequency to play
     * @param {number} startTime When to play the note
     * @param {number} [stopTime] When to release the note. If this is not provided you must manually call release or stop on the Voice
     * @returns {number} Internal id for note. An id must be provided when calling release or stop
     */
    play(frequency, startTime, stopTime = 0) {

        const gain = this.options.useEnvelope ? this.gainEnv.newEnvelope(startTime) : audioContext.createGain();
        const panner = audioContext.createStereoPanner();
        panner.pan.value = this.options.pan;
        const compressor = audioContext.createDynamicsCompressor();

        let oscs = null;

        const actualFrequency = frequency * Math.pow(2, this.options.octave) * Math.pow(ALPHA, this.options.detune);

        if (this.options.unison > 1) {
            oscs = [];
            const minVal = this.options.unisonSpread / 2 * -1;
            const inc = this.options.unisonSpread / (this.options.unison - 1);
            for (let i = 0; i < this.options.unison; ++i) {
                const o = this.newOscillator(actualFrequency * Math.pow(ALPHA, minVal + inc * i), panner, startTime);
                oscs.push(o);
                this.connectOscParams(o);
            }
        } else {
            oscs = this.newOscillator(actualFrequency, panner, startTime);
            this.connectOscParams(oscs);
        }

        const finalGain = audioContext.createGain();
        finalGain.gain.value = this.options.gain;

        panner.connect(gain).connect(compressor).connect(finalGain).connect(this.options.destination || audioContext.destination);
        this.connectParams(panner, gain);

        const id = this.getOscId();
        this.playing[id] = [oscs, gain, this.options.useEnvelope];

        if (stopTime) {
            const releaseTime = this.options.useEnvelope ? gain.release(stopTime) + 0.01 : stopTime;
            stopOscs(oscs, releaseTime);
            setTimeout(() => delete this.playing[id], (releaseTime + 1) * 1000);
        }
        // else console.log('Undefined note length.');

        return id;
    }

    connectOscParams (osc) {
        if (this.connections.detune) {
            this.connections.detune.connect(osc.detune);
        }
    }

    connectParams(pan, gain) {
        if (this.connections.pan) {
            this.connections.pan.connect(pan.pan);
        }
    }

    /**
     * Start release schedule on note
     * @param {number} id Id of note that was returned by play()
     */
    release(id) {
        const osc = this.playing[id][0];
        const gain = this.playing[id][1];
        const env = this.playing[id][2];
        // console.log('release gain:',gain);
        const releaseTime = env ? gain.release(audioContext.currentTime) : audioContext.currentTime;
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
        for (const id of Object.keys(this.playing)) {
            const osc = this.playing[id][0];
            stopOscs(osc);
        }
        this.playing = {};
    }

    addConnection(param, source) {
        if (param in this.connections) {
            if (source instanceof LFO || source instanceof Envelope) {
                this.connections[param] = source;
            } else console.warn(`Source is NOT a valid connector!`);
        } else console.warn(`Parameter '${param}' is NOT a valid AudioParam!`);
    }

    setOption(key, value) {
        if (key in this.options) {
            this.options[key] = value;
        }
    }

    getOption(key) {
        return this.options[key];
    }

    /**
     * GainEnvelope getter
     * @returns {GainEnvelope}
     */
    getEnvelope() {
        return this.gainEnv;
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
        this.initialized = false;
        this.keysBound = false;
        this.voices = {};
        this.LFOs = {};
        this.playing = {};

        this.init = this.init.bind(this);
        this.stop = this.stop.bind(this);
        this.startSequence = this.startSequence.bind(this);
        this.newVoice = this.newVoice.bind(this);
        this.getVoice = this.getVoice.bind(this);
        this.getVoices = this.getVoices.bind(this);
        this.renameVoice = this.renameVoice.bind(this);
        this.removeVoice = this.removeVoice.bind(this);
        this.newLFO = this.newLFO.bind(this);
        this.getLFO = this.getLFO.bind(this);
        this.getLFOs = this.getLFOs.bind(this);
        this.renameLFO = this.renameLFO.bind(this);
        this.removeLFO = this.removeLFO.bind(this);
        this.keysOn = this.keysOn.bind(this);
    }

    init() {
        if (this.initialized) {console.log("S2Audio::init(): Already initialized!"); return;}
        audioContext = new AudioContext();

        // this.LFOtest = new LFO({frequency: 12, amplitude: 5});

        this.initialized = true;
    }

    /**
     * Stop all noise
     */
    stop() {
        for (name in this.voices) {
            this.voices[name].stopAll();
        }
        this.playing = {};
        releaseKeys();
    }

    newVoice(name='Voice') {
        const ge = new GainEnvelope();
        const fe = new FilterEnvelope();
        if (name in this.voices) name = name + '+';
        this.voices[name] = new Voice({destination: audioContext.destination});
        // this.voices[name].addConnection('detune', this.LFOtest);
        return name;
    }

    getVoice(name) {
        if (name in this.voices) return this.voices[name];
    }

    getVoices() {
        return this.voices;
    }

    renameVoice(name, newName) {
        if (newName in this.voices) newName = newName + '+';
        if (name in this.voices) {
            this.voices[newName] = this.voices[name];
        }
        return newName;
    }

    removeVoice(name) {
        if (name in this.voices) delete this.voices[name];
    }

    newLFO(name='LFO') {
        if (name in this.LFOs) name = name + '+';
        this.LFOs[name] = new LFO();
        // TEMP
        const lfos = Object.keys(this.LFOs);
        if (lfos.length === 2) {
            this.LFOs[lfos[0]].addConnection('frequency', this.LFOs[name]);
        } else {
            for (const v in this.voices) {
                console.log('v');
                console.log(v);
                this.voices[v].addConnection('pan', this.LFOs[name]);
            }
        }
        console.log(this.LFOs);
        // TEMP END
        return name;
    }

    getLFO(name) {
        if (name in this.LFOs) return this.LFOs[name];
    }

    getLFOs() {
        return this.LFOs;
    }

    renameLFO(name, newName) {
        if (newName in this.LFOs) newName = newName + '+';
        if (name in this.LFOs) {
            this.LFOs[newName] = this.LFOs[name];
        }
        return newName;
    }

    removeLFO(name) {
        if (name in this.LFOs) delete this.LFOs[name];
    }

    keysOn() {
        bindKeys(
            ((note) => {
                this.playing[note] = [];
                for (const name in this.voices) {
                    const v = this.voices[name];
                    this.playing[note].push([v, v.play(NOTES[note], audioContext.currentTime)]);
                }
            }).bind(this),
            ((note) => {
                const voices = this.playing[note];
                voices.forEach(v => v[0].release(v[1]));
            }).bind(this)
        );
    }

    keysOff() {
        unbindKeys();
    }

    startSequence() {
        const np = new NotePlanner(Sequences.testSequence, v, this.ctx, comp);

        np.start();
    }

    getAudioContext() {
        return audioContext;
    }
}

export default S2Audio;