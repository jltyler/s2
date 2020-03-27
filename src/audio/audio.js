import Echo from './nodes/echo.js';
import Envelope from './nodes/envelope.js';
import Filter from './nodes/filter.js';
import LFO from './nodes/lfo.js';
import Voice from './nodes/voice.js';
import Sequences from './sequences.js';
import {bind as bindKeys, unbind as unbindKeys, release as releaseKeys} from './keys.js';
import {NOTES, ALPHA} from './notes.js';

const AudioContext = window.AudioContext || window.webkitAudioContext;

/**
 * Helper class inserted into a list to validate connections and keep track of them
 */
class ParamConnection {
    constructor(source, dest, param) {
        if (source instanceof Envelope || source instanceof LFO) {
            if (dest instanceof LFO || dest instanceof Filter || dest instanceof Voice) {
                // if (dest.addConnection(param, source)) {
                    this.source = source;
                    this.dest = dest;
                    this.param = param;
                    this.isValid = true;
                // }
            } else {
                console.warn(`ParamConnection::ParamConnection(): ${dest} is not a valid class for destination`);
            }
        } else {
            console.warn(`ParamConnection::ParamConnection(): Invalid source`);
        }
    }

    isEqualTo(other) {
        if (other instanceof ParamConnection) {
            if (this.source === other.source && this.dest === other.dest && this.param === other.param) return true;
        }
        return false;
    }

    isEquivalent(source, dest, param) {
        if (this.source === source && this.dest === dest && this.param === param) return true;
        else return false;
    }

    remove() {
        this.dest.removeConnection(this.param, this.source);
    }

    // connect() {

    // }
}

/**
 * Main audio controller for s2. You must call init() after creating this and before anything else
 */
class S2Audio {
    constructor() {
        this.initialized = false;
        this.keysBound = false; // Are keyboard events bound to play notes?
        this.voices = {}; // Holds Voice references with named keys
        this.LFOs = {}; // LFO references
        this.envelopes = {}; // Envelope references
        this.filters = {}; // Filter references
        this.nodes = {}; // Nodes with the generic interface
        this.playing = {}; // Dict for current notes being played (by keyboard)
        this.paramConnections = []; // Multi-connections
        this.paramConnectionsByParam = {}; // Current connected params
        this.paramConnectionsBySource = {}; // I'm desperate to think of another way of doing this
        this.audioConnections = {};

        this.releaseKeys = () => null;

        // In case these are called from DOM events
        this.init = this.init.bind(this);
        this.stop = this.stop.bind(this);

        this.keysOn = this.keysOn.bind(this);
        this.keysOff = this.keysOff.bind(this);
    }

    /**
     * Creates AudioContext instance and sets initialized bool.
     * User interaction is required before AudioContext will work properly
     */
    init() {
        if (this.initialized) {console.log("S2Audio::init(): Already initialized"); return;}
        this.context = new AudioContext();

        // const name = this.newNode('TestEcho', Echo, {delay: 0.8, decay: 0.55});
        // this.testEcho = this.getFromName(name);
        // // const fdest = this.testEcho.getDestination();
        // const fdest = this.context.destination;
        // this.testEcho.connect(fdest);

        this.initialized = true;
    }

    /**
     * Stop all noise and release keys
     */
    stopAll() {
        for (name in this.voices) {
            this.voices[name].stopAll();
        }
        this.playing = {};
        this.releaseKeys();
    }

    /**
     * Get reference to node from name. Returns null if not found
     * @param {string} name Name of node
     * @returns {Voice|LFO|Envelope|Filter|Echo} Node reference or null
     */
    getFromName(name) {
        if (name in this.voices) return this.voices[name];
        else if (name in this.LFOs) return this.LFOs[name];
        else if (name in this.envelopes) return this.envelopes[name];
        else if (name in this.filters) return this.filters[name];
        else if (name in this.nodes) return this.nodes[name];
        else return null;
    }

    /**
     * Returns reference to corresponding dict from node name. Returns null if not found
     * @param {string} name Name of node
     * @returns {any[]} Node dict reference or null
     */
    getTypeList(name) {
        if (name in this.voices) return this.voices;
        else if (name in this.LFOs) return this.LFOs;
        else if (name in this.envelopes) return this.envelopes;
        else if (name in this.filters) return this.filters;
        else if (name in this.nodes) return this.nodes;
        else return null;
    }

    /**
     * Returns object containing all node dicts
     */
    getAllNodes() {
        return {
            voices: this.voices,
            LFOs: this.LFOs,
            envelopes: this.envelopes,
            filters: this.filters,
            nodes: this.nodes
        };
    }

