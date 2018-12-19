import React, {Component} from 'react';
import Oscillator from './Oscillator';
import './Oscillators.css';

const oscData = [0,0,0];

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
                        <Oscillator interface={this.props.interface} key={i} />
                    );
                })}
                <div className="add-oscillator">+</div>
            </div>
        );
    }
}

export default Oscillators;