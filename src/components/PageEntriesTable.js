
import React from 'react';

import { Table  } from 'antd';

class PageEntriesTable extends React.Component {
    constructor(props) {
        super(props);
        this.columns = [{
            title: 'File',
            dataIndex: 'name'
            }, {
            title: 'Field id',
            dataIndex: 'id',
            sorter: (a, b) => a.id.length - b.id.length,
            }, {
            title: 'Widget',
            dataIndex: 'tagName',
            sorter: (a, b) => a.tagName.length - b.tagName.length,
            }, {
            title: 'Value',
            dataIndex: 'options'
            }];
    }

    onChange = (pagination, filters, sorter) => {
        console.log('params', pagination, filters, sorter);
    }

    render() {
        return (
            <Table columns={this.columns} dataSource={this.props.dataSource} onChange={this.onChange} />
        )
    }
}

export default PageEntriesTable;