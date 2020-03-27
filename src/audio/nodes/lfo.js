import {ParamConnectionSnR} from './base.js';
import {newIdGenerator} from '../../Utility.js';

const defaultLFO = {
    waveform: 'sine',
    frequency: 1,
    amplitude: 10,
    singular: false
};

/**
 * Holds and creates oscillators that are used for connecting to AudioParams.
 * Can receive connections from other LFOs or other connection classes
 */
class LFO extends ParamConnectionSnR {
    /**
     * Create a new LFO
     * @param {string} name Name of the LFO
     * @param {AudioContext} context AudioContext reference
     * @param {Object} options LFO options object
     * @param {string} options.waveform String representing LFO waveform. Default: 'sine'
     * @param {number} options.frequency Oscillation frequency. Default: 1
     * @param {number} options.amplitude Output multiplier. Output ranges from (1 * amplitude) to (-1 * amplitude)  Default: 10
     */
    constructor(context, options = {}) {
        super(context, {...defaultLFO, ...options});

        this.connections.push('frequency', 'amplitude');
        this.playing = {};
        this.nextId = newIdGenerator();

        this.newNode = this.newNode.bind(this);
        this.setFrequency = this.setFrequency.bind(this);
        this.setAmplitude = this.setAmplitude.bind(this);
    }

    /** Manufactures new nodes, activates them, returns id of node pair
     * @returns {number}
    */
    newNode() {
        const osc = this.context.createOscillator();
        osc.frequency.value = this.options.frequency;
        osc.type = this.options.waveform;

        const gain = this.context.createGain();
        gain.gain.value = this.options.amplitude;

        osc.start();
        osc.connect(gain);

        const id = this.nextId();
        this.playing[id] = {osc, gain};
        return id;
    }

    /**
     * Returns currently playing GainNode for outgoing connections
     * @param {number} id ID of node pair
     * @returns {GainNode}
     */
    getPlaying(id) {
        if (this.playing[id]) return this.playing[id].gain;
    }

    /**
     * Returns currently playing GainNode for incoming connections
     * @param {number} id ID of node pair
     * @param {string} param name of parameter
     * @returns {AudioParam}
     */
    getPlayingParam(id, param) {
        if (this.playing[id]) {
            if (param === 'frequency') return this.playing[id].osc.detune;
            else if (param === 'amplitude') return this.playing[id].gain.gain;
        }
    }

    release(id, releaseTime = 0) {}

    /**
     * Stops currently playing oscillator at time and sets timer to disconnect nodes and trash references
     * @param {number} id ID of node pair
     * @param {number} stopTime When to stop
     */
    stop(id, stopTime = 0) {
        if (stopTime === 0) stopTime = this.context.currentTime;
        const o = this.playing[id];
        if (o) {
            o.osc.stop(stopTime);
            setTimeout(() => {
                o.osc.disconnect();
                o.gain.disconnect();
                delete this.playing[id];
            }, (stopTime - this.context.currentTime) * 1000);
        }
    }

    /**
     * Set frequency option and modify running oscillators
     * @param {number} freq frequency
     */
    setFrequency(freq) {
        this.options.frequency = freq;
        for(const id in this.playing) {
            this.playing[id].osc.frequency.value = freq;
        }
    }

    /**
     * Set amplitude option and modify running gain nodes
     * @param {number} amp Amplitude
     */
    setAmplitude(amp) {
        this.options.amplitude = amp;
        for(const id in this.playing) {
            this.playing[id].gain.gain.value = amp;
        }
    }

    /**
     * Set waveform option and modify running oscillators
     * @param {string} wav waveform name
     */
    setWaveform(wav) {
        this.options.waveform = wav;
        for(const id in this.playing) {
            this.playing[id].osc.type = wav;
        }
    }
}

export default LFO;