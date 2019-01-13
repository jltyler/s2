import React from 'react';
import {Knob} from '../Controls/Knobs';

const logHandler = function() {
    console.log(arguments);
};

const setEnvelopeOption = (envelope, key, value) => {
    envelope.setOption(key, value);
};

const setConnection = (envelope, iface, update, e) => {
    const existing = iface.getConnectionBySource(envelope.name);
    const connection = e.target.value;
    if (connection === existing) return;
    else if (connection === 'none') {
        iface.removeConnectionBySource(envelope.name);
    }
    else {
        const split = connection.split('.');
        iface.addConnection(split[0], split[1], envelope.name);
    }
    update();
};

const getConnection = (envelope, iface) => {
    const r = iface.getConnectionBySource(envelope.name);
    if (r) return r.name + '.' + r.param;
    else return 'none';
};

const Envelope = (props) => {
    const envelope = props.interface.getEnvelope(props.name);
    return (
    <div className="envelope">
        <h2>{props.name}</h2>
        <div className="envelope-adsr">
            <Knob label="Attack" handler={setEnvelopeOption.bind(null, envelope, 'attack')} min={0.00001} max={10.0} />
            <Knob label="Decay" handler={setEnvelopeOption.bind(null, envelope, 'decay')} min={0.00001} max={10.0} />
            <Knob label="Sustain" handler={setEnvelopeOption.bind(null, envelope, 'sustain')} min={0.0} max={1.0} />
            <Knob label="Release" handler={setEnvelopeOption.bind(null, envelope, 'release')} min={0.00001} max={10.0} />
        </div>
        <div className="envelope-misc">
            <Knob label="Scale" handler={setEnvelopeOption.bind(null, envelope, 'scale')} min={-1000.0} max={1000.0} />
            <Knob label="Length" handler={setEnvelopeOption.bind(null, envelope, 'length')} min={0.0} max={10.0} />
            Destination
            <select onChange={setConnection.bind(null, envelope, props.interface, props.update)} value={getConnection(envelope, props.interface)} >
                <option key="none" value="none">No connection</option>
                {props.interface.getAvailableConnections(props.name).map((c, i) => <option key={i} value={c}>{c}</option>)}
            </select>
        </div>

    </div>
    );
};

export default Envelope;