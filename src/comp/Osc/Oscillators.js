import React, {Component} from 'react';
import Oscillator from './Oscillator';
import './Oscillators.css';

class Oscillators extends Component {
    constructor(props) {
        super(props);

        this.state = {
            oscillators: []
        };

        if (props.interface) {
            this.interface = props.interface;
        }

        this.addOscillator = this.addOscillator.bind(this);
    }

    addOscillator() {
        this.setState((prevState) => {
            const oscillators = [...prevState.oscillators];
            oscillators.push(this.interface.newVoice());
            return {oscillators};
        });
    }

    render() {
        return (
            <div className="oscillators">
                {this.state.oscillators.map((osc, i) => {
                    return (
                        <Oscillator name={osc} voice={this.props.interface.getVoice(osc)} interface={this.props.interface} key={i} />
                    );
                })}
                <div className="add-oscillator" onClick={this.addOscillator}>+</div>
            </div>
        );
    }
}

export default Oscillators;