import {ParamConnectionReceiver} from './base.js';
import {getFinalDestination} from './util.js';
import { newIdGenerator } from '../../Utility.js';

const defaultFilterOptions = {
    type: 'lowpass',
    frequency: 22050,
    Q: 1,
    gain: 0,
    destination: null,
};

/**
 * Filter node wrapper for the BiquadFilterNode
 */
class Filter extends ParamConnectionReceiver {
    /**
     * Create a new filter
     * @param {string} name Name of the filter
     * @param {AudioContext} context AudioContext reference
     * @param {Object} options Filter options object
     * @param {string} options.type String representing filter type. Default: 'lowpass'
     * @param {number} options.frequency Target frequency of filter. Default: 22500
     * @param {number} options.Q Quality factor. Default: 1
     * @param {number} options.gain Gain (only used on shelf and peaking filters). Default: 0
     * @param {number} options.destination Where to output signal to. Default: null
     */
    constructor(context, options = {}) {
        super(context, {...defaultFilterOptions, ...options});

        this.connections = {
            'frequency': null,
            'Q': null,
        };

        this.nextId = newIdGenerator();
        this.playing = {};
    }

    getDestination() {
        return this.newFilter();
    }

    /** Manufactures new node, activates them, returns id of node
     * @returns {number}
    */
    newNode() {
        const filter = this.context.createBiquadFilter();
        filter.frequency.value = this.options.frequency;
        filter.Q.value = this.options.Q;
        filter.type = this.options.type;

        const id = this.nextId();
        this.playing[id] = filter;
        return id;
    }

    /**
     * Returns currently playing BiquadFilterNode for outgoing connections
     * @param {number} id ID of node
     * @returns {BiquadFilterNode}
     */
    getPlaying(id) {
        if (this.playing[id]) return this.playing[id];
    }

    /**
     * Returns currently playing AudioParam for incoming connections
     * @param {number} id ID of node
     * @param {string} param name of parameter
     * @returns {AudioParam}
     */
    getPlayingParam(id, param) {
        if (this.playing[id]) {
            switch (param) {
                case "frequency":
                    return this.playing[id].frequency;
                case "Q":
                    return this.playing[id].Q;
            }
        }
    }

    /**
     * Stops currently playing filter at time and sets timer to disconnect node and trash references
     * @param {number} id ID of node
     * @param {number} stopTime When to stop
     */
    stop(id, stopTime = 0) {
        if (stopTime === 0) stopTime = this.context.currentTime;
        if (this.playing[id]) {
            setTimeout(() => {
                this.playing[id].disconnect();
                delete this.playing[id];
            }, (stopTime - this.context.currentTime) * 1000 );
        }
    }

    /**
     * Set filter option (if it exists)
     * @param {('type'|'frequency'|'Q'|'gain'|'destination')} key Option to set
     * @param {number|boolean} value Value
     * @returns {boolean} True if option was set, false otherwise
     */
    setOption(key, value) {
        if (key in this.options) {
            this.options[key] = value;
            switch (key) {
                case 'frequency':
                case 'Q':
                case 'gain':
                    for(const id in this.playing) {
                        this.playing[id][key].value = value;
                    }
                    break;
                case 'type':
                    for(const id in this.playing) {
                        this.playing[id].type = value;
                    }
                    break;
                default:
                    break;
            }
            return true;
        } else return false;
    }
}

export default Filter;