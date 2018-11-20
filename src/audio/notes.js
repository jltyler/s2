const notes = {
    a4: 440
};

const aCode = 'a'.charCodeAt(0);
const gCode = 'g'.charCodeAt(0);

const noteNames = ['a', 'as', 'b', 'c', 'cs', 'd', 'ds', 'e', 'f', 'fs', 'g', 'gs'];

const a = Math.pow(2, 1 / 12);

const noteCountUp = 51;
const noteCountDown = 46;

for (let i = 0, name = 0, j = 4; i < noteCountUp; ++i, ++name) {
    // console.log(i, noteNames[name], j);

    notes[noteNames[name] + j] = 440 * Math.pow(a, i);
    if (name === noteNames.length - 1) name = -1;
    if (i % 12 === 2) ++j;
}

for (let i = 0, name = 0, j = 4; i < noteCountDown; ++i, --name) {
    // console.log(i, noteNames[name], j);

    notes[noteNames[name] + j] = 440 * Math.pow(a, i * -1);
    if (name <= 0) name = noteNames.length;
    if (i % 12 === 9) --j;
}

// console.log(notes);


export default notes;