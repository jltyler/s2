import React, {Component} from 'react';
import Oscillator from './Oscillator';
import LFO from './LFO';
import Envelope from './Envelope';
import Filter from './Filter';
import Echo from './Echo';
import './Oscillators.css';

class Oscillators extends Component {
    constructor(props) {
        super(props);

        this.state = {
            oscillators: [],
            LFOs: [],
            envelopes: [],
            filters: [],
            echoes: [],
            update: 0,
        };

        if (props.interface) {
            this.interface = props.interface;
        }

        this.addOscillator = this.addOscillator.bind(this);
        this.addLFO = this.addLFO.bind(this);
        this.addEnvelope = this.addEnvelope.bind(this);
        this.addFilter = this.addFilter.bind(this);
        this.addEcho = this.addEcho.bind(this);
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

    addFilter() {
        this.setState((prevState) => {
            const filters = [...prevState.filters];
            filters.push(this.interface.newFilter());
            return {filters};
        });
    }

    addEcho() {
        this.setState((prevState) => {
            const echoes = [...prevState.echoes];
            echoes.push(this.interface.newEcho());
            return {echoes};
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
            return <LFO name={name} key={name} s2={this.interface} update={this.update.bind(this)} />;
        });
    }

    renderEnvelopes() {
        return Object.keys(this.interface.getEnvelopes()).map((name) => {
            return <Envelope name={name} key={name} s2={this.interface} update={this.update.bind(this)} />;
        });
    }

    renderFilters() {
        return Object.keys(this.interface.getFilters()).map((name) => {
            return <Filter name={name} key={name} interface={this.interface} update={this.update.bind(this)} />;
        });
    }

    renderEchoes() {
        return Object.keys(this.interface.getEchoes()).map((name) => {
            return <Echo name={name} key={name} interface={this.interface} update={this.update.bind(this)} />;
        });
    }

    render() {
        return (
            <div className="oscillators">
                {this.renderOscillators()}
                {this.renderLFOs()}
                {this.renderEnvelopes()}
                {this.renderFilters()}
                {this.renderEchoes()}
                <div className="add-oscillator" onClick={this.addOscillator}>New Voice</div>
                <div className="add-lfo" onClick={this.addLFO}>New LFO</div>
                <div className="add-envelope" onClick={this.addEnvelope}>New Envelope</div>
                <div className="add-oscillator" onClick={this.addFilter}>New Filter</div>
                <div className="add-echo" onClick={this.addEcho}>New Echo</div>
            </div>
        );
    }
}

export default Oscillators;