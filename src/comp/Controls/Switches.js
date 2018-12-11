import React, {Component} from 'react';

class Switch extends Component {
    constructor(props) {
        super(props);
        this.state = {
            active: props.value || false
        };
    }

    clickHandler() {
        if (this.props.handler) this.props.handler(!this.state.active);
        this.setState((prevState) => ({active: (!prevState.active)}));
    }

    render() {
        return (
            <div className="switch-container">
                <div className={'switch ' + (this.state.active ? 'on' : 'off') } onClick={this.clickHandler.bind(this)} /><br />
                {this.props.label && <div className="switch-label">{this.props.label}</div>}
            </div>
        );
    }
}

export {Switch};