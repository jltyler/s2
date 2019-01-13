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

        // Angle that is centered between max and min (outside the usable range)
        this.angleOfSeperation = this.maxAngle + ((Math.PI * 2) - (this.maxAngle - this.minAngle)) / 2;
        if (this.angleOfSeperation >= Math.PI * 2)
            this.angleOfSeperation -= Math.PI * 2;

        const value = props.value || (this.min + (this.max - this.min) / 2);
        const angle = lerp(this.minAngle, this.maxAngle, alpha(this.min, this.max, value));

        this.snap = props.snap;

        this.state = {
            value,
            angle,
            editing: false
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
        if (this.props.snap) {
            value = Math.floor((value + this.props.snap / 2) / this.props.snap) * this.props.snap;
            angle = lerp(this.minAngle, this.maxAngle, alpha(this.min, this.max, value));
        }
        return {angle, value};
    }

    startEditing(e) {
        if (this.state.editing) return;
        this.setState({editing: true});
    }

    stopEditing(e) {
        this.setState({editing: false});
    }

    pressHandler(e) {
        console.log(e.button);

        if (e.button === 0) {
            // Left click
            const bounds = e.currentTarget.getBoundingClientRect();
            const knobCenterX = bounds.x + bounds.width / 2;
            const knobCenterY = bounds.y + bounds.height / 2;

            const onMouseMove = ((e) => {
                this.setState(this.getAngleValue(knobCenterX, knobCenterY, e.clientX, e.clientY));
            })//.bind(this);
            document.addEventListener('mousemove', onMouseMove);

            const onMouseUp = ((e) => {
                const o = this.getAngleValue(knobCenterX, knobCenterY, e.clientX, e.clientY);
                if (typeof this.props.handler === 'function')
                    this.props.handler(o.value);
                this.setState(o);
                document.removeEventListener('mouseup', onMouseUp);
                document.removeEventListener('mousemove', onMouseMove);
            })//.bind(this);
            document.addEventListener('mouseup', onMouseUp);
        } else if (e.button === 1) {
            // Middle click
            e.preventDefault();
            if (typeof this.props.defaultValue === 'number') this.setState({value: this.props.defaultValue});
        } else if (e.button === 2) {
            // Right click
            e.preventDefault();
            e.stopPropagation();
            this.startEditing();
        }

    }



    render() {
        return (
            <div className="knob-container" onContextMenu={()=>false}>
                <div className="knob-value-label"></div>
                <div className="knob" onMouseDown={this.pressHandler.bind(this)} style={{transform: 'rotate(' + (this.state.angle + (Math.PI / 2)) + 'rad)'}}>|</div> <br />
                {this.props.label && <div className="knob-label">{this.props.label}</div>}
                {this.state.editing && <div className="knob-edit" style={{top: 0}}>
                    <input type="number" placeholder="value"></input>
                    <input type="number" placeholder="min"></input>
                    <input type="number" placeholder="max"></input>
                    <input type="number" placeholder="snap"></input>
                    <button onClick={this.stopEditing.bind(this)}>X</button>
                </div>}
            </div>
        );
    }
}

export {Knob};