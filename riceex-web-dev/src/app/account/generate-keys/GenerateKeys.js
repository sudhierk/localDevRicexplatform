import React, { Component } from 'react';
import JSEncrypt from 'jsencrypt';
import FileSaver from 'file-saver';
import Preloader from '../../components/preloader/Preloader';
import FaLock from 'react-icons/lib/fa/lock';
import FaCheckCircle from 'react-icons/lib/fa/check-circle';
import logo from '../../../static/img/logo.png';
import './generate-keys.css';

class GenerateKeys extends Component {
    state = {
        generated: false,
        inProgress: false,
        privateKey: ''
    };

    generatePair() {
        const crypt = new JSEncrypt({default_key_size: 1024});
        this.setState({
            inProgress: true
        });
        crypt.getKey(() => {
            const publicKey = crypt.getPublicKey();
            const privateKey = crypt.getPrivateKey();
            this.setState({
                inProgress: false,
                generated: true,
                privateKey
            });
            this.props.onGenerate(publicKey, privateKey);
        })
    }

    saveKey = () => {
        const blob = new Blob([this.state.privateKey], {type: 'text/plain;charset=utf-8'});
        FileSaver.saveAs(blob, 'keys.txt');
        this.props.onSave();
    };

    handleClick = () => {
        if (this.state.generated) {
            this.saveKey();
        } else {
            this.generatePair();
        }
    };

    getText = () => {
        return this.state.generated
            ? 'You have successfully generated your user keys. Please save them on your device. You will need them to complete trades on the platform. If you lose your keys you will need to contact platform administration.'
            : 'Please click the button to generate user keys. You will need keys to complete actions on the platform such as agreeing contracts.'
    };

    getIcon = () => {
        return this.state.generated
            ? <FaCheckCircle />
            : <FaLock />
    };

    render() {
        return (
            <div className="generate-keys">
                <ul className="account-tabs forgot-tab">
                    <li className="account-tab active">Registration</li>
                </ul>
                <p className="forgot-text">
                    <img className="forgot-logo" src={logo} alt="Rice exchange logo"/>
                    <div className="generate-keys__icon">
                        {this.getIcon()}
                    </div>
                    {this.getText()}
                </p>
                <button className="btn btn--blue forgot-send" onClick={this.handleClick} disabled={this.state.inProgress}>
                    <Preloader loading={this.state.inProgress} style="dots">
                        {this.state.generated ? 'Save keys' : 'Generate keys'}
                    </Preloader>
                </button>
            </div>
        );
    }
}

export default GenerateKeys;