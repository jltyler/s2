import React from 'react';
import S2Audio from '../../audio/audio';
import { Switch } from './Switches';
import { StringDecoder } from 'string_decoder';

/**
 *
 * @param {S2Audio} s2
 * @param {*} source
 * @param {*} dest
 * @param {*} param
 * @param {*} value
 */
const setConnection = (s2, source, dest, param, value) => {
    if (value) {
        s2.addConnection(source, dest, param);
    } else {
        s2.removeConnection(source, dest, param);
    }
};

const ParamConnection = (props) => {
    const validDestinations = props.s2.getParamConnectionDestinations(props.name);
    return (<div>
        <h4>Parameter Connections</h4>
        <ul className="param-connection-list">
            {validDestinations.map((d, i) => {
                return (<li key={i}>
                    <Switch handler={setConnection.bind(null, props.s2, props.name, d[0], d[1])} />
                        <span>${d[0]}.${d[1]}</span>
                    </li>);
            })}
        </ul>
    </div>);
};

export default ParamConnection;