import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import './main.css';
import S2Audio from './audio/audio';
import Keys from './audio/keys';

class Main extends Component {
    render() {
        return (
            <div className="container">
                <header className="header">
                Nav Component
                </header>
                <main className="main">
                    Main Area
                </main>
                <footer className="footer">
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
