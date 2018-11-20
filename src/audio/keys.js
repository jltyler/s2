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
    'KeyA': 'f4',
    'KeyW': 'fs4',
    'KeyS': 'g4',
    'KeyE': 'gs4',
    'KeyD': 'a4',
    'KeyR': 'as4',
    'KeyF': 'b4',
    'KeyG': 'c5',
    'KeyY': 'cs5',
    'KeyH': 'd5',
    'KeyU': 'ds5',
    'KeyJ': 'e5',
    'KeyK': 'e5',
    'KeyO': 'f5',
    'KeyL': 'fs5',
    'KeyP': 'g5',
    'Semicolon': 'gs5',
    'BracketLeft': 'a5',
    'Quote': 'as5'
};

const pressed = {};

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