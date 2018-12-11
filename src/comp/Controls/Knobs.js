import React, {Component} from 'react';
import {lerp, alpha} from '../../Utility';

/**
 * Rotating Knob React Component. Rotates clockwise between two angles, lerps a value from the angles and min/max values into a handler
 * @param min Minimum value to send to handler. Default: 0
 * @param max Maximum value to send to handler. Default: 100
 * @param minAngle Minimum angle allowed. Default  Note that down (Math.PI / 2) is the absolute minimum/maximum
 * @param maxAngle Maximum angle allowed. Note that down (Math.PI / 2) is the absolute minimum/maximum
 * @param value Initial value
 * @param handler
 */
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

        const value = props.value || (this.min + (this.max - this.min) / 2);
        const angle = lerp(this.minAngle, this.maxAngle, alpha(this.min, this.max, value));

        this.state = {
            value,
            angle
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
            <div className="knob-container">
                <div className="knob" onClick={this.clickHandler.bind(this)} style={{transform: 'rotate(' + (this.state.angle + (Math.PI / 2)) + 'rad)'}}>^</div> <br />
                {this.props.label && <div className="knob-label">{this.props.label}</div>}
            </div>
        );
    }
}

export {Knob};