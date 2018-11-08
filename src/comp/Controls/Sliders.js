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
        console.log('clickHandler.this:',this);
        const bounds = e.target.getBoundingClientRect();
        const position = e.clientY - bounds.top;
        console.log(position);
        
        const value = lerp(this.state.min, this.state.max, position / (bounds.bottom - bounds.top));
        console.log(value);
        
        this.setState({
            value,
            position,
        });
    }

    render() {
        return (
            <div className="slider-vertical" onClick={this.clickHandler.bind(this)}>
                <div className="slider-vertical-bar" style={{top: this.state.position}}/>
            </div>
        );
    }
}

export {VerticalSlider};