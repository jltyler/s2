import React from 'react';
import './Nav.css';

const NavItem = (props) => {
    return (
        <div className="nav-item">
            {props.name}
        </div>
    );
};

const Nav = (props) => {
    return (
    <div className="nav">
        <NavItem name="Oscillators" />
        <NavItem name="Filters" />
        <NavItem name="Mixer" />
        <NavItem name="Options" />
    </div>
    );
};

export default Nav;