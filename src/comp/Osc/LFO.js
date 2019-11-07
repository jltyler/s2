import React from 'react';
import {Knob} from '../Controls/Knobs';
import './LFOs.css';
import ParamConnection from '../Controls/ParamConnection';

const logHandler = function() {
    console.log(arguments);
};

const setFrequency = (LFO, freq) => {
    LFO.setFrequency(freq);
};

const setAmplitude = (LFO, amp) => {
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
};

const getConnection = (iface, LFO) => {
    const r = iface.getConnectionBySource(LFO.name);
    if (r) return r.name + '.' + r.param;
    else return 'none';
};

const LFO = (props) => {
    const lfo = props.s2.getLFO(props.name);
    return (
        <div className="LFO">
        <h2>{props.name}</h2>
            <Knob label="Frequency" handler={setFrequency.bind(null, lfo)} min={0.01} max={100} />
            <Knob label="Amplitude" handler={setAmplitude.bind(null, lfo)} min={0.01} max={1000} />
            Waveform
            Destination
            <ParamConnection s2={props.s2} name={props.name} />
            {/* <select onChange={setConnection.bind(null, lfo, props.s2, props.update)} value={getConnection(props.s2, lfo)} >
                <option key="none" value="none">No connection</option>
                {props.s2.getAvailableConnections(props.name).map((c, i) => <option key={i} value={c}>{c}</option>)}
            </select> */}
        </div>
    );
};

export default LFO;