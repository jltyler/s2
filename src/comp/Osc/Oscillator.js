import React from 'react';
import {VerticalSlider} from '../Controls/Sliders';
import {Knob} from '../Controls/Knobs';
import {Switch} from '../Controls/Switches';
import Waveform from '../Controls/Waveform';

const logHandler = function() {
    console.log(arguments);
};

const setVoiceOption = (voice, key, value) => {
    voice.setOption(key, value);
};

const setEnvelopeOption = (voice, key, value) => {
    voice.getEnvelope().setOption(key, value);
};

const setAudioConnection = (iface, voice, update, e) => {
    if (e.target.value === 'none') iface.removeAudioConnection(voice.name);
    iface.addAudioConnection(voice.name, e.target.value);
    update(); // There has got to be a better way of doing this
};

const getAudioConnection = (iface, voice) => {
    const r = iface.getAudioConnection(voice.name);
    return r || 'none';
};

const setWaveform = (voice, e) => {
    console.log('voice:', voice);
    console.log('e:', e);
    voice.setOption('waveform', e);
};

const Oscillator = (props) => {
    const voice = props.interface.getVoice(props.name);
    return (
        <div className="oscillator">
            <h3 onDoubleClick={logHandler}>{props.name}</h3>
            <div className="oscillator-general">
                <div className="oscillator-general-global">
                    <VerticalSlider snap={0.05} label="Gain" handler={setVoiceOption.bind(null, voice, 'gain')} min={1.0} max={0.0} /> <br />
                    <Knob label="Pan" handler={setVoiceOption.bind(null, voice, 'pan')} min={-1.0} max={1.0} defaultValue={0} />
                </div>
                <div className="oscillator-general-main">
                    <Knob label="Octave" handler={setVoiceOption.bind(null, voice, 'octave')} min={-2} max={2} snap={1} defaultValue={0} precision={0} />
                    <Knob label="Tune" handler={setVoiceOption.bind(null, voice, 'detune')} min={-1} max={1} defaultValue={0} />
                    <Waveform handler={setWaveform.bind(null, voice)}/>
                    {/* Waveform <br />
                    <select onChange={setWaveform.bind(null, voice)}>
                        <option value="sine">Sine</option>
                        <option value="square">Square</option>
                        <option value="sawtooth">Sawtooth</option>
                        <option value="triangle">Triangle</option>
                    </select> */}
                    <Knob label="Unison" handler={setVoiceOption.bind(null, voice, 'unison')} min={1} max={12} snap={1} value={1} defaultValue={1} precision={0} />
                    <Knob label="Unison Spread" handler={setVoiceOption.bind(null, voice, 'unisonSpread')} min={0.001} max={5} defaultValue={1} />
                </div>
                <div>
                    Output destination
                    <select onChange={setAudioConnection.bind(null, props.interface, voice, props.update)} value={getAudioConnection(props.interface, voice)}>
                        <option key="none" value="none">Main</option>
                        {props.interface.getAvailableAudioConnections(props.name).map((c, i) => <option key={i} value={c}>{c}</option>)}
                    </select>
                </div>

            </div>
            <div className="oscillator-envelope">
                <h2>Envelope (gain)</h2>
                <Switch label="Active" handler={setVoiceOption.bind(null, voice, 'useEnvelope')} />
                <Knob label="Attack" handler={setEnvelopeOption.bind(null, voice, 'attack')} min={0.001} max={5.0} value={0.1} defaultValue={0.1} />
                <Knob label="Decay" handler={setEnvelopeOption.bind(null, voice, 'decay')} min={0.001} max={5.0} value={0.001} defaultValue={0.001} />
                <Knob label="Sustain" handler={setEnvelopeOption.bind(null, voice, 'sustain')} min={0} max={1.0} value={1.0} defaultValue={1.0} />
                <Knob label="Release" handler={setEnvelopeOption.bind(null, voice, 'release')} min={0.001} max={5.0} value={0.5} defaultValue={0.5} />
                Display  <br />
            </div>
        </div>
    );
};

export default Oscillator;