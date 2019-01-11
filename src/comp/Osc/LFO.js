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

const setConnection = (LFO, iface, update, e) => {
    const existing = iface.getConnectionBySource(LFO.name);
    const connection = e.target.value;
    if (connection === existing) return;
    else if (connection === 'none') {
        iface.removeConnectionBySource(LFO.name);
    }
    else {
        const split = connection.split('.');
        iface.addConnection(split[0], split[1], LFO.name);
    }
    update();

    // else if (existing) {
    //     iface.removeConnectionBySource(LFO.name);
    // }
    // if (connection === 'none') LFO = null;

    // console.log(LFO, connection);
    // const split = connection.split('.');
    // console.log(split);
    // iface.addConnection(split[0], split[1], LFO.name);
};

const getConnection = (iface, LFO) => {
    const r = iface.getConnectionBySource(LFO.name);
    if (r) return r.name + '.' + r.param;
    else return 'none';
};

const LFO = (props) => {
    const lfo = props.interface.getLFO(props.name);
    console.log('lfo render', props.name, lfo);
    return (
        <div className="LFO">
        <h2>{props.name}</h2>
            <Knob label="Frequency" handler={setFrequency.bind(null, lfo)} min={0.01} max={100} />
            <Knob label="Amplitude" handler={setAmplitude.bind(null, lfo)} min={0.01} max={1000} />
            Waveform
            Destination
            <select onChange={setConnection.bind(null, lfo, props.interface, props.update)} value={getConnection(props.interface, lfo)} >
                <option value="none">No connection</option>
                {props.interface.getAvailableConnections(props.name).map((c) => <option value={c}>{c}</option>)}
            </select>
        </div>
    );
}

export default LFO;