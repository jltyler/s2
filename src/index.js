import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import './main.css';

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
    const container = document.getElementById('react-app');
    if (container) {
        ReactDOM.render(<Main />, container);
    } else {
        console.error('No react container found!');
    }
});
