import React from 'react';
import './Landing.css';

const LandingPage = (props) => {
    return (
    <div className={'landing-page' + (props.hidden ? 'hidden' : '')}>
        <button className="landing-button" onClick={props.clickHandler}>Let's Go!</button>
    </div>
    );
}

export default LandingPage;