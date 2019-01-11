import React, {Component} from 'react';
import './Controls.css';
import {lerp, alpha} from '../../Utility';

class VerticalSlider extends Component {
    constructor(props) {
        super(props);
        this.min = (typeof props.min === 'number' ? props.min : 0);
        this.max = (typeof props.max === 'number' ? props.max : 100);
        this.state = {
            value: props.value || 50,
            position: 0,
        };
    }

    pressHandler(e) {
        const bounds = e.currentTarget.getBoundingClientRect();
        const verticalRange = (bounds.bottom - bounds.top) - 14;

        const onMouseMove = (e) => {
            // const position = Math.max(Math.min((e.clientY - 8) - bounds.top, (bounds.bottom - bounds.top) - 14), 0);
            // const value = lerp(this.min, this.max, position / (bounds.bottom - bounds.top - 14));
            let position = Math.max(Math.min((e.clientY - 8) - bounds.top, verticalRange), 0);
            let value = lerp(this.min, this.max, position / verticalRange);

            if (this.props.snap) {
                value = Math.floor(value / this.props.snap + 0.5) * this.props.snap;
                position = alpha(this.min, this.max, value) * verticalRange;
            }

            this.setState({position});
        };
        document.addEventListener('mousemove', onMouseMove);

        const onMouseUp = (e) => {
            // const verticalRange = (bounds.bottom - bounds.top) - 14;
            let position = Math.max(Math.min((e.clientY - 8) - bounds.top, verticalRange), 0);
            let value = lerp(this.min, this.max, position / verticalRange);

            if (this.props.snap) {
                value = Math.floor(value / this.props.snap + 0.5) * this.props.snap;
                position = alpha(this.min, this.max, value) * verticalRange;
            }

            if (typeof this.props.handler === 'function')
            this.props.handler(value);

            this.setState({position, value});
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mouseup', onMouseUp);
    }

    render() {
        return (
            <div className="slider-vertical" onMouseDown={this.pressHandler.bind(this)}>
                <div className="slider-vertical-slot" />
                <div className="slider-vertical-bar" style={{top: this.state.position}}/>
            </div>
        );
    }
}

export {VerticalSlider};