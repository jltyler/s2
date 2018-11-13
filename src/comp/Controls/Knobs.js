import React, {Component} from 'react';
import {lerp} from '../../Utility';

class Knob extends Component {
    constructor(props) {
        super(props);
        let minAngle = props.minAngle || Math.PI * .75;
        if (minAngle < Math.PI / 2)
            minAngle += Math.PI * 2;
        let maxAngle = props.maxAngle || Math.PI * 2.25;
        if (maxAngle <= minAngle)
            maxAngle += Math.PI * 2;
        this.state = {
            min: props.min || 0,
            max: props.max || 100,
            value: props.value || 50,
            angle: 0,
            minAngle,
            maxAngle
        };
    }

    getFixedAngle(rawAngle) {
        if (rawAngle < 0)
            return Math.PI + (Math.PI + rawAngle);
        else if (rawAngle < Math.PI / 2)
            return Math.PI * 2 + rawAngle;
        else return rawAngle;
    }

    clickHandler(e) {
        const bounds = e.currentTarget.getBoundingClientRect();
        const centerPoint = [
            bounds.x + bounds.width / 2,
            bounds.y + bounds.height / 2
        ];
        const rawAngle = Math.atan2(e.clientY - centerPoint[1], e.clientX - centerPoint[0]);
        let angle = this.getFixedAngle(rawAngle);
        angle = Math.min(this.state.maxAngle, Math.max(this.state.minAngle, angle));
        const value = lerp(this.state.min, this.state.max, (angle - this.state.minAngle) / (this.state.maxAngle - this.state.minAngle));
        console.log(bounds.x, bounds.y, centerPoint, rawAngle, angle, value);
        this.setState({
            angle,
            value
        });
    }

    render() {
        return (
            <div className="knob" onClick={this.clickHandler.bind(this)} style={{transform: 'rotate(' + (this.state.angle + (Math.PI / 2)) + 'rad)'}}>^</div>
        );
    }
}

export {Knob};