import Sequences from './sequences';
import {bind as bindKeys, unbind as unbindKeys, release as releaseKeys} from './keys';
import {NOTES, ALPHA} from './notes';
import {newIdGenerator} from '../Utility';

const AudioContext = window.AudioContext || window.webkitAudioContext;
const notePlannerInterval = 100; // Delay between planning notes
const notePlannerBuffer = .25; // Notes are plannesd this far in advance (in seconds)

const defaultEcho = {
    delay: 0.2,
    decay: 0.66
};

class Echo {
    constructor(context, options = {}) {
        this.context = context;
        this.options = Object.assign({}, defaultEcho, options);
        this.delay = this.context.createDelay();
        this.delay.delayTime.value = this.options.delay;
        this.gain = this.context.createGain();
        this.gain.gain.value = this.options.decay;
        this.delay.connect(this.gain).connect(this.delay);
        this.pass = this.context.createGain();
        this.pass.connect(this.delay);
    }

    getDestination() {
        return this.pass;
    }

    setDelay(delay) {
        this.options.delay = delay;
        this.delay.delayTime.value = delay;
    }

    setDecay(decay) {
        this.options.decay = decay;
        this.gain.gain.value = decay;
    }

    connect(node) {
        this.delay.connect(node);
        this.pass.connect(node);
    }

    connectSource(node) {
        node.connect(this.pass);
        // node.connect(this.delay);
    }

    disconnect(node) {
        this.delay.disconnect(node);
        this.pass.disconnect(node);
    }

    disconnectSource(node) {
        node.disconnect(this.pass);
        // node.disconnect(this.delay);
    }

    setName(name) {
        this.name = name;
    }
}

const getFinalDestination = (destination, context) => {
    if (destination) {
        if (destination instanceof AudioNode) return destination;
        else if (destination instanceof Echo || destination instanceof Filter) return destination.getDestination();
    }
    return context.destination;
}

const defaultEnvelope = {
    attack: 0.1,
    decay: 0.2,
    sustain: 1.0,
    length: 1.0, // sustain length if not useRelease
    release: 2.0,
    scale: 1.0, // maximum value
    base: 0.0, // minimum value
    useRelease: false
};

class Envelope {
    /**
     * Create a new Envelope
     * @param {string} name Name of the envelope
     * @param {Object} options Envelope options object
     * @param {number} options.attack Attack length
     * @param {number} options.decay Decay length
     * @param {number} options.sustain Sustain level
     * @param {number} options.length Sustain length
     * @param {number} options.release Release length
     * @param {number} options.scale Output multiplier
     * @param {number} options.base Base level value to start from
     */
    constructor(context, options = {}) {
        if (!context) console.error('Envelope::Envelope(): Invalid audioContext!');
        this.context = context;
        this.options = {...defaultEnvelope, ...options};
        // TODO TRASH RELEASE MAYBE
    }

    connect(destination) {
        const startTime = this.context.currentTime;
        const cs = this.context.createConstantSource();
        const o = this.options;
        cs.offset.setValueAtTime(o.base, startTime);
        cs.offset.linearRampToValueAtTime(o.base + o.scale, startTime + o.attack);
        cs.offset.linearRampToValueAtTime(o.base + (o.scale * o.sustain), startTime + o.attack + o.decay);
        if (o.useRelease) {
            this.attachRelease(cs);
        } else {
            cs.offset.linearRampToValueAtTime(o.base + (o.scale * o.sustain), startTime + o.attack + o.decay + o.length);
            cs.offset.linearRampToValueAtTime(o.base, startTime + o.attack + o.decay + o.length + o.release);
        }
        cs.connect(destination);
        cs.start();
        return cs;
    }