    /**
     * Returns unique name by appending to name string repeatedly
     * @param {string} name Starting name
     * @param {string} append String to append
     */
    firstNameAvailable(name, append = '+') {
        while(this.getFromName(name)) {
            name = '' + name + append;
        }
        return name;
    }

    /**
     * Creates a new node using type parameter with 'new' operator
     * @param {string} name Name of node
     * @param {Class} type Class function
     * @param {Object} options Options object
     * @returns {string} Name used for node
     */
    newNode(name = 'Node', type = Echo, options = {}) {
        name = this.firstNameAvailable(name);
        this.nodes[name] = new type(this.context, options);
        this.nodes[name].setName(name);
        return name;
    }

    /**
     * Returns nodes that match type given
     * @param {Function} type Class base. instanceof operator is used for comparison
     * @returns {Object} Node object with named keys
     */
    getNodesOfType(type) {
        const o = {};
        for (name in this.nodes) {
            const node = this.nodes[name];
            if (node instanceof type) {
                o[name] = node;
            }
        }
        return o;
    }

    /**
     * Renames a node
     * @param {string} name Original name
     * @param {string} newName New name
     * @returns {string|null} Assigned name or null if not found
     */
    rename(name, newName) {
        const l = this.getTypeList(name);
        if (l) {
            newName = firstNameAvailable(newName);
            l[newName] = l[name];
            delete l[name];
            return newName;
        }
        return null;
    }

    /**
     * Removes a node
     * @param {string} name Name of node
     */
    remove(name) {
        const l = this.getTypeList(name);
        if (l) {
            delete l[name];
        }
    }

    /**
     * Create a new named voice and store it in this.voices.
     * If a name already exists the name will be appended with a '+'
     * @param {string} name Name of the voice
     * @returns {string} Final name of voice
     */
    newVoice(name = 'Voice', options = {}) {
        name = this.firstNameAvailable(name);
        this.voices[name] = new Voice(this.context, options);
        this.voices[name].setName(name);
        return name;
    }

    /**
     * Get Voice reference from name (if it exists)
     * @param {string} name Name of voice
     * @returns {Voice} Voice object reference
     */
    getVoice(name) {
        if (name in this.voices) return this.voices[name];
    }

    getVoices() {
        return this.voices;
    }

    removeVoice(name) {
        if (name in this.voices) {
            delete this.voices[name];
        }
    }

    /**
     * Create a new named LFO and store it in this.LFOs.
     * If a name already exists the name will be appended with a '+'
     * @param {string} name Name of the LFO
     * @returns {string} Final name of LFO
     */
    newLFO(name = 'LFO', options = {}) {
        name = this.firstNameAvailable(name);
        this.LFOs[name] = new LFO(this.context, options);
        this.LFOs[name].setName(name);
        return name;
    }

    /**
     * Get LFO reference from name (if it exists)
     * @param {string} name Name of LFO
     * @returns {LFO} LFO object reference
     */
    getLFO(name) {
        if (name in this.LFOs) return this.LFOs[name];
    }

    getLFOs() {
        return this.LFOs;
    }

    removeLFO(name) {
        if (name in this.LFOs) delete this.LFOs[name];
    }

    /**
     * Create a new named Envelope and store it in this.envelopes.
     * If a name already exists the name will be appended with a '+'
     * @param {string} name Name of the Envelope
     * @returns {string} Final name of Envelope
     */
    newEnvelope(name = 'Envelope', options = {}) {
        name = this.firstNameAvailable(name);
        this.envelopes[name] = new Envelope(this.context, options);
        this.envelopes[name].setName(name);
        return name;
    }

    /**
     * Get Envelope reference from name (if it exists)
     * @param {string} name Name of Envelope
     * @returns {Envelope} Envelope object reference
     */
    getEnvelope(name) {
        if (name in this.envelopes) return this.envelopes[name];
    }

    getEnvelopes() {
        return this.envelopes;
    }

    removeEnvelope(name) {
        if (name in this.envelopes) delete this.envelopes[name];
    }

    /**
     * Create a new named Filter and store it in this.filters.
     * If a name already exists the name will be appended with a '+'
     * @param {string} name Name of the Filter
     * @returns {string} Final name of Filter
     */
    newFilter(name = 'Filter', options = {}) {
        name = this.firstNameAvailable(name);
        this.filters[name] = new Filter(this.context, options);
        this.filters[name].setName(name);
        return name;
    }

