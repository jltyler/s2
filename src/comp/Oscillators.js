import React, {Component} from 'react';

class Oscillators extends Component {
    constructor(props) {
        super(props);

        this.state = {
            oscCount: 3,
        };
    }

    render() {
        return (
            <div className="oscillators">
                OSCILLATORS
            </div>
        );
    }
}

export default Oscillators;