    /**
     * Attaches a release function that recieves a time to schedule the release envelope settings.
     * @param {GainNode} cs Node to attach the function to
     */
    attachRelease(cs) {
        cs.release = ((stopTime) => {
            cs.offset.cancelScheduledValues(stopTime);
            cs.offset.setValueAtTime(cs.offset.value, stopTime);
            stopTime += this.options.release;
            cs.offset.linearRampToValueAtTime(this.options.base, stopTime);
            return stopTime;
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

    setName(name) {
        this.name = name;
    }
}

const defaultLFO = {
    waveform: 'sine',
    frequency: 1,
    amplitude: 10,
    singular: false
};

/** =========================================================================
 * Holds and creates oscillators that are used for connecting to AudioParams.
 * Can receive connections from other LFOs or other connection classes
 */
class LFO {
    /**
     * Create a new LFO
     * @param {string} name Name of the LFO
     * @param {Object} options LFO options object
     * @param {string} options.waveform String representing LFO waveform. Default: 'sine'
     * @param {number} options.frequency Oscillation frequency. Default: 1
     * @param {number} options.amplitude Output multiplier. Output ranges from (1 * amplitude) to (-1 * amplitude)  Default: 10
     */
    constructor(context, options = {}) {
        if (!context) console.error('LFO::LFO(): Invalid audioContext!');
        this.context = context;
        this.options = Object.assign({}, defaultLFO, options);

        // If singular envelope is selected these will hold the nodes' references
        // TODO TRASH SINGULAR STUFF
        this.osc = null;
        this.gain = null;
        this.options.singular = false;

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
        this.getConnection = this.getConnection.bind(this);
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
        this.osc = this.context.createOscillator();
        this.osc.frequency.value = this.options.frequency;
        this.connectFrequency(this.osc);

        this.gain = this.context.createGain();
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
        const osc = this.context.createOscillator();
        osc.frequency.value = this.options.frequency;
        this.connectFrequency(osc);

        const gain = this.context.createGain();
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
                return true;
            } else {
                console.warn(`Source is NOT a valid connector!`);
                return false;
            }
        } else {
            console.warn(`Parameter '${param}' is NOT a valid connection receiver!`);
            return false;
        }
    }

    getConnection(param) {
        if (param in this.connections) {
            return this.connections[param];
        }
    }

    getConnections() {
        return this.connections;
    }

    removeConnection(param) {
        if (param in this.connections) {
            this.connections[param] = null;
        }
    }

    setName(name) {
        this.name = name;
    }
}

const defaultGainEnvelope = {
    attack: 0.1,
    decay: 0.2,
    sustain: 1.0,
    release: 2.0,
};

/** =========================================================================
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
    constructor(context, options = {}) {
        if (!context) console.error('GainEnvelope::GainEnvelope(): Invalid audioContext!');
        this.context = context;
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
        const gain = this.context.createGain();
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

    setName(name) {
        this.name = name;
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

const defaultFilterOptions = {
    type: 'lowpass',
    frequency: 22050,
    Q: 1,
    gain: 0,
    destination: null,
}

class Filter {
    /**
     * Create a new filter
     * @param {string} name Name of the filter
     * @param {Object} options Filter options object
     * @param {string} options.type String representing filter type. Default: 'lowpass'
     * @param {number} options.frequency Target frequency of filter. Default: 22500
     * @param {number} options.Q Quality factor. Default: 1
     * @param {number} options.gain Gain (only used on shelf and peaking filters). Default: 0
     * @param {number} options.destination Where to output signal to. Default: null
     */
    constructor(context, options = {}) {
        if (!context) console.error('Filter::Filter(): Invalid audioContext!');
        this.context = context;
        this.options = Object.assign({}, defaultFilterOptions, options);

        this.connections = {
            'frequency': null,
            'Q': null,
        };
    }

    connectFrom(source) {
        source.connect(this.newFilter());
    }

    getDestination() {
        return this.newFilter();
    }

    newFilter() {
        const filter = this.context.createBiquadFilter();
        filter.frequency.value = this.options.frequency;
        filter.Q.value = this.options.Q;
        filter.type = this.options.type;
        filter.connect(getFinalDestination(this.options.destination, this.context));
        this.connectParams(filter);
        return filter;
    }

    addConnection(param, source) {
        if (param in this.connections) {
            if (source instanceof LFO || source instanceof Envelope) {
                this.connections[param] = source;
                if (this.options.singular) {
                    this.connectFrequency(this.osc);
                    this.connectAmplitude(this.gain);
                }
                return true;
            } else {
                console.warn(`Source is NOT a valid connector!`);
                return false;
            }
        } else {
            console.warn(`Parameter '${param}' is NOT a valid connection receiver!`);
            return false;
        }
    }

    getConnection(param) {
        if (param in this.connections) {
            return this.connections[param];
        }
    }

    getConnections() {
        return this.connections;
    }

    removeConnection(param) {
        if (param in this.connections) {
            this.connections[param] = null;
        }
    }

    connectParams(filter) {
        if (this.connections.frequency) {
            this.connections.frequency.connect(filter.detune);
        }
        if (this.connections.Q) {
            this.connections.Q.connect(filter.Q);
        }
    }

    setOption(key, value) {
        if (key in this.options) {
            this.options[key] = value;
        }
    }

