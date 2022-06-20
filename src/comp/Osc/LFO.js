import React from 'react';
import {Knob} from '../Controls/Knobs';
import ParamConnection from '../Controls/ParamConnection';
import Waveform from '../Controls/Waveform';
import Name from '../Controls/Name';

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

const rename = (s2, update, oldName, newName) => {
    s2.rename(oldName, newName);
    update();
};

const LFO = (props) => {
    const lfo = props.s2.getLFO(props.name);
    return (
        <div className="node LFO">
        <Name name={props.name} handler={rename.bind(null, props.s2, props.update, props.name)} />
            <Knob label="Frequency" handler={setFrequency.bind(null, lfo)} min={0.01} max={100} continuous={true} />
            <Knob label="Amplitude" handler={setAmplitude.bind(null, lfo)} min={0.01} max={1000} continuous={true} />
            <br />
            <Waveform handler={setWaveform.bind(null, lfo)} />
            <ParamConnection s2={props.s2} name={props.name} />
        </div>
    );
};

export default LFO;