import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import './main.css';

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

console.log('hmmm...');

window.addEventListener('load', (e) => {
    const container = document.getElementById('react-app');
    if (container) {
        console.log('In the pipe. Five by five.');
        ReactDOM.render(<Main />, container);
    } else {
        console.log('god damn you GOD DAMN YOU');
    }
});

// export default Main;