    getOption(key) {
        return this.options[key];
    }

    setName(name) {
        this.name = name;
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
    destination: null,
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
        osc.forEach((o) => o.stop(stopTime));
    } else {
        osc.stop(stopTime);
    }
};

/** =========================================================================
 * Holds voice information and creates oscillators
 */
class Voice {
    /**
     * Create a new voice
     * @param {string} name Name of the voice
     * @param {Object} options Voice options object
     * @param {string} options.waveform String representing waveform type. Default: 'sawtooth'
     * @param {number} options.octave Increase or decrease by octaves. Default: 0
     * @param {number} options.detune Detune measured in semitones. Default: 0
     * @param {number} options.gain Gain of voice. Default: 1.0
     * @param {number} options.pan Pan to left or right. Default: 0
     * @param {number} options.unison How many seperate oscillators to use for unison. Default: 1
     * @param {number} options.unisonSpread How far the oscillator frequencies should be spread in semitones. Default: 1
     * @param {number} options.destination Where to output noise to. Default: null
     * @param {number} options.useEnvelope Use the envelope for the gain? Default: false
     * @param {number} options.attack Attack length. Default: 0.1
     * @param {number} options.decay Decay length. Default: 0.1
     * @param {number} options.sustain Sustain level. Default: 1.0
     * @param {number} options.release Release length. Default: 1.5
     */
    constructor(context, options = {}) {
        if (!context) console.error('Voice::Voice(): Invalid audioContext!');
        this.context = context;
        this.options = Object.assign({}, defaultVoiceOptions, options);
        this.gainEnv = new GainEnvelope(this.context, {});
        console.log(this.options);

        this.playing = {};
        this.getOscId = newIdGenerator();

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
        this.removeConnection = this.removeConnection.bind(this);
        this.setOption = this.setOption.bind(this);
        this.getOption = this.getOption.bind(this);
        this.getEnvelope = this.getEnvelope.bind(this);

    }

    /**
     * Creates new oscillator node
     * @private
     */
    newOscillator(frequency, destination, startTime) {
        const o = this.context.createOscillator();
        o.type = this.options.waveform;
        o.frequency.value = frequency;
        this.connectOscParams(o);
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
        const opt = this.options;
        const gain = opt.useEnvelope ? this.gainEnv.newEnvelope(startTime) : this.context.createGain();
        const panner = this.context.createStereoPanner();
        panner.pan.value = opt.pan;
        const compressor = this.context.createDynamicsCompressor();

        let oscs = null;

        const actualFrequency = frequency * Math.pow(2, opt.octave) * Math.pow(ALPHA, opt.detune);

        if (opt.unison > 1) {
            oscs = [];
            const minVal = opt.unisonSpread / 2 * -1;
            const inc = opt.unisonSpread / (opt.unison - 1);
            for (let i = 0; i < opt.unison; ++i) {
                const o = this.newOscillator(actualFrequency * Math.pow(ALPHA, minVal + inc * i), panner, startTime);
                oscs.push(o);
            }
        } else {
            oscs = this.newOscillator(actualFrequency, panner, startTime);
        }

        const finalGain = this.context.createGain();
        finalGain.gain.value = opt.gain;

        const finalDestination = getFinalDestination(opt.destination, this.context);
        // this.context.destination;
        // if (opt.destination) {
        //     if (opt.destination instanceof Echo || opt.destination instanceof Filter) {
        //         finalDestination = opt.destination.getDestination();
        //     } else finalDestination = opt.destination;
        // }

        panner.connect(gain).connect(compressor).connect(finalGain).connect(finalDestination);
        this.connectParams(panner, gain);

        const id = this.getOscId();
        this.playing[id] = [oscs, gain, opt.useEnvelope];

        if (stopTime) {
            const releaseTime = opt.useEnvelope ? gain.release(stopTime) + 0.01 : stopTime;
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

    connectParams(pan) {
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

        const releaseTime = env ? gain.release(this.context.currentTime) : this.context.currentTime;
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
                return true;
            } else {
                console.warn(`Source is NOT a valid connector!`);
                return false;
            }
        } else {
            console.warn(`Parameter '${param}' is NOT a valid connection receiver!`);
            return false;
        }
    }

    getConnection(param) {
        if (param in this.connections) {
            return this.connections[param];
        }
    }

    getConnections() {
        return this.connections;
    }

    removeConnection(param) {
        if (param in this.connections) {
            this.connections[param] = null;
        }
    }

