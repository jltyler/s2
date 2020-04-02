import React, {Component} from 'react';
import { Switch } from './Switches';

const setConnection = (s2, source, dest, param, value) => {
    if (value) {
        s2.addConnection(source, dest, param);
    } else {
        s2.removeConnection(source, dest, param);
    }
};

class ParamConnection extends Component {
    constructor(props) {
        super(props);
        this.s2 = props.s2;
        this.name = props.name;
        this.state = {
            show: false,
            current: []
        };
    }

    setConnection(dest, param, value) {
        setConnection(this.s2, this.name, dest, param, value);
        this.setState((prevState) => {
            const current = prevState.current.slice();
            if (value && !current.some ((d) => (d[0] === dest && d[1] === param))) {
                current.push([dest, param]);
            }
            return { current, show: false };
        });
    }

    removeCurrent(index) {
        this.setState((prevState) => {
            const current = prevState.current.slice();
            current.splice(index, 1);
            return { current };
        });
    }

    renderDisplayList() {
        const active = this.s2.getConnectionsBySource(this.name);
        if (this.state.show) {
            return this.s2.getParamConnectionDestinations(this.name).map((d, i) => {
                const on = active.some((dd) => (dd.dest.name === d[0] && dd.param === d[1]));
                return (<li key={d}>
                    <Switch handler={this.setConnection.bind(this, d[0], d[1])} value={on} />
                    <span>${d[0]}.${d[1]}</span>
                </li>);
            }
            );
        } else {
            return this.state.current.map((d, i) => {
                const on = active.some((dd) => (dd.dest.name === d[0] && dd.param === d[1]));
                // console.log(`${d[0]}.${d[1]}: `, on);
                return (<li key={d}>
                    <Switch handler={this.setConnection.bind(this, d[0], d[1])} value={on} />
                    <span>${d[0]}.${d[1]}</span>
                    {!on ? <button onClick={this.removeCurrent.bind(this, i)}>X</button> : ''}
                </li>);
            });
        }
    }

    setShow(value) {
        this.setState({show: value});
    }

    render() {
        return (<div>
            <h4>Parameter Connections</h4>
            <ul className="param-connection-list">
                {this.renderDisplayList()}
            </ul>
            <button onClick={this.setShow.bind(this, true)}>+</button>
        </div>);
    }
}

export default ParamConnection;