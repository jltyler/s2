/**
 * Base node with common functionality
 */
class S2NodeBase {
    /**
     * Create a new base node
     * @param {AudioContext} context Reference to AudioContext instance
     * @param {Object} options Options object
     */
    constructor(context, options = {}) {
        this.setName(`S2NodeBase ${(() => {
            let numero = -1;
            return () => ++numero;
        })()}`);
        if (context && context instanceof AudioContext) {
            this.context = context;
        } else {
            console.warn('S2NodeBase::S2NodeBase() Invalid AudioContext!');
            this.context = null;
        }
        this.options = {...options};
    }

    /**
     * Sets the name of this node
     * @param {string} newName New name
     */
    setName(newName) {
        this.name = newName;
    };

    /**
     * Sets a value in the options object if the option exists
     * @param {string} key Option name
     * @param {*} value Value to set
     */
    setOption(key, value) {
        if (key in this.options) {
            this.options[key] = value;
        }
    }

    /**
     * Set multiple options' values with an object
     * @param {Object} optionsObject Object with key vclues pairs for options
     */
    setOptions(optionsObject) {
        for (key in optionsObject) {
            this.options[key] = optionsObject[key];
        }
    }

    /**
     * Gets value of option
     * @param {string} key Option name
     */
    getOption(key) {
        if (key in this.options) {
            return this.options[key];
        }
    }

    getPlaying(id) {
        console.warn('S2NodeBase::getPlaying() Unimplemented! This should be overloaded!');
    }

    getPlayingParam(id, param) {
        console.warn('S2NodeBase::getPlayingParam() Unimplemented! This should be overloaded!');
    }

    release(id, releaseTime = 0) {
        // console.warn('S2NodeBase::release() Unimplemented! This should be overloaded!');
    }
}

/**
 * Base node that can provide a source for parameter automation
 */
class ParamConnectionSource extends S2NodeBase {
    constructor(context, options) {
        super(context, options);
    }

    newNode(dest) {
        console.warn('ParamConnectionSource::newNode() Unimplemented! This should be overloaded!');
    }
}

/**
 * Base node that has automatable parameters
 */
class ParamConnectionReceiver extends S2NodeBase {
    constructor(context, options) {
        super(context, options);
        this.connections = [];
    }

    /**
     * Is parameter a valid receiver?
     * @param {string} param parameter name
     * @returns {Boolean}
     */
    isParamReceiver(param) {
        if (this.connections.includes(param)) return true;
        return false;
    }

    getConnections() {
        return this.connections;
    }
}

/**
 * Base node that both provides and receive parameter automation
 */
class ParamConnectionSnR extends ParamConnectionReceiver {
    constructor(context, options) {
        super(context, options);
    }

    newNode(dest) {
        console.warn('ParamConnectionSource::newNode() Unimplemented! This should be overloaded!');
    }
}

export {
    S2NodeBase,
    ParamConnectionSource,
    ParamConnectionReceiver,
    ParamConnectionSnR
};