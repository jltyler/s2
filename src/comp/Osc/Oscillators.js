import React, {Component} from 'react';
import Oscillator from './Oscillator';
import LFO from './LFO';
import './Oscillators.css';

class Oscillators extends Component {
    constructor(props) {
        super(props);

        this.state = {
            oscillators: [],
            LFOs: [],
            update: 0,
        };

        if (props.interface) {
            this.interface = props.interface;
        }

        this.addOscillator = this.addOscillator.bind(this);
        this.addLFO = this.addLFO.bind(this);
    }

    addOscillator() {
        this.setState((prevState) => {
            const oscillators = [...prevState.oscillators];
            oscillators.push(this.interface.newVoice());
            return {oscillators};
        });
    }

    addLFO() {
        this.setState((prevState) => {
            const LFOs = [...prevState.LFOs];
            LFOs.push(this.interface.newLFO());
            return {LFOs};
        });
    }

    update() {
        this.setState(s => ({update: s.update + 1}));
    }

    renderOscillators() {
        return Object.keys(this.interface.getVoices()).map(name => {
            return <Oscillator name={name} key={name} interface={this.interface} update={this.update.bind(this)} />
        });
        // const voices = this.interface.getVoices();
        // const jsx = [];
        // for (const name in voices) {
        //     jsx.push(<Oscillator name={name} voice={voices[name]} interface={this.interface} update={this.update.bind(this)} key={name} />);
        // }
        // return jsx;
    }

    renderLFOs() {
        return Object.keys(this.interface.getLFOs()).map(name => {
            return <LFO name={name} key={name} interface={this.interface} update={this.update.bind(this)} />
        });
        // const LFOs = this.interface.getLFOs();
        // const jsx = [];
        // for (const name in LFOs) {
        //     jsx.push(<LFO name={name} lfo={LFOs[name]} key={name} interface={this.interface} update={this.update.bind(this)} />);
        // }
        // return jsx;
    }

    render() {
        return (
            <div className="oscillators">
                {this.renderOscillators()}
                {this.renderLFOs()}
                <div className="add-oscillator" onClick={this.addOscillator}>+</div>
                <div className="add-oscillator" onClick={this.addLFO}>+</div>
            </div>
        );
    }
}

export default Oscillators;