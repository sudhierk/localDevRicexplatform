import React, { Component } from 'react';
import { Table, Button } from 'antd';
import { KycApi } from '../../../services/service.api';
import moment from 'moment';

import './last-added-kyc.css';

const columns = [
    {
        title: 'Company Name',
        dataIndex: 'name',
        key: 'name',
        render: text => <span className="company-name">{text}</span>,
    },
    {
        title: 'Users',
        dataIndex: 'users',
        key: 'users',
        render: text => <span className="users-count">{text}</span>,
    },
    {
        title: 'Added',
        dataIndex: 'added',
        key: 'added',
        render: text => <span className="added-by">{text}</span>,
    },
    {
        title: 'Status',
        key: 'status',
        dataIndex: 'status',
        render: text => <span className="status">{text}</span>,
    },
    {
        title: 'Options',
        key: 'options',
        render: () => (
            <span>
                <Button disabled className="mr-2" ghost={true} type="primary">View</Button>
                <Button disabled ghost={true} type="primary">Managing Users</Button>
            </span>
        ),
    },
];

class LastAddedKyc extends Component {

    state = {
        data: null,
        loading: false
    };

    params = {
        skip: 0,
        take: 5,
        statuses: 'SUBMITTED',
        order: 'desc',
        sorting: 'Date'
    };

    componentDidMount() {
        this.fetch();
    }

    fetch = () => {
        this.setState({loading: true});
        KycApi.getAll(this.params)
            .then(response => {
                const data = response.data.kycs.map(({kyc, usersInCompany, registeredUserName}) => ({
                    name: kyc.name,
                    users: usersInCompany,
                    added: `by ${registeredUserName} ${moment(kyc.Date).format('MM/DD/YYYY')}`,
                    status: kyc.visitedByPlatformAdmin ? 'In progress' : 'New'
                }));
                this.setState({loading: false, data});
            })
            .catch((error) => {
                console.error(error);
                this.setState({loading: false});
            });
    };

    render() {
        return (
            <div className="container-fluid pa-dashboard-container last-added-kyc">
                <div className="pa-dashboard__header">
                    <div className="title">
                        Last added KYC
                    </div>
                    <Button type="primary" size="large" disabled>View All</Button>
                </div>
                <Table
                    className="pa-dashboard__table-wrapper"
                    rowClassName="pa-dashboard__table__row"
                    loading={this.state.loading}
                    pagination={false}
                    columns={columns}
                    dataSource={this.state.data}
                    scroll={{x: true}}
                />
            </div>
        );
    }
}

export default LastAddedKyc;