    setOption(key, value) {
        if (key in this.options) {
            this.options[key] = value;
        }
    }

    getOption(key) {
        return this.options[key];
    }

    getEnvelope() {
        return this.gainEnv;
    }

    setName(name) {
        this.name = name;
    }
}

/** ===========================================================================
 * Uses a sequence to play notes on a Voice
 */
class NotePlanner {
    /**
     * Create a new NotePlanner
     * @param {NoteSequence} sequence Sequence of notes to play
     * @param {Voice} voice Voice to play the notes with
     * @param {AudioDestinationNode} destination Final destination of sound signal
     */
    constructor(context, sequence, voice, destination) {
        this.context = context;
        this.voice = voice;
        this.sequence = [...sequence];
        this.destination = destination;

        this.remaining = [];
        this.startTime = this.context.currentTime;
        this.running = false;
        this.plan = this.plan.bind(this);
    }

    /**
     * Start playing the sequence right now
     */
    start () {
        this.running = true;
        this.startTime = this.context.currentTime;
        this.remaining = [...this.sequence];
        this.plan();
    }

    /**
     * Plan the notes
     * @private
     */
    plan() {

        if (!this.remaining.length) return;
        let note = this.remaining[0];
        let i = 0;
        while (note && note.start + this.startTime < this.context.currentTime + notePlannerBuffer) {

            this.voice.play(note.freq, this.destination, this.startTime + note.start, this.startTime + note.stop);

            ++i;
            note = this.remaining[i];
        }

        console.log('Planned ' + i + ' notes.');

        this.remaining.splice(0, i);

        if (this.running)
            setTimeout(this.plan, notePlannerInterval);
    }

    stop() {
        this.running = false;
    }

    setName(name) {
        this.name = name;
    }
}

/** ===========================================================================
 * Main audio controller for s2. You must call init() after creating this and before anything else
 */
class S2Audio {
    constructor() {
        this.initialized = false;
        this.keysBound = false; // Are keyboard events bound to play notes?
        this.voices = {}; // Holds Voice references with named keys
        this.LFOs = {}; // LFO references
        this.envelopes = {}; // Envelope references
        this.filters = {}; // Filter references
        this.nodes = {}; // Nodes with the generic interface
        this.playing = {}; // Dict for current notes being played (by keyboard)
        this.paramConnectionsByParam = {}; // Current connected params
        this.paramConnectionsBySource = {}; // I'm desperate to think of another way of doing this
        this.audioConnections = {};

        // In case these are called from DOM events
        this.init = this.init.bind(this);
        this.stop = this.stop.bind(this);

        this.keysOn = this.keysOn.bind(this);
        this.keysOff = this.keysOff.bind(this);
    }

