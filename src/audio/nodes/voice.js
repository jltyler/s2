import {S2NodeBase, ParamConnectionReceiver, getFinalDestination} from './base.js';

const defaultGainEnvelope = {
    attack: 0.1,
    decay: 0.2,
    sustain: 1.0,
    release: 2.0,
};

/**
 * Gain envelope to schedule gain changes. Exclusively used by Voice atm. To be removed eventually
 */
class GainEnvelope extends S2NodeBase {
    /**
     * Create a new GainEnvelope
     * @param {Object} options GainEnvelope options object
     * @param {number} options.attack Attack (in seconds). Default: 0.1
     * @param {number} options.decay Decay (in seconds). Default: 0.2
     * @param {number} options.sustain Sustain level.  Default: 1.0
     * @param {number} options.release Release (in seconds). Default: 2.0
     */
    constructor(context, options = {}) {
        super(context, {...defaultGainEnvelope, ...options});

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

/**
 * Holds voice information and creates oscillators
 */
class Voice extends ParamConnectionReceiver {
    /**
     * Create a new voice
     * @param {AudioContext} context AudioContext reference
     * @param {Object} options Options object
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
        super(context, {...defaultVoiceOptions, ...options});
        // TODO CHANGE GAIN ENV TO USE GENERIC ENVELOPE GENERATOR
        this.gainEnv = new GainEnvelope(this.context, {});

        this.playing = {};
        this.getOscId = newIdGenerator();

        /**
         * Current connections that will be accessed when played
         * @var {Object} */
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

    /**
     * @private
     */
    connectOscParams(osc) {
        if (this.connections.detune) {
            this.connections.detune.forEach((d) => {
                d.connect(osc.detune);
            });
        }
    }

    /**
     * @private
     */
    connectParams(pan) {
        if (this.connections.pan) {
            this.connections.pan.forEach((p) => {
                p.connect(pan.pan);
            });
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

    /**
     * Set voice option (if it exists)
     * @param {('waveform'|'octave'|'detune'|'gain'|'pan'|'unison'|'unisonSpread'|'destination'|'useEnvelope'|'attack'|'decay'|'sustain'|'release')} key Option to set
     * @param {number|string|boolean} value New value
     * @returns {boolean} True if option was set, false otherwise
     */
    setOption(key, value) {
        if (key in this.options) {
            this.options[key] = value;
            return true;
        } else return false;
    }

    getEnvelope() {
        return this.gainEnv;
    }
}

export default Voice;