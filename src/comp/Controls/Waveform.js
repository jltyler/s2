import React, {Component} from 'react';
import sineWave from '../../img/waveform/sine.svg';
import squareWave from '../../img/waveform/square.svg';
import triangleWave from '../../img/waveform/triangle.svg';
import sawWave from '../../img/waveform/saw.svg';

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
        const waveforms = ['sine', 'square', '!', 'triangle', 'sawtooth'];
        if (this.props.waves && this.props.waves instanceof Array) {
            waveforms.concat(this.props.waves);
        }
        const images = [sineWave, squareWave, null, triangleWave, sawWave];
        const size = this.props.size ? this.props.size : '28px';
        return (
            <div className="waveform-container">
                <ul>
                    {waveforms.map((w, i) => {
                        return w === '!' ? <br /> : <li className={this.state.selected === w ? 'selected' : ''} key={i} onClick={this.clickHandler.bind(this, w)}><img width={size} height={size} src={images[i]} /></li>;
                    })}
                </ul>
            </div>
        );
    }
}

export default Waveform;