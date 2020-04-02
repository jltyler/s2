const ALPHA = Math.pow(2, 1 / 12);

const waves = {};

const generateWaves = (context) => {
    const real = new Float32Array(3);
    const imag = new Float32Array(3);
    real[0] = 0;
    real[1] = 0;
    real[2] = 0;
    imag[0] = 1;
    imag[1] = 0;
    imag[2] = 0;
    waves.crazy = new PeriodicWave(context, {real, imag});
};

export {
    ALPHA,
    waves,
    generateWaves
};