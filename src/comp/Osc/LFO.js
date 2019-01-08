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

const LFO = (props) => {
    return (
        <div className="LFO">
            <Knob label="Frequency" handler={setFrequency.bind(null, props.lfo)} min={0.01} max={100} />
            <Knob label="Amplitude" handler={setAmplitude.bind(null, props.lfo)} min={0.01} max={1000} />
            Waveform
            Destination
        </div>
    );
}

export default LFO;