import React, { Component } from 'react';
import './footer.css';

class Footer extends Component {
    year = new Date().getFullYear();

    render() {
        return (
            <React.Fragment>
                <div className="footer col-12">
                    Copyright &copy; RiceExchange {this.year}
                </div>
            </React.Fragment>
        )
    }
}

export default Footer;

