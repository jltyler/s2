import React from 'react';
import {Knob} from '../Controls/Knobs';
import './LFOs.css';
import ParamConnection from '../Controls/ParamConnection';
import Waveform from '../Controls/Waveform';

const logHandler = function() {
    console.log(arguments);
};

const setFrequency = (LFO, freq) => {
    LFO.setFrequency(freq);
};

const setAmplitude = (LFO, amp) => {
    LFO.setAmplitude(amp);
};

const setWaveform = (LFO, wav) => {
    LFO.setWaveform(wav);
};

const LFO = (props) => {
    const lfo = props.s2.getLFO(props.name);
    return (
        <div className="LFO">
        <h2>{props.name}</h2>
            <Knob label="Frequency" handler={setFrequency.bind(null, lfo)} min={0.01} max={100} continuous={true} />
            <Knob label="Amplitude" handler={setAmplitude.bind(null, lfo)} min={0.01} max={1000} continuous={true} />
            <Waveform handler={setWaveform.bind(null, lfo)} />
            <ParamConnection s2={props.s2} name={props.name} />
        </div>
    );
};

export default LFO;