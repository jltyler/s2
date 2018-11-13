
/**
 * Linear interpolation. Takes minimum value, max value, and a normalized scalar.
 * @param {number} min Minimum value
 * @param {number} max Maximum value
 * @param {number} scale Scale value (between 0 and 1)
 */
const lerp = (min, max, scale) => min + scale * (max - min);

/**
 * Returns random value greater than or equal to the minimum value and less the maximum value
 * @param {number} min Minimum value
 * @param {number} max Maximum value
 */
const random = (min = 0.0, max = 1.0) => lerp(min, max, Math.random());

/**
 * Returns a list of values that are uniformly spread between the minimum and maximum value. Excludes maximum value
 * @param {number} min Minimum value
 * @param {number} max Maximum value
 * @param {number} number Number of values to return
 */
const spread = (min, max, number) => {
    const iter = (max - min) * (1 / number);
    const values = [];
    for(let i = 0; i < number; ++i) {
        values.push(min + i * iter);
    }
    return values;
};

export {lerp, random, spread};