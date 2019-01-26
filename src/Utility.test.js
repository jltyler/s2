const util = require('./Utility');

test('util is object', () => {
    expect(typeof util).toBe('object');
});

const lerp = util.lerp;

test('Lerp exists and is a function', () => {
    expect(lerp).toBeTruthy();
    expect(typeof lerp).toBe('function');
});

test('Lerp returns correct values', () => {
    // Basic functionality
    expect(lerp(0, 100, 0.5)).toBeCloseTo(50);
    expect(lerp(100, 150, 0.1)).toBeCloseTo(105);
    expect(lerp(10000, 1000000000, 0.5)).toBeCloseTo(500005000);
    expect(lerp(0, 0.0003, 0.25)).toBeCloseTo(0.000075);
    expect(lerp(1325, 25645324, 0.245138)).toBeCloseTo(6287643.626862);

    // Negative numbers
    expect(lerp(-100, 0, 0.75)).toBeCloseTo(-25);
    expect(lerp(-350, -50, 0.4)).toBeCloseTo(-230);
    expect(lerp(-500, 500, 0.125)).toBeCloseTo(-375);
    expect(lerp(-5.0003, -4.5211, 0.7)).toBeCloseTo(-4.66486);
    expect(lerp(-54270398, 9367584, 0.36895545)).toBeCloseTo(-30790817.7140981);

    // Inverted min max
    expect(lerp(500, 100, 0.75)).toBeCloseTo(200);
    expect(lerp(5000, -9200, 0.3812)).toBeCloseTo(-413.04);
    expect(lerp(-500, -1000, 0.33333)).toBeCloseTo(-666.665);

    // No normalized alpha
    expect(lerp(200, 1000, 3.75)).toBeCloseTo(3200);
    expect(lerp(200, 1000, -3.75)).toBeCloseTo(-2800);

});
