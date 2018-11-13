import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import './main.css';
import S2Audio from './audio/audio';
import Keys from './audio/keys';
import Nav from "./comp/Nav";
import Oscillators from './comp/Osc/Oscillators';

class Container extends Component {
    constructor(props) {
        super(props);

        this.state = {
            mainDisplay: 'osc',
            extended: false,
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

    toggleFooter() {
        this.setState((prevState) => {
            return {extended: !prevState.extended};
        });
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
                <footer className={'footer' + (this.state.extended ? ' extended' : '')}>
                    <button onClick={this.toggleFooter.bind(this)} >{this.state.extended ? 'v' : '^'}</button>
                    Footre
                </footer>
            </div>
        );
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
