import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import './main.css';
import S2Audio from './audio/audio';
import Keys from './audio/keys';


const audioEngine = new S2Audio();
// audioEngine.start();

class Main extends Component {
    state = {
        text: 'SO HERE I AMMM DOIN EVVEEREYTHANG I CANN',
    }
    render() {
        return (
        <div className="main">
            {this.state.text}
            <button id="start-engine" onClick={audioEngine.start}>Start</button>
        </div>);
    }
}

window.addEventListener('load', (e) => {
    // Keys((note) => console.log(note));
    const container = document.getElementById('react-app');
    if (container)
        ReactDOM.render(<Main />, container);
    else
        console.log('No react container found! Expected "#react-app"');

});

// export default Main;