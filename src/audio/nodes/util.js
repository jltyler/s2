import {S2NodeBase} from './base.js';

/**
 * Checks destination validity and returns a valid destination. Falls back to context destination
 * @param {AudioNode|S2NodeBase} destination Destination node
 * @param {AudioContext} context AudioContext reference
 */
const getFinalDestination = (destination, context) => {
    if (destination) {
        if (destination instanceof AudioNode) return destination;
        else if (destination instanceof S2NodeBase) return destination.getDestination();
    }
    return context.destination;
};

const ALPHA = Math.pow(2, 1 / 12);

export {
    getFinalDestination,
    ALPHA
};