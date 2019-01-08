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
        this.min = (typeof props.min === 'number' ? props.min : 0);
        this.max = (typeof props.max === 'number' ? props.max : 100);

        this.minAngle = (typeof props.minAngle === 'number' ? props.minAngle : Math.PI * .75);
        while (this.minAngle < 0)
            this.minAngle += Math.PI * 2;
        while (this.minAngle >= Math.PI * 2)
            this.minAngle -= Math.PI * 2;

        this.maxAngle = (typeof props.maxAngle === 'number' ? props.maxAngle : Math.PI * 2.25);
        while (this.maxAngle <= this.minAngle)
            this.maxAngle += Math.PI * 2;
        while (this.maxAngle > this.minAngle + Math.PI * 2)
            this.maxAngle -= Math.PI * 2;

        this.angleOfSeperation = this.maxAngle + ((Math.PI * 2) - (this.maxAngle - this.minAngle)) / 2;
        if (this.angleOfSeperation >= Math.PI * 2)
            this.angleOfSeperation -= Math.PI * 2;
        // this.angleOfSeperation = this.minAngle + (this.maxAngle - this.minAngle) / 2;

        // console.log('Knob', this.minAngle / Math.PI, this.maxAngle / Math.PI, this.angleOfSeperation / Math.PI);

        const value = props.value || (this.min + (this.max - this.min) / 2);
        const angle = lerp(this.minAngle, this.maxAngle, alpha(this.min, this.max, value));

        this.snap = props.snap;

        this.state = {
            value,
            angle
        };
    }

    getFixedAngle(rawAngle) {
        if (rawAngle < 0)
            rawAngle = Math.PI + (Math.PI + rawAngle);
        if (rawAngle < this.angleOfSeperation)
            rawAngle += Math.PI * 2;
        return rawAngle;
    }

    clickHandler(e) {
        const bounds = e.currentTarget.getBoundingClientRect();
        const centerPoint = [
            bounds.x + bounds.width / 2,
            bounds.y + bounds.height / 2
        ];
        const rawAngle = Math.atan2(e.clientY - centerPoint[1], e.clientX - centerPoint[0]);
        let angle = Math.min(this.maxAngle, Math.max(this.minAngle, this.getFixedAngle(rawAngle)));
        let value = lerp(this.min, this.max, (angle - this.minAngle) / (this.maxAngle - this.minAngle));

        if (this.snap) {
            value = Math.floor((value + this.snap / 2) / this.snap) * this.snap;
            angle = lerp(this.minAngle, this.maxAngle, alpha(this.min, this.max, value));
        }
        // console.log(rawAngle, this.getFixedAngle(rawAngle), angle);
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
                <div className="knob" onClick={this.clickHandler.bind(this)} style={{transform: 'rotate(' + (this.state.angle + (Math.PI / 2)) + 'rad)'}}>|</div> <br />
                {this.props.label && <div className="knob-label">{this.props.label}</div>}
            </div>
        );
    }
}

export {Knob};