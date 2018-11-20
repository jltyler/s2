import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import './main.css';
import S2Audio from './audio/audio';
import Keys from './audio/keys';


const audioEngine = new S2Audio();
audioEngine.start();

const textChoices = [
    'SO HERE I AMMM DOIN EVVEEREYTHANG I CANN',
    'Razhihliv Sylvia Pope',
    'Coenauho Elnora Page',
    'Oneuseko Lina Robbins',
    'Fijguras Agnes Wheeler',
    'Dawsinase Erik Anderson',
    'Famcefuve Maud Wells',
    '12.122.48.31',
    '148.252.171.117',
    '89.173.75.17',
    '202.255.45.201',
    '191.139.71.237',
    '16.117.246.93',
];

class Main extends Component {
    state = {
        text: 'SO HERE I AMMM DOIN EVVEEREYTHANG I CANN',
    }
    componentDidMount() {
        setInterval((e) => {
            this.setState({
                text: textChoices[(Math.random() * textChoices.length) | 0],
            });
        }, 1000)
    }
    render() {
        return (<div className="main">{this.state.text}</div>);
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