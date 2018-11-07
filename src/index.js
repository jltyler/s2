import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import './main.css';
import Nav from "./comp/Nav";
import Oscillators from './comp/Osc/Oscillators';

class Container extends Component {
    constructor(props) {
        super(props);
        
        this.state = {
            mainDisplay: 'osc',
        };
    }

    renderMainDisplay() {
        switch (this.state.mainDisplay) {
            case 'osc':
                return (
                    <Oscillators />
                );
                break;
        
            default:
                return (
                    <div className="main-display-error">INVALID DISPLAY</div>
                );
                break;
        }
    }

    render() {
        return (
            <div className="container">
                <header className="header">
                <Nav />
                </header>
                <main className="main">
                    {this.renderMainDisplay()}
                </main>
                <footer className="footer">
                    Footre
                </footer>
            </div>
        );
    }
}

window.addEventListener('load', (e) => {
    const container = document.getElementById('react-app');
    if (container) {
        ReactDOM.render(<Container />, container);
    } else {
        console.error('No react container found!');
    }
});
