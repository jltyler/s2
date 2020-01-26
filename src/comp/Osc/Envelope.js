import React from 'react';
import {Knob} from '../Controls/Knobs';
import './Envelope.css';
import ParamConnection from '../Controls/ParamConnection';

const setEnvelopeOption = (envelope, key, value) => {
    envelope.setOption(key, value);
};

const Envelope = (props) => {
    const envelope = props.s2.getEnvelope(props.name);
    return (
    <div className="envelope">
        <h2>{props.name}</h2>
        <div className="envelope-adsr">
            <Knob label="Attack" handler={setEnvelopeOption.bind(null, envelope, 'attack')} min={1} max={10} curve={1} a={0.001} b={4.35} />
            <Knob label="Decay" handler={setEnvelopeOption.bind(null, envelope, 'decay')} min={1} max={10} curve={1} a={0.001} b={4.35} />
            <Knob label="Sustain" handler={setEnvelopeOption.bind(null, envelope, 'sustain')} min={0.0} max={1.0} />
            <Knob label="Release" handler={setEnvelopeOption.bind(null, envelope, 'release')} min={1} max={10} curve={1} a={0.001} b={4.35} />
        </div>
        <div className="envelope-misc">
            <Knob label="Scale" handler={setEnvelopeOption.bind(null, envelope, 'scale')} min={-5000.0} max={5000.0} />
            <Knob label="Length" handler={setEnvelopeOption.bind(null, envelope, 'length')} min={0.0} max={10.0} />
            <ParamConnection s2={props.s2} name={props.name} />
        </div>

    </div>
    );
};

export default Envelope;