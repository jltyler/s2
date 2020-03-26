import {ParamConnectionSnR} from './base.js';
import {newIdGenerator} from '../../Utility,js';

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

        this.connections = {
            'frequency': null,
            'amplitude': null,
        };
        this.playing = {};
        this.nextId = newIdGenerator();

        this.connect = this.connect.bind(this);
        this.newLFO = this.newNode.bind(this);
        this.setFrequency = this.setFrequency.bind(this);
        this.setAmplitude = this.setAmplitude.bind(this);
        this.connectFrequency = this.connectFrequency.bind(this);
        this.connectAmplitude = this.connectAmplitude.bind(this);
        this.addConnection = this.addConnection.bind(this);
        this.getConnection = this.getConnection.bind(this);
    }

    connect(destination) {
        this.newNode().connect(destination);
    }

    newNode() {
        const osc = this.context.createOscillator();
        osc.frequency.value = this.options.frequency;
        osc.type = this.options.waveform;
        this.connectFrequency(osc);

        const gain = this.context.createGain();
        gain.gain.value = this.options.amplitude;
        this.connectAmplitude(gain);

        osc.start();
        osc.connect(gain);

        const id = this.nextId();
        this.playing[id] = [osc, gain];
        return id;
    }

    getPlaying(id) {
        if (this.playing[id]) return this.playing[id][1];
    }

    getPlayingParam(id, param) {
        if (this.playing[id]) {
            if (param === 'frequency') return this.playing[id][0].detune;
            else if (param === 'amplitude') return this.playing[id][1].gain;
        }
    }

    setFrequency(freq) {
        this.options.frequency = freq;
    }

    setAmplitude(amp) {
        this.options.amplitude = amp;
    }

    setWaveform(wav) {
        this.options.waveform = wav;
    }

    connectFrequency(osc) {
        this.connectParam('frequency', osc.detune);
        if (this.connections.frequency) {
            this.connections.frequency.forEach((f) => {
                f.connect(osc.detune);
            });
        }
    }

    connectAmplitude(gain) {
        if (this.connections.amplitude) {
            this.connections.amplitude.forEach((a) => {
                a.connect(gain.gain);
            });
        }
    }
}

export default LFO;