    /**
     * Creates AudioContext instance and sets initialized bool.
     * User interaction is required before AudioContext will work properly
     */
    init() {
        if (this.initialized) {console.log("S2Audio::init(): Already initialized!"); return;}
        this.context = new AudioContext();

        // const name = this.newNode('TestEcho', Echo, {delay: 0.8, decay: 0.55});
        // this.testEcho = this.getFromName(name);
        // // const fdest = this.testEcho.getDestination();
        // const fdest = this.context.destination;
        // this.testEcho.connect(fdest);

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

    /**
     * Get reference to s2 node from name. Returns null if name isn't found
     * @param {string} name Name of node
     */
    getFromName(name) {
        if (name in this.voices) return this.voices[name];
        else if (name in this.LFOs) return this.LFOs[name];
        else if (name in this.envelopes) return this.envelopes[name];
        else if (name in this.filters) return this.filters[name];
        else if (name in this.nodes) return this.nodes[name];
        else return null;
    }

    getTypeList(name) {
        if (name in this.voices) return this.voices;
        else if (name in this.LFOs) return this.LFOs;
        else if (name in this.envelopes) return this.envelopes;
        else if (name in this.filters) return this.filters;
        else if (name in this.nodes) return this.nodes;
        else return null;
    }

    getAllNodes() {
        return {
            voices: this.voices,
            LFOs: this.LFOs,
            envelopes: this.envelopes,
            filters: this.filters,
            nodes: this.nodes
        };
    }

    /**
     * Returns unique name by appending to name string repeatedly
     * @param {string} name Starting name
     * @param {string} append String to append
     */
    firstNameAvailable(name, append = '+') {
        while(this.getFromName(name)) {
            name = '' + name + append;
        }
        return name;
    }

    newNode(name = 'Node', type=Echo, options = {}) {
        name = this.firstNameAvailable(name);
        this.nodes[name] = new type(this.context, options);
        this.nodes[name].setName(name);
        return name;
    }

    getNodesOfType(type) {
        const o = {};
        for (name in this.nodes) {
            const node = this.nodes[name];
            if (node instanceof type) {
                o[name] = node;
            }
        }
        return o;
    }

    getVoice(name) {
        if (name in this.voices) return this.voices[name];
    }

    getVoices() {
        return this.voices;
    }

    rename(name, newName) {
        const l = this.getTypeList(name);
        if (l) {
            newName = firstNameAvailable(newName);
            l[newName] = l[name];
            delete l[name];
        }
    }

    remove(name) {
        const l = this.getTypeList(name);
        if (l) {
            delete l[name];
        }
    }


    /**
     * Create a new named voice and store it in this.voices.
     * If a name already exists the name will be appended with a '+'
     * @param {string} name Name of the voice
     * @returns {string} Final name of voice
     */
    newVoice(name = 'Voice', options = {}) {
        name = this.firstNameAvailable(name);
        this.voices[name] = new Voice(this.context, options);
        this.voices[name].setName(name);
        return name;
    }

    /**
     * Get Voice reference from name (if it exists)
     * @param {string} name Name of voice
     * @returns {Voice} Voice object reference
     */
    getVoice(name) {
        if (name in this.voices) return this.voices[name];
    }

    getVoices() {
        return this.voices;
    }

    removeVoice(name) {
        if (name in this.voices) {
            delete this.voices[name];
        }
    }

    /**
     * Create a new named LFO and store it in this.LFOs.
     * If a name already exists the name will be appended with a '+'
     * @param {string} name Name of the LFO
     * @returns {string} Final name of LFO
     */
    newLFO(name = 'LFO', options = {}) {
        name = this.firstNameAvailable(name);
        this.LFOs[name] = new LFO(this.context, options);
        this.LFOs[name].setName(name);
        return name;
    }

    /**
     * Get LFO reference from name (if it exists)
     * @param {string} name Name of LFO
     * @returns {LFO} LFO object reference
     */
    getLFO(name) {
        if (name in this.LFOs) return this.LFOs[name];
    }

    getLFOs() {
        return this.LFOs;
    }

    removeLFO(name) {
        if (name in this.LFOs) delete this.LFOs[name];
    }

    /**
     * Create a new named Envelope and store it in this.envelopes.
     * If a name already exists the name will be appended with a '+'
     * @param {string} name Name of the Envelope
     * @returns {string} Final name of Envelope
     */
    newEnvelope(name = 'Envelope', options = {}) {
        name = this.firstNameAvailable(name);
        this.envelopes[name] = new Envelope(this.context, options);
        this.envelopes[name].setName(name);
        return name;
    }

    /**
     * Get Envelope reference from name (if it exists)
     * @param {string} name Name of Envelope
     * @returns {Envelope} Envelope object reference
     */
    getEnvelope(name) {
        if (name in this.envelopes) return this.envelopes[name];
    }

    getEnvelopes() {
        return this.envelopes;
    }

    removeEnvelope(name) {
        if (name in this.envelopes) delete this.envelopes[name];
    }

    /**
     * Create a new named Filter and store it in this.filters.
     * If a name already exists the name will be appended with a '+'
     * @param {string} name Name of the Filter
     * @returns {string} Final name of Filter
     */
    newFilter(name = 'Filter', options = {}) {
        name = this.firstNameAvailable(name);
        this.filters[name] = new Filter(this.context, options);
        this.filters[name].setName(name);
        return name;
    }

    /**
     * Get Filter reference from name (if it exists)
     * @param {string} name Name of Filter
     * @returns {Filter} Filter object reference
     */
    getFilter(name) {
        if (name in this.filter) return this.filter[name];
    }

    getFilters() {
        return this.filters;
    }

    removeFilter(name) {
        if (name in this.filters) delete this.filters[name];
    }

    newEcho(name = 'Echo', options = {}) {
        return this.newNode(name, Echo, options);
    }

    getEchoes() {
        return this.getNodesOfType(Echo);
    }

    // User interface information and config functions
    /**
     * Return an array of strings representing currently available connection receivers
     * @param {string} exclude Name to exclude
     */
    getAvailableConnections(exclude) {
        const c = [];
        const combo = [
            ...Object.keys(this.voices),
            ...Object.keys(this.LFOs),
            ...Object.keys(this.filters)
        ];
        for (const name of combo) {
            if (name === exclude) continue;
            const connections = this.getFromName(name).getConnections();
            for (const param in connections) {
                c.push(name + '.' + param);
            }
        }
        return c;
    }

    /**
     * Registers a connection from source to destination's paramter
     * @param {string} name Destination name
     * @param {string} param Destination parameter to affect
     * @param {string} sourceName Source name
     */
    addConnection(name, param, sourceName) {
        console.log('addConnection', name, param, sourceName);
        if (this.getConnectionByParam(name, param)) this.removeConnectionByParam(name, param);
        if (this.getConnectionBySource(sourceName)) this.removeConnectionBySource(sourceName);
        const source = this.getFromName(sourceName);
        const receiver = this.getFromName(name);
        if (source && receiver) {
            if (receiver.addConnection(param, source)) {
                this.paramConnectionsByParam[name + '.' + param] = sourceName;
                this.paramConnectionsBySource[sourceName] = {name, param};
            } else console.warn('Failed connection: Rejected by receiver!', receiver);
        } else console.warn('Failed connection: Invalid reference!', source, receiver);
    }

    getConnectionsByParam() {
        return this.paramConnectionsByParam;
    }

    getConnectionsBySource() {
        return this.paramConnectionsBySource;
    }

    getConnectionBySource(sourceName) {
        if (sourceName in this.paramConnectionsBySource) {
            return this.paramConnectionsBySource[sourceName];
        } else return null;
    }

    getConnectionByParam(name, param) {
        const joined = name + '.' + param;
        if (joined in this.paramConnectionsByParam) {
            return this.paramConnectionsByParam[joined];
        } else return null;
    }

    removeConnectionByParam(name, param) {
        console.log('removeConnectionByParam', name, param);
        const joined = name + '.' + param;
        if (joined in this.paramConnectionsByParam) {
            this.getFromName(name).removeConnection(param);
            delete this.paramConnectionsBySource[this.paramConnectionsByParam[joined]];
            delete this.paramConnectionsByParam[joined];
        }
    }

    removeConnectionBySource(sourceName) {
        console.log('removeConnectionBySource', sourceName);
        if (sourceName in this.paramConnectionsBySource) {
            const r = this.paramConnectionsBySource[sourceName];
            this.getFromName(r.name).removeConnection(r.param);
            delete this.paramConnectionsByParam[r.name + '.' + r.param];
            delete this.paramConnectionsBySource[sourceName];
        }
    }

    getAvailableAudioConnections(exclude) {
        const c = [];
        const combo = [...Object.keys(this.filters), ...Object.keys(this.nodes)];
        for (const name of combo) {
            if (name === exclude) continue;
            c.push(name);
        }
        return c;
    }

    addAudioConnection(source, destination) {
        const s = this.getFromName(source);
        const d = this.getFromName(destination);
        if ( s && d ) {
            this.audioConnections[source] = destination;
            s.setOption('destination', d);
        }
    }

    getAudioConnections() {
        return this.audioConnections;
    }

    getAudioConnection(name) {
        if (name in this.audioConnections) {
            return this.audioConnections[name];
        } else return null;
    }

    getAudioConnectionBySource(name) {
        if (name in this.audioConnections) {
            return this.audioConnections[name];
        } else return null;
    }

    getAudioConnectionsByDestination(name) {
        const sources = [];
        for (const key in this.audioConnections) {
            if (this.audioConnections[key] === name) sources.push(key);
        }
        return sources;
    }

    removeAudioConnection(name) {
        if (name in this.audioConnections) {
            this.getFromName(name).setOption('destination', null);
            delete this.audioConnections[name];
        }
    }

    /**
     * Binds play functions to keyboard events
     */
    keysOn() {
        bindKeys(
            ((note) => {
                this.playing[note] = [];
                for (const name in this.voices) {
                    const v = this.voices[name];
                    this.playing[note].push([v, v.play(NOTES[note], this.context.currentTime)]);
                }
            }).bind(this),
            ((note) => {
                const voices = this.playing[note];
                voices.forEach((v) => v[0].release(v[1]));
            }).bind(this)
        );
    }

    /**
     * Unbinds functions from keyboard events
     */
    keysOff() {
        unbindKeys();
    }

    // BIN THIS (soon)
    startSequence() {
        const np = new NotePlanner(Sequences.testSequence, v, this.context, comp);
        np.start();
    }

    getAudioContext() {
        return this.context;
    }
}

export default S2Audio;