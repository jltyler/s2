import React, {Component} from 'react';
import Oscillator from './Oscillator';
import LFO from './LFO';
import Envelope from './Envelope';
import './Oscillators.css';

class Oscillators extends Component {
    constructor(props) {
        super(props);

        this.state = {
            oscillators: [],
            LFOs: [],
            envelopes: [],
            update: 0,
        };

        if (props.interface) {
            this.interface = props.interface;
        }

        this.addOscillator = this.addOscillator.bind(this);
        this.addLFO = this.addLFO.bind(this);
        this.addEnvelope = this.addEnvelope.bind(this);
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

    addEnvelope () {
        this.setState((prevState) => {
            const envelopes = [...prevState.envelopes];
            envelopes.push(this.interface.newEnvelope());
            return {envelopes};
        });
    }

    update() {
        this.setState((s) => ({update: s.update + 1}));
    }

    renderOscillators() {
        return Object.keys(this.interface.getVoices()).map((name) => {
            return <Oscillator name={name} key={name} interface={this.interface} update={this.update.bind(this)} />;
        });
    }

    renderLFOs() {
        return Object.keys(this.interface.getLFOs()).map((name) => {
            return <LFO name={name} key={name} interface={this.interface} update={this.update.bind(this)} />;
        });
    }

    renderEnvelopes() {
        return Object.keys(this.interface.getEnvelopes()).map((name) => {
            return <Envelope name={name} key={name} interface={this.interface} update={this.update.bind(this)} />;
        });
    }

    render() {
        return (
            <div className="oscillators">
                {this.renderOscillators()}
                {this.renderLFOs()}
                {this.renderEnvelopes()}
                <div className="add-oscillator" onClick={this.addOscillator}>+</div>
                <div className="add-lfo" onClick={this.addLFO}>+</div>
                <div className="add-envelope" onClick={this.addEnvelope}>+</div>
            </div>
        );
    }
}

export default Oscillators;