const NOTES = {
    a4: 440
};

const ALPHA = Math.pow(2, 1 / 12);

const noteNames = ['a', 'as', 'b', 'c', 'cs', 'd', 'ds', 'e', 'f', 'fs', 'g', 'gs'];

const noteCountUp = 51;
const noteCountDown = 46;

for (let i = 0, name = 0, j = 4; i < noteCountUp; ++i, ++name) {
    // console.log(i, noteNames[name], j);

    NOTES[noteNames[name] + j] = 440 * Math.pow(ALPHA, i);
    if (name === noteNames.length - 1) name = -1;
    if (i % 12 === 2) ++j;
}

for (let i = 0, name = 0, j = 4; i < noteCountDown; ++i, --name) {
    // console.log(i, noteNames[name], j);

    NOTES[noteNames[name] + j] = 440 * Math.pow(ALPHA, i * -1);
    if (name <= 0) name = noteNames.length;
    if (i % 12 === 9) --j;
}

// console.log(NOTES);

export {
    ALPHA,
    NOTES
};