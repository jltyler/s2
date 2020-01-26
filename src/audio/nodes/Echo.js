const defaultEcho = {
    delay: 0.25,
    decay: 0.66
};

/**
 * Echo node with a decay and delay option. Sends signal to destination and dampened signal to delay node that loops back
 */
class Echo {
    /**
     * Creates new Echo node
     * @param {AudioContext} context AudioContext reference
     * @param {Object} options Options object
     * @param {number} options.decay Gain node value for dampening of signal. Default: 0.66
     * @param {number} options.delay Delay in seconds. Default: 0.25
     */
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

export default Echo;