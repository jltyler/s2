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

    newNode() {
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
        cs.start();

        const id = this.nextId();
        this.playing[id] = cs;
        return id;
    }

    getPlaying(id) {
        if (this.playing[id]) return this.playing[id];
    }

    release(id, releaseTime = 0) {
        if (releaseTime === 0) releaseTime = this.context.currentTime;
        if (this.playing[id]) {
            const cs = this.playing[id];
            cs.offset.cancelScheduledValues(releaseTime);
            cs.offset.setValueAtTime(cs.offset.value, releaseTime);
            cs.offset.linearRampToValueAtTime(this.options.base, releaseTime + this.options.release);
            return releaseTime + this.options.release;
        }
    }

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
}

export default Envelope;