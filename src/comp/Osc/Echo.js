import React from 'react';
import {Knob} from '../Controls/Knobs';

const logHandler = function() {
    console.log(arguments);
};

const setDelay = (delay, value) => {
    delay.setDelay(value);
};

const setDecay = (delay, value) => {
    delay.setDecay(value);
};

const Echo = (props) => {
    const echo = props.interface.getFromName(props.name);
    return (
        <div className="node echo">
            <h3 onDoubleClick={logHandler}>{props.name}</h3>
            <Knob label="Delay" handler={setDelay.bind(null, echo)} min={0.001} max={2} defaultValue={0.2} continuous={true} />
            <Knob label="Decay Gain" handler={setDecay.bind(null, echo)} min={0.001} max={0.9999} defaultValue={0.2} continuous={true} />

        </div>
    );
};

export default Echo;