import {S2NodeBase, ParamConnectionReceiver} from './base.js';
import {waves, ALPHA} from './util.js';
import {newIdGenerator} from '../../Utility.js';

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
    osc.forEach((o) => {
        o.stop(stopTime);
        o.disconnect();
    });
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

        /** Object with note IDs as keys and arrays as values. Array contains: oscillator nodes array, gain node, gain envelope boolean, panner node */
        this.playing = {};
        this.getOscId = newIdGenerator();

        this.connections.push('detune', 'pan');

        this.newOscillator = this.newOscillator.bind(this);
        this.play = this.play.bind(this);
        this.release = this.release.bind(this);
        this.stop = this.stop.bind(this);
        this.stopAll = this.stopAll.bind(this);
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
        if (this.options.waveform === 'crazy') {
            // console.log('waves.crazy:', waves.crazy);
            o.setPeriodicWave(waves.crazy);
        } else o.type = this.options.waveform;
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
        const opt = this.options;
        const gain = opt.useEnvelope ? this.gainEnv.newEnvelope(startTime) : this.context.createGain();
        const panner = this.context.createStereoPanner();
        panner.pan.value = opt.pan;
        const compressor = this.context.createDynamicsCompressor();

        const oscs = [];

        const actualFrequency = frequency * Math.pow(2, opt.octave) * Math.pow(ALPHA, opt.detune);

        if (opt.unison > 1) {
            const minVal = opt.unisonSpread / 2 * -1;
            const inc = opt.unisonSpread / (opt.unison - 1);
            for (let i = 0; i < opt.unison; ++i) {
                const o = this.newOscillator(actualFrequency * Math.pow(ALPHA, minVal + inc * i), panner, startTime);
                oscs.push(o);
            }
        } else {
            oscs.push(this.newOscillator(actualFrequency, panner, startTime));
        }

        // HORRIBLE HACKY SHIT
        oscs.forEach((o) => o.baseFrequency = frequency);

        const finalGain = this.context.createGain();
        finalGain.gain.value = opt.gain;

        panner.connect(gain).connect(compressor).connect(finalGain);

        const id = this.getOscId();
        this.playing[id] = [oscs, gain, opt.useEnvelope, panner, finalGain];

        if (stopTime) {
            const releaseTime = opt.useEnvelope ? gain.release(stopTime) + 0.001 : stopTime;
            stopOscs(oscs, releaseTime);
            setTimeout(() => delete this.playing[id], (releaseTime + 1) * 1000);
        }

        return id;
    }

    /**
     * Returns currently playing AudioParam for incoming connections
     * @param {number} id ID of node
     * @param {string} param name of parameter
     * @returns {AudioParam}
     */
    getPlayingParam(id, param) {
        // HACK THE PLANET!!! HACK THE PLANET!!!
        if (this.playing[id]) {
            switch (param) {
                case "detune":
                    return this.playing[id][0].map((o) => o.detune);
                case "pan":
                    return this.playing[id][3].pan;
            }
        } else console.warn(`Voice::getPlayingParam: Invalid ID "${id}"`);

    }

    /**
     * Get final gain node for use with outgoing audio connections
     * @param {number} id ID of node
     * @returns {GainNode}
     */
    getPlayingOut(id) {
        if (this.playing[id]) {
            return this.playing[id][4];
        }
    }


    /**
     * Start release schedule on note
     * @param {number} id Id of note that was returned by play()
     * @returns {number} release time of note
     */
    release(id) {
        const osc = this.playing[id][0];
        const gain = this.playing[id][1];
        const env = this.playing[id][2];

        const releaseTime = env ? gain.release(this.context.currentTime) : this.context.currentTime;
        stopOscs(osc, releaseTime);
        if (env) setTimeout(() => delete this.playing[id], (releaseTime - this.context.currentTime) * 1000);
        else delete this.playing[id];
        return releaseTime;
    }

    /**
     * Immediately stop note
     * @param {number} id Id of note that was returned by play()
     */
    stop(id, stopTime = 0) {
        const osc = this.playing[id][0];
        stopOscs(osc, stopTime);
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
            this.changePlayingOscillators(key, value);
            return true;
        } else return false;
    }

    changePlayingOscillators(parameter, value) {
        const opt = this.options;
        switch (parameter) {
            case 'waveform':
                for (const n in this.playing) {
                    this.playing[n][0].forEach((o) => o.type = value);
                }
                break;
            case 'frequency':
            case 'octave':
            case 'detune':
            case 'unisonSpread':
                const unisonMin = opt.unisonSpread / 2 * -1;
                const inc = opt.unisonSpread / (opt.unison - 1);
                for (const n in this.playing) {
                    const freq = this.playing[n][0][0].baseFrequency * Math.pow(2, opt.octave) * Math.pow(ALPHA, opt.detune);
                    if (this.playing[n][0].length > 1) {
                        this.playing[n][0].forEach((o, i) => o.frequency.value = freq * Math.pow(ALPHA, unisonMin + inc * i));
                    } else {
                        this.playing[n][0][0].frequency.value = freq;
                    }
                }
                break;
            case 'gain':
                for (const n in this.playing) {
                    this.playing[n][1].gain.value = value;
                }
                break;
            case 'pan':
                for (const n in this.playing) {
                    this.playing[n][3].pan.value = value;
                }
                break;
            default:
                break;
        }
    }

    getEnvelope() {
        return this.gainEnv;
    }
}

export default Voice;