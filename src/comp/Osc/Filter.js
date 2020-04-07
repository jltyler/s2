import React from 'react';
import {Knob} from '../Controls/Knobs';

const setOption = (filter, option, freq) => {
    filter.setOption(option, freq);
};

const setType = (filter, e) => {
    console.log(e.target.value);
    filter.setOption('type', e.target.value);
};

const setAudioConnection = (iface, filter, update, e) => {
    if (e.target.value === 'none') iface.removeAudioConnection(filter.name);
    iface.addAudioConnection(filter.name, e.target.value);
    update(); // There has got to be a better way of doing this
};

const getAudioConnection = (iface, filter) => {
    const r = iface.getAudioConnection(filter.name);
    return r || 'none';
};

const Filter = (props) => {
    const filter = props.interface.getFromName(props.name);
    return (
        <div className="node filter">
            <h3>{props.name}</h3>
            <div>
                <Knob label="Frequency" handler={setOption.bind(null, filter, 'frequency')} min={0} max={22050} value={22050} continuous={true} />
                <Knob label="Q" handler={setOption.bind(null, filter, 'Q')} min={0} max={11} curve={1} a={0.001} b={4.35} value={0.01} continuous={true} />
                <Knob label="Gain" handler={setOption.bind(null, filter, 'gain')} min={-20.0} max={20.0} value={0.0} continuous={true} />
                <select onChange={setType.bind(null, filter)}>
                    <option value="lowpass">Lowpass</option>
                    <option value="highpass">Highpass</option>
                    <option value="bandpass">Bandpass</option>
                    <option value="lowshelf">Lowshelf</option>
                    <option value="highshelf">Highshelf</option>
                    <option value="peaking">Peaking</option>
                    <option value="notch">Notch</option>
                    <option value="allpass">Allpass</option>
                </select>
            </div>
            <div>
                Output destination
                <select onChange={setAudioConnection.bind(null, props.interface, filter, props.update)} value={getAudioConnection(props.interface, filter)}>
                    <option key="none" value="none">Main</option>
                    {props.interface.getAvailableAudioConnections(props.name).map((c, i) => <option key={i} value={c}>{c}</option>)}
                </select>
            </div>
        </div>
    );
};

export default Filter;