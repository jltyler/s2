import {ParamConnectionReceiver} from './base.js';
import {getFinalDestination} from './util.js';

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

    connectParams(filter) {
        if (this.connections.frequency) {
            this.connections.frequency.forEach((f) => {
                f.connect(filter.detune);
            });
        }
        if (this.connections.Q) {
            this.connections.Q.forEach((q) => {
                q.connect(filter.Q);
            });
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
            return true;
        } else return false;
    }
}

export default Filter;