    /**
     * Get Filter reference from name (if it exists)
     * @param {string} name Name of Filter
     * @returns {Filter} Filter object reference
     */
    getFilter(name) {
        if (name in this.filters) return this.filters[name];
    }

    getFilters() {
        return this.filters;
    }

    removeFilter(name) {
        if (name in this.filters) delete this.filters[name];
    }

    newEcho(name = 'Echo', options = {}) {
        return this.newNode(name, Echo, options);
    }

    getEchoes() {
        return this.getNodesOfType(Echo);
    }

    // User interface information and config functions
    /**
     * Returns array of strings representing valid connection destinations and parameters
     * @param {string} exclude Name to exclude
     * @returns {Array[]} Array of string tuples: [destinationName, parameterName]
     */
    getParamConnectionDestinations(exclude) {
        const c = [];
        const combo = [
            ...Object.keys(this.voices),
            ...Object.keys(this.LFOs),
            ...Object.keys(this.filters)
        ];
        for (const name of combo) {
            if (name === exclude) continue;
            const connections = this.getFromName(name).getConnections();
            for (const param in connections) {
                c.push([name, param]);
            }
        }
        return c;
    }

    /**
     * Adds a connection from source to destination's paramter
     * @param {string} sourceName Source name
     * @param {string} destName Destination name
     * @param {string} param Destination parameter to affect
     * @returns {ParamConnection} ParamConnection instance
     */
    addConnection(sourceName, destName, param) {
        if (this.getConnection(sourceName, destName, param)) {
            console.warn('Failed to add connection: Already exists!', `${sourceName} -> ${destName}.${param}`);
        } else {
            const source = this.getFromName(sourceName);
            const dest = this.getFromName(destName);
            if (source && dest) {
                const newConnection = new ParamConnection(source, dest, param);
                if (newConnection.isValid) this.paramConnections.push(newConnection);
            } else console.warn('Failed connection: Invalid reference!', source, receiver);
        }
    }

    /**
     * Returns a connection if found
     * @param {string} sourceName Source name
     * @param {string} destName Destination name
     * @param {string} param Destination parameter
     * @returns {null|ParamConnection} Connection or null
     */
    getConnection(sourceName, destName, param) {
        const source = this.getFromName(sourceName);
        const dest = this.getFromName(destName);
        if (source && dest) {
            const existing = this.paramConnections.find((o) => o.isEquivalent(source, dest, param));
            if (existing) {
                return existing;
            } else return null;
        }
    }

    /**
     * Returns Array of all connections with provided destination
     * @param {string} destName Destination name
     * @returns {ParamConnection[]} Connection or null
     */
    getConnectionsByDestination(destName) {
        const node = this.getFromName(destName);
        if (!node) return null;
        return this.paramConnections.filter((o) => o.dest === node);
    }

    /**
     * Removes a connection
     * @param {string} sourceName Source name
     * @param {string} destName Destination name
     * @param {string} param Destination parameter
     * @returns {boolean} True if a connection was found and removed
     */
    removeConnection(sourceName, destName, param) {
        const existing = this.getConnection(sourceName, destName, param);
        if (existing) {
            this.paramConnections.splice(this.paramConnections.indexOf(existing), 1);
            existing.remove();
            return true;
        } else {
            console.warn(`did not find connection`, sourceName, destName, param);
            return false;
        }
    }

    /** Returns connection debug array */
    getConnectionsDebug() {
        const allNodes = this.getAllNodes();
        const ret = [];
        // console.log(this.getConnectionsByDestination("Voice")); return 0;
        for(const type in allNodes) {
            const nodes = allNodes[type];
            for (const name in nodes) {
                const node = nodes[name];
                if (node.connections) {
                    for (const param in node.connections) {
                        const s = name + '.' + param + ':';
                        if (node.connections[param]) {
                            for (const connected of node.connections[param]) {
                                s += ' ' + connected.name;
                            }
                        } else s += 'null';
                        ret.push(s);
                    }
                }
            }
        }
        return [
            this.paramConnections.slice(),
            ret
        ];
    }

    /**
     * Get available audio destinations
     * @param {string} exclude Name to exclude
     */
    getAvailableAudioConnections(exclude) {
        const c = [];
        const combo = [...Object.keys(this.filters), ...Object.keys(this.nodes)];
        for (const name of combo) {
            if (name === exclude) continue;
            c.push(name);
        }
        return c;
    }

