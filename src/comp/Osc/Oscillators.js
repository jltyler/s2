import React, {Component} from 'react';
import Oscillator from './Oscillator';
import './Oscillators.css';

const oscData = [
    {
        freq: 440,
        gain: 1.0,
    },
    {
        freq: 440,
        gain: 1.0,
    },
    {
        freq: 440,
        gain: 1.0,
    },
];

class Oscillators extends Component {
    constructor(props) {
        super(props);

        this.state = {};
    }

    render() {
        return (
            <div className="oscillators">
                {oscData.map((osc, i) => {
                    return (
                        <Oscillator key={i} osc={osc} />
                    );
                })}
                <div className="add-oscillator">+</div>
            </div>
        );
    }
}

export default Oscillators;