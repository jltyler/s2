import React, {Component} from 'react';
import {lerp} from '../../Utility';

class Knob extends Component {
    constructor(props) {
        super(props);
        this.min = props.min || 0;
        this.max = props.max || 100;
        this.minAngle = props.minAngle || Math.PI * .75;
        if (this.minAngle < Math.PI / 2)
            this.minAngle += Math.PI * 2;
        this.maxAngle = props.maxAngle || Math.PI * 2.25;
        if (this.maxAngle <= this.minAngle)
            this.maxAngle += Math.PI * 2;
        this.state = {
            value: props.value || 50,
            angle: 0
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
        const angle = Math.min(this.maxAngle, Math.max(this.minAngle, this.getFixedAngle(rawAngle)));
        const value = lerp(this.min, this.max, (angle - this.minAngle) / (this.maxAngle - this.minAngle));
        console.log(bounds.x, bounds.y, centerPoint, rawAngle, angle, value);
        if (typeof this.props.handler === 'function')
            this.props.handler(value);
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