    /**
     * Set audio connection
     * @param {string} source Source name
     * @param {string} destination Destination name
     */
    addAudioConnection(source, destination) {
        const s = this.getFromName(source);
        const d = this.getFromName(destination);
        if (s && d) {
            this.audioConnections[source] = destination;
            s.setOption('destination', d);
        }
    }

    /** Get all audio connections */
    getAudioConnections() {
        return this.audioConnections;
    }

    /**
     * @returns {string} Name of destination
     */
    getAudioConnection(name) {
        if (name in this.audioConnections) {
            return this.audioConnections[name];
        } else return null;
    }

    /**
     * @returns {string} Name of destination
     */
    getAudioConnectionBySource(name) {
        if (name in this.audioConnections) {
            return this.audioConnections[name];
        } else return null;
    }

    /**
     * @returns {string[]} Names of sources?
     */
    getAudioConnectionsByDestination(name) {
        const sources = [];
        for (const key in this.audioConnections) {
            if (this.audioConnections[key] === name) sources.push(key);
        }
        return sources;
    }

    /**
     * Remove audio connection
     * @param {string} name Source name
     */
    removeAudioConnection(name) {
        if (name in this.audioConnections) {
            this.getFromName(name).setOption('destination', null);
            delete this.audioConnections[name];
        }
    }

    /**
     * Recursive function that connects entire connection chain and gathers list of each node instance ID
     * @private
     * @param {string} name Name of node
     * @param {number} destId ID of playing node instance
     */
    connectionHorror(name, destId) {
        let connections = [];
        const dest = this.getFromName(name);
        if (dest) {
            const c = this.getConnectionsByDestination(name);
            c.forEach((pc) => {
                if (pc instanceof ParamConnection){
                    const id = pc.source.newNode();
                    connections.push({node: pc.source, id});
                    connections = connections.concat(this.connectionHorror(pc.source.name, id));

                    const destParam = pc.dest.getPlayingParam(destId, pc.param);
                    if (destParam instanceof Array) {
                        const source = pc.source.getPlaying(id);
                        destParam.forEach((p) => source.connect(p));
                    } else pc.source.getPlaying(id).connect(destParam);
                }
            });
        }
        return connections;
    }

    audioConnectionHorror() {}

    /**
     * Play a note. Creates node instancesx, connects them, and activates them
     * @param {string} note Note to play
     */
    play(note) {
        const playing = {
            voices: [],
            connections: [],
            filters: []
        };
        for (const name in this.voices) {
            const v = {};
            const voiceRef = this.voices[name];
            v.voice = voiceRef;
            v.id = voiceRef.play(NOTES[note], this.context.currentTime);
            playing.voices.push(v);

            playing.connections = playing.connections.concat(this.connectionHorror(name, v.id));

            const dest = this.getAudioConnectionBySource(name);
            if (dest) {
                const filter = this.getFilter(dest);
                const fid = filter.newNode();
                playing.filters.push({filter, id: fid});
                voiceRef.getPlayingFinal(v.id).connect(filter.getPlaying(fid)).connect(this.context.destination);
                playing.connections = playing.connections.concat(this.connectionHorror(dest, fid));
            } else voiceRef.getPlayingFinal(v.id).connect(this.context.destination);
        }
        this.playing[note] = playing;
    }

    /**
     * Starts releases and trashes node references
     * @param {string} note Note to stop
     */
    stop(note) {
        if (note === undefined) return stopAll();
        const o = this.playing[note];
        const releaseTime = o.voices.reduce((release, v) => {
            const current = v.voice.release(v.id);
            return release >= current ? release : current ;
        }, this.context.currentTime);
        o.connections.forEach((c) => {
            c.node.release(c.id);
            c.node.stop(c.id, releaseTime);
        });
        o.filters.forEach((f) => {
            f.filter.stop(f.id, releaseTime);
        });
        delete this.playing[note];
        // setTimeout(() => {
        // }, (releaseTime - this.context.currentTime) * 1000);
    }

    /**
     * Binds play functions to keyboard events
     */
    keysOn() {
        bindKeys(
            this.play.bind(this),
            this.stop.bind(this)
        );
        this.releaseKeys = releaseKeys;
    }

    /**
     * Unbinds functions from keyboard events
     */
    keysOff() {
        unbindKeys();
        this.releaseKeys = () => null;
    }

    // BIN THIS (soon)
    startSequence() {
        const np = new NotePlanner(Sequences.testSequence, v, this.context, comp);
        np.start();
    }

    getAudioContext() {
        return this.context;
    }
}

export default S2Audio;