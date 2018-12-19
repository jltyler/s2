import React from 'react';
import {VerticalSlider} from '../Controls/Sliders';
import {Knob} from '../Controls/Knobs';
import {Switch} from '../Controls/Switches';

const logHandler = function() {
    console.log(arguments);
};

const setVoiceOption = (voice, key, value) => {
    console.log('setVoiceOption', voice, '\nKey', key,'\nVal' , value);
    voice.setOption(key, value);
};

const Oscillator = (props) => {
    return (
        <div className="oscillator">
            <div className="oscillator-general">
                <div className="oscillator-general-global">
                    <VerticalSlider label="Gain" handler={logHandler} /> <br />
                    <Knob label="Pan" handler={setVoiceOption.bind(null, props.voice, 'pan')} min={-1.0} max={1.0} />
                </div>
                <div className="oscillator-general-main">
                    <Knob label="Octave" handler={setVoiceOption.bind(null, props.voice, 'octave')} min={-2} max={2} snap={1} />
                    <Knob label="Tune" handler={setVoiceOption.bind(null, props.voice, 'detune')} min={-1} max={1} />
                    Waveform <br />
                    <Knob label="Unison" handler={setVoiceOption.bind(null, props.voice, 'unison')} min={1} max={12} snap={1} />
                    <Knob label="Unison Spread" handler={setVoiceOption.bind(null, props.voice, 'unisonSpread')} min={0.001} max={5} />
                </div>
                Output destination
            </div>
            <div className="oscillator-envelope">
                <h2>Envelope (gain)</h2>
                <Switch label="Active" handler={logHandler} />
                <Knob label="Attack" handler={logHandler} min={0.001} max={5.0} value={0.1} />
                <Knob label="Decay" handler={logHandler} min={0.001} max={5.0} value={0.001} />
                <Knob label="Sustain" handler={logHandler} min={0.001} max={1.0} value={1.0} />
                <Knob label="Release" handler={logHandler} min={0.001} max={5.0} value={0.5} />
                Display  <br />
            </div>
            <div className="oscillator-tremolo">
                <h2>Tremolo (frequency)</h2>
                <Switch label="Active" handler={logHandler} />
                <Knob label="Frequency" handler={logHandler} min={0} max={40} value={10} />
                <Knob label="Amplitude" handler={logHandler} min={0} max={300} value={40} />
                Waveform
            </div>
        </div>
    );
}

export default Oscillator;