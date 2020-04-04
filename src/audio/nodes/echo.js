import { newIdGenerator } from "../../Utility.js";
import { ParamConnectionSnR } from "./base.js";

const defaultEcho = {
    delay: 0.25,
    decay: 0.66
};

/**
 * Echo node with a decay and delay option. Sends signal to destination and dampened signal to delay node that loops back
 */
class Echo extends ParamConnectionSnR {
    /**
     * Creates new Echo node
     * @param {AudioContext} context AudioContext reference
     * @param {Object} options Options object
     * @param {number} options.decay Gain node value for dampening of signal. Default: 0.66
     * @param {number} options.delay Delay in seconds. Default: 0.25
     */
    constructor(context, options = {}) {
        super(context, {...defaultEcho, ...options});
        this.playing = {};
        this.connections.push('decay', 'delay');
        this.nextId = newIdGenerator();
    }

    newNode() {
        const input = this.context.createGain();
        const delay = this.context.createDelay(5);
        delay.delayTime.value = this.options.delay;
        const decay = this.context.createGain();
        decay.gain.value = this.options.decay;
        input.connect(delay).connect(decay).connect(input);

        const id = this.nextId();
        this.playing[id] = {input, delay, decay};
        return id;
    }

    getPlayingOut(id) {
        if (this.playing[id]) {
            return this.playing[id].input;
        }
    }

    getPlayingIn(id) {
        return this.getPlayingOut(id);
    }

    getPlayingParam(id, param) {
        if (this.playing[id]) {
            switch (param) {
                case "decay":
                    return this.playing[id].decay.gain;
                case "delay":
                    return this.playing[id].delay.delayTime;
            }
        }
    }

    stop(id, stopTime = 0) {
        if (this.playing[id]) {
            setTimeout(() => {
                this.playing[id].input.disconnect();
                delete this.playing[id];
            }, 10000);
        }
    }

    setDelay(delay) {
        this.options.delay = delay;
        for (const id in this.playing) {
            this.playing[id].delay.delayTime.value = delay;
        }
    }

    setDecay(decay) {
        this.options.decay = decay;
        for (const id in this.playing) {
            this.playing[id].decay.gain.value = decay;
        }
    }
}

export default Echo;