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
        this.setName(`S2NodeBase ${(()=>{
            let numero = -1;
            return ()=>++numero;
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

    getDestination() {
        console.warn('S2NodeBase::getDestination() Unimplemented! This should be overloaded!');
        return this.context;
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

    connect(dest) {
        console.warn('ParamConnectionSource::connect() Unimplemented! This should be overloaded!');
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
        this.connections = {};
    }

    /**
     * Takes name of param and target AudioParam instance. Executes 'connect' on the all sources in connections[param] with 'target' as argument
     * @param {string} param Parameter name
     * @param {AudioParam} target Target parameter instance
     */
    connectParam(param, target) {
        if (this.connections[param]) {
            this.connections[param].forEach((s) => {
                s.connect(target);
            });
        }
    }

    /**
     * Adds source to parameter connection list if valid
     * @param {string} param Parameter name
     * @param {AudioNode} source Source node
     */
    addConnection(param, source) {
        if (param in this.connections) {
            if (source instanceof ParamConnectionSource || source instanceof ParamConnectionSnR) {
                if (this.connections[param]) {
                    this.connections[param].push(source);
                } else {
                    this.connections[param] = [source];
                }
                return true;
            } else {
                console.warn(`Source is NOT a valid connector!`);
                return false;
            }
        } else {
            console.warn(`Parameter '${param}' is NOT a valid connection receiver!`);
            return false;
        }
    }

    getConnection(param) {
        if (param in this.connections) {
            return this.connections[param];
        }
    }

    getConnections() {
        return this.connections;
    }

    removeConnection(param, source) {
        console.log(this.name + '.removeConnection');
        console.log('param:', param);
        console.log('source:', source);
        if (param in this.connections) {
            const paramList = this.connections[param];
            if (paramList && source && paramList.includes(source)) {
                paramList.splice(paramList.indexOf(source), 1);
                if (paramList.length === 0) {
                    this.connections[param] = null;
                }
                return true;
            }
        }
        return false;
    }
}

/**
 * Base node that both provides and receive parameter automation
 */
class ParamConnectionSnR extends ParamConnectionReceiver {
    constructor(context, options) {
        super(context, options);
    }

    connect(dest) {
        console.warn('ParamConnectionSnR::connect() Unimplemented! This should be overloaded!');
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