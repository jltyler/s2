import React, {Component} from 'react';

class Name extends Component {
    constructor(props) {
        super(props);
        this.state = {
            name: props.name,
            edit: false
        };
        // this.handler = props.handler;
        this.temp = props.name;
    }

    showInput(e) {
        this.setState({edit: true});
    }

    hideInput(e) {
        if (this.props.handler) this.props.handler(this.temp);
        this.setState({
            edit: false,
            name: this.temp
        });
    }

    render() {
        const element = this.state.edit ?
            <input type="text" onBlur={this.hideInput.bind(this)} onInput={(e) => this.temp = e.target.value}></input> :
            <span onDoubleClick={this.showInput.bind(this)}>{this.state.name}</span>;
        return (
        <h2 className="name">
            {element}
        </h2>);
    }
}

export default Name;