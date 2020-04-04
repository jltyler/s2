import {ParamConnectionSource} from './base.js';
import { newIdGenerator } from '../../Utility.js';

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

/**
 * Envelope class that generates a single envelope that fires immediately
 */
class Envelope extends ParamConnectionSource {
    /**
     * Create a new Envelope
     * @param {string} name Name of the envelope
     * @param {AudioContext} context AudioContext reference
     * @param {Object} options Envelope options object
     * @param {number} options.attack Attack length
     * @param {number} options.decay Decay length
     * @param {number} options.sustain Sustain level
     * @param {number} options.length Sustain length
     * @param {number} options.release Release length
     * @param {number} options.scale Output multiplier. Value when envelope at 1.0
     * @param {number} options.base Base level value to start from
     */
    constructor(context, options = {}) {
        super(context, {...defaultEnvelope, ...options});

        this.playing = {};
        this.nextId = newIdGenerator();
    }

    /** Manufactures new node, activates them, returns id of node
     * @returns {number}
    */
    newNode() {
        const startTime = this.context.currentTime;
        const cs = this.context.createConstantSource();
        const o = this.options;
        cs.offset.setValueAtTime(o.base, startTime);
        cs.offset.linearRampToValueAtTime(o.base + o.scale, startTime + o.attack);
        cs.offset.linearRampToValueAtTime(o.base + (o.scale * o.sustain), startTime + o.attack + o.decay);
        cs.start();

        const id = this.nextId();
        this.playing[id] = cs;
        return id;
    }

    /**
     * Returns currently playing ConstantSourceNode for outgoing connections
     * @param {number} id ID of node
     * @returns {ConstantSourceNode}
     */
    getPlaying(id) {
        if (this.playing[id]) return this.playing[id];
    }

    /**
     * Starts release of currently playing source node
     * @param {number} id ID of node
     * @param {number} releaseTime When to release
     * @returns {number} Time that source value will reach minimum
     */
    release(id, releaseTime = 0) {
        if (releaseTime === 0) releaseTime = this.context.currentTime;
        if (this.playing[id]) {
            const cs = this.playing[id];
            const hold = cs.offset.value;
            cs.offset.cancelScheduledValues(releaseTime);
            cs.offset.setValueAtTime(hold, releaseTime);
            cs.offset.linearRampToValueAtTime(this.options.base, releaseTime + this.options.release);
            return releaseTime + this.options.release;
        }
    }

    /**
     * Stops currently playing source node at time and sets timer to disconnect node and trash references
     * @param {number} id ID of node
     * @param {number} stopTime When to stop
     */
    stop(id, stopTime = 0) {
        if (stopTime === 0) stopTime = this.context.currentTime;
        if (this.playing[id]) {
            const cs = this.playing[id];
            cs.stop(stopTime);
            setTimeout(() => {
                cs.disconnect();
                delete this.playing[id];
            }, (stopTime - this.context.currentTime) * 1000);
        }
    }
}

export default Envelope;