import React from 'react';
import {VerticalSlider} from '../Controls/Sliders';

const Oscillator = (props) => {
    return (
        <div className="oscillator">
            <div className="oscillator-general">
                Gain <br />
                <VerticalSlider />
                Pan <br />
                Octave <br />
                Tune <br />
                Waveform <br />
                Unison <br />
                Unison Spread <br />
                Output destination <br />
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