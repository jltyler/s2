import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import LandingPage from './comp/Landing';
import './reset.css';
import './main.css';
import S2Audio from './audio/audio';
import Nav from "./comp/Nav";
import Oscillators from './comp/Osc/Oscillators';

const s2audio = new S2Audio();

class Main extends Component {
    constructor(props) {
        super(props);

        this.state = {
            mainDisplay: 'osc',
            showFooter: false,
            showLanding: true,
            removeLanding: false
        };

        this.toggleFooter = this.toggleFooter.bind(this);
        this.hideLandingPage = this.hideLandingPage.bind(this);
    }

    renderMainDisplay() {
        switch (this.state.mainDisplay) {
            case 'osc':
                return (
                    <Oscillators interface={s2audio} />
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
            return {showFooter: !prevState.showFooter};
        });
    }

    hideLandingPage() {
        this.setState({showLanding: false});
        setTimeout(() => this.setState({removeLanding: true}), 1000);
        s2audio.init();
    }

    render() {
        return (
            <div className="container">
                {(!this.state.removeLanding) && <LandingPage hidden={!this.state.showLanding} clickHandler={this.hideLandingPage} />}
                <button onClick={s2audio.keysOn}>Testing time</button>
                <button onClick={s2audio.stop}>Make it stop!!!</button>
                <button onClick={() => console.log('Params', s2audio.paramConnections)}>Params</button>
                <button onClick={() => console.log('Destinations', s2audio.audioConnections)}>Destinations</button>
                <button onClick={() => console.log('Nodes', s2audio.getAllNodes())}>Nodes</button>
                <button onClick={() => console.log('Debug', s2audio.getConnectionsDebug())}>Debug connections</button>
                <main className="main">
                    {this.renderMainDisplay()}
                </main>
                {/* <footer className={'footer' + (this.state.showFooter ? ' extended' : '')}>
                    <button onClick={this.toggleFooter} >{this.state.showFooter ? 'v' : '^'}</button>
                    Footre
                </footer> */}
            </div>
        );
    }
}

window.addEventListener('load', () => {
    // Keys((note) => console.log(note));
    const container = document.getElementById('react-app');
    if (container)
        ReactDOM.render(<Main />, container);
    else
        console.log('No react container found! Expected "#react-app"');

});
