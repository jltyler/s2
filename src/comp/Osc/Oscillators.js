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

    renderOscillators() {
        const voices = this.interface.getVoices();
        const jsx = [];
        for (name in voices) {
            jsx.push(<Oscillator name={name} voice={voices[name]} key={name} />);
        }
        return jsx;
    }

    render() {
        return (
            <div className="oscillators">
                {this.renderOscillators()}
                <div className="add-oscillator" onClick={this.addOscillator}>+</div>
            </div>
        );
    }
}

export default Oscillators;