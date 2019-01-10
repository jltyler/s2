import React from 'react';
import {Knob} from '../Controls/Knobs';
import './LFOs.css';

const logHandler = function() {
    console.log(arguments);
};

const setFrequency = (LFO, freq) => {
    console.log(LFO, freq);
    LFO.setFrequency(freq);
};

const setAmplitude = (LFO, amp) => {
    console.log(LFO, amp);
    LFO.setAmplitude(amp);
};

const setConnection = (LFO, iface, e) => {
    const connection = e.target.value;
    if (connection === 'none') LFO = null;
    console.log(LFO, connection);
    const split = connection.split('.');
    console.log(split);
    iface.addVoiceConnection(split[0], split[1], LFO);
};

const LFO = (props) => {
    return (
        <div className="LFO">
            <Knob label="Frequency" handler={setFrequency.bind(null, props.lfo)} min={0.01} max={100} />
            <Knob label="Amplitude" handler={setAmplitude.bind(null, props.lfo)} min={0.01} max={1000} />
            Waveform
            Destination
            <select onChange={setConnection.bind(null, props.lfo, props.interface)}>
                <option value="none">No connection</option>
                {props.interface.getAvailableConnections(props.lfo).map(c => <option value={c}>connection: {c}</option>)}
            </select>
        </div>
    );
}

export default LFO;