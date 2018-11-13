import React, {Component} from 'react';
import './Controls.css';
import {lerp} from '../../Utility';

class VerticalSlider extends Component {
    constructor(props) {
        super(props);
        this.state = {
            min: props.min || 0,
            max: props.max || 100,
            value: props.value || 50,
            position: 0,
        };
    }

    clickHandler(e) {
        const bounds = e.currentTarget.getBoundingClientRect();
        const position = Math.max(Math.min((e.clientY - 8) - bounds.top, (bounds.bottom - bounds.top) - 12), 0);
        console.log(position);
        
        const value = lerp(this.state.min, this.state.max, position / (bounds.bottom - bounds.top - 12));
        console.log(value);
        
        this.setState({
            value,
            position,
        });
    }

    render() {
        return (
            <div className="slider-vertical" onClick={this.clickHandler.bind(this)}>
                <div className="slider-vertical-slot" />
                <div className="slider-vertical-bar" style={{top: this.state.position}}/>
            </div>
        );
    }
}

export {VerticalSlider};