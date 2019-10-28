import React from 'react';
import {Knob} from '../Controls/Knobs';

const logHandler = function() {
    console.log(arguments);
};


const Echo = (props) => {
    const echo = props.interface.getFromName(props.name);
    return (
        <div className="echo">
            <h3 onDoubleClick={logHandler}>{props.name}</h3>
            <Knob label="Delay" handler={logHandler} min={0.001} max={4} defaultValue={0.2} />
            <Knob label="Decay Gain" handler={logHandler} min={0.001} max={0.9999} defaultValue={0.2} />

        </div>
    );
};

export default Echo;