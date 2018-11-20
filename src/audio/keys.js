const keys = {
    'KeyZ': 'c3',
    'KeyS': 'cs3',
    'KeyX': 'd3',
    'KeyD': 'ds3',
    'KeyC': 'e3',
    'KeyV': 'f3',
    'KeyG': 'fs3',
    'KeyB': 'g3',
    'KeyH': 'gs3',
    'KeyN': 'a3',
    'KeyJ': 'as3',
    'KeyM': 'b3',
    'Comma': 'c4',
    'KeyL': 'cs4',
    'Period': 'd4',
    'Semicolon': 'ds4',
    'Slash': 'e4',
    'KeyQ': 'f4',
    'Digit2': 'fs4',
    'KeyW': 'g4',
    'Digit3': 'gs4',
    'KeyE': 'a4',
    'Digit4': 'as4',
    'KeyR': 'b4',
    'KeyT': 'c5',
    'Digit6': 'cs5',
    'KeyY': 'd5',
    'Digit7': 'ds5',
    'KeyU': 'e5',
    'KeyI': 'f5',
    'Digit9': 'fs5',
    'KeyO': 'g5',
    'Digit0': 'gs5',
    'KeyP': 'a5',
    'Minus': 'as5',
    'BracketLeft': 'b5'
};

const pressed = {};

/**
 * Add key handlers for the window that call the handlers if the key is a valid note
 * @param {function} pressHandler Handler for keys being pressed down
 * @param {function} releaseHandler Handler for keys being released
 */
const bindKeys = (pressHandler, releaseHandler) => {
    window.addEventListener('keydown', (e) => {
        // console.log('keydown', e.code);
        if (!(e.code in pressed) && (e.code in keys)) {
            pressed[e.code] = true;
            pressHandler(keys[e.code]);
        }
    });

    window.addEventListener('keyup', (e) => {
        // console.log('keyup', e.code);
        delete pressed[e.code];
        if (e.code in keys) {
            releaseHandler(keys[e.code]);
        }
    });
}

export default bindKeys;