import React, {Component} from 'react';
import './Controls.css';
import {lerp} from '../../Utility';

class VerticalSlider extends Component {
    constructor(props) {
        super(props);
        this.min =  props.min || 0;
        this.max =  props.max || 100;
        this.state = {
            value: props.value || 50,
            position: 0,
        };
    }

    clickHandler(e) {
        const bounds = e.currentTarget.getBoundingClientRect();
        const position = Math.max(Math.min((e.clientY - 8) - bounds.top, (bounds.bottom - bounds.top) - 14), 0);
        
        const value = lerp(this.min, this.max, position / (bounds.bottom - bounds.top - 14));
        console.log(position, value);

        if (typeof this.props.handler === 'function')
            this.props.handler(value);
        
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