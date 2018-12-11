import React from 'react';
import {VerticalSlider} from '../Controls/Sliders';
import {Knob} from '../Controls/Knobs';

const logHandler = function() {
    console.log(arguments);
};

const Oscillator = (props) => {
    return (
        <div className="oscillator">
            <div className="oscillator-general">
                <div className="oscillator-general-global">
                    <VerticalSlider label="Gain" handler={logHandler} /> <br />
                    <Knob label="Pan" handler={logHandler} min={0.0} max={1.0} value ={0.5} minAngle={Math.PI} maxAngle={Math.PI * 2} />
                </div>
                <div className="oscillator-general-main">
                    <Knob label="Octave" handler={logHandler} min={-2} max={2} />
                    <Knob label="Tune" handler={logHandler} min={-100} max={100} />
                    Waveform <br />
                    <Knob label="Unison" handler={logHandler} min={1} max={12} />
                    <Knob label="Unison Spread" handler={logHandler} min={0.001} max={5} />
                </div>
                Output destination
            </div>
            <div className="oscillator-envelope">
                On Off  <br />
                Attack  <br />
                Decay  <br />
                Sustain  <br />
                Release  <br />
                Display  <br />
            </div>
            <div className="oscillator-tremolo">
                On Off <br />
                Frequency <br />
                Amplitude <br />
                Waveform <br />
            </div>
        </div>
    );
}

export default Oscillator;