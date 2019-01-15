import React from 'react';
import './Landing.css';
import {Knob} from './Controls/Knobs';

const logHandler = function() {console.log('this:', this, '\narguments:', arguments);};

const LandingPage = (props) => {
    return (
    <div className={'landing-page' + (props.hidden ? 'hidden' : '')}>
        <Knob label="Test" handler={logHandler} min={20} max={80} snap={0.25} defaultValue={70}/>
        <button className="start-button" onClick={props.clickHandler}>Let's Go!</button>
    </div>
    );
}

export default LandingPage;