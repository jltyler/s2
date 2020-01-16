import React from 'react';
import {Knob} from '../Controls/Knobs';
import './Filter.css';

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
        <div className="filter">
            <h3>{props.name}</h3>
            <div>
                <Knob label="Frequency" handler={setOption.bind(null, filter, 'frequency')} min={0} max={22050} value={22050} />
                <Knob label="Q" handler={setOption.bind(null, filter, 'Q')} min={0.00001} max={10.0} value={1.0} />
                <Knob label="Gain" handler={setOption.bind(null, filter, 'gain')} min={-20.0} max={20.0} value={0.0} />
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