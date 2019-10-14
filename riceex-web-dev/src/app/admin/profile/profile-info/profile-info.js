import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { parsePhoneNumberFromString } from 'libphonenumber-js'

import './profile-info.css';
import { ProfileInfoRow } from './profile-info-row';
import EditFieldModal from './edit-field-modal/edit-field-modal';
import { GetUserProfile, UpdateUserPhone } from '../../../../modules/module.account';
import Preloader from '../../../components/preloader/Preloader';
import { ProfileError } from '../profile-error';

class ProfileInfo extends Component {
    state = {
        rows: [],
        edit: null
    };

    componentDidMount() {
        this.props.GetUserProfile();
    }

    componentDidUpdate(prevProps) {
        if (this.props.userProfile !== prevProps.userProfile) {
            this.initializeRows();
        }
    }

    initializeRows() {
        const profile = this.props.userProfile;
        const phone = parsePhoneNumberFromString(profile.phone);
        const rows = [
            {
                label: 'Name',
                value: profile.first_name
            },
            {
                label: 'Surname',
                value: profile.last_name
            },
            {
                label: 'Email',
                value: profile.email
            },
            {
                label: 'Phone',
                value: phone ? phone.formatInternational() : profile.phone,
                isEditable: true,
                onEdit: () => this.onEdit('phone')
            },
            {
                label: 'Company Role',
                value: profile.company_role
            },
            {
                label: 'User Role',
                value: profile.role,
                className: 'text-capitalize'
            }
        ];
        this.setState({rows});
    }

    onEdit(field) {
        // todo change to switch case if we will be able to edit multiple fields
        if (field === 'phone') {
            this.setState({
                edit: {
                    descriptionLabel: 'phone',
                    label: 'Phone',
                    type: 'phone'
                }
            })
        }
    }

    onEditSubmit = value => {
        if (this.state.edit.type === 'phone') {
            this.props.UpdateUserPhone(value);
        }
        this.onEditClose();
    };

    onEditClose = () => {
        this.setState({edit: null});
    };

    render() {
        return (
            <div className="profile-info">
                <Preloader style="overflow-spinner" loading={this.props.loading} />
                <div className="row">
                    {this.state.rows.map(row => (
                        <ProfileInfoRow {...row} key={row.label} />
                    ))}
                    <ProfileError
                        error={this.props.error}
                        onRefresh={this.state.rows.length === 0 && !this.props.loading ? this.props.GetUserProfile : undefined}
                    />
                    {this.state.edit && (
                        <EditFieldModal
                            {...this.state.edit}
                            onClose={this.onEditClose}
                            onSubmit={this.onEditSubmit}
                        />
                    )}
                </div>
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        userProfile: state.account.userProfile,
        error: state.account.userProfileError,
        loading: state.loading.loadingUserProfile
    }
};

const mapDispatchToProps = dispatch =>
    bindActionCreators(
        {
            UpdateUserPhone,
            GetUserProfile
        },
        dispatch
    );

export default connect(mapStateToProps, mapDispatchToProps)(ProfileInfo);
