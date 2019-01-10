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

    getAngleValue(knobX, knobY, mouseX, mouseY) {
        const rawAngle = Math.atan2(mouseY - knobY, mouseX - knobX);
        let angle = Math.min(this.maxAngle, Math.max(this.minAngle, this.getFixedAngle(rawAngle)));
        let value = lerp(this.min, this.max, (angle - this.minAngle) / (this.maxAngle - this.minAngle));
        if (this.snap) {
            value = Math.floor((value + this.snap / 2) / this.snap) * this.snap;
            angle = lerp(this.minAngle, this.maxAngle, alpha(this.min, this.max, value));
        }
        return {angle, value};
    }

    pressHandler(e) {
        const bounds = e.currentTarget.getBoundingClientRect();
        const knobCenterX = bounds.x + bounds.width / 2;
        const knobCenterY = bounds.y + bounds.height / 2;
        console.log('press', knobCenterX, knobCenterY);
        
        const onMouseMove = ((e) => {
            const o = this.getAngleValue(knobCenterX, knobCenterY, e.clientX, e.clientY);
            this.setState(o);
        }).bind(this);
        document.addEventListener('mousemove', onMouseMove);

        const onMouseUp = ((e) => {
            console.log('release', this.state.angle, this.state.value);
            const o = this.getAngleValue(knobCenterX, knobCenterY, e.clientX, e.clientY);
            if (typeof this.props.handler === 'function')
                this.props.handler(o.value);
            this.setState(o);
            document.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('mousemove', onMouseMove);
        }).bind(this);
        document.addEventListener('mouseup', onMouseUp);
    }

    render() {
        return (
            <div className="knob-container">
                <div className="knob" onMouseDown={this.pressHandler.bind(this)} style={{transform: 'rotate(' + (this.state.angle + (Math.PI / 2)) + 'rad)'}}>|</div> <br />
                {this.props.label && <div className="knob-label">{this.props.label}</div>}
            </div>
        );
    }
}

export {Knob};