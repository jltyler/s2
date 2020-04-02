import React, {Component} from 'react';

class Waveform extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selected: 'sawtooth'
        };
    }

    clickHandler(waveform) {
        if (this.props.handler && typeof this.props.handler === 'function') {
            this.props.handler(waveform);
        }
        this.setState({selected: waveform});
    }

    render() {
        const waveforms = ['sine', 'square', 'triangle', 'sawtooth'];
        if (this.props.waves && this.props.waves instanceof Array) {
            waveforms.concat(this.props.waves);
        }
        return (
            <div className="waveform-container">
                <ul>
                    {waveforms.map((w, i) => {
                        return <li className={this.state.selected === w ? 'selected' : ''} key={i} onClick={this.clickHandler.bind(this, w)}>{w}</li>;
                    })}
                </ul>
            </div>
        );
    }
}

export default Waveform;