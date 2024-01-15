
import React from 'react';
import { Table, Input, Button, Popconfirm, Form } from 'antd';

const FormItem = Form.Item;
const EditableContext = React.createContext();

const EditableRow = ({ form, index, ...props }) => (
    <EditableContext.Provider value={form}>
        <tr {...props} />
    </EditableContext.Provider>
);

const EditableFormRow = Form.create()(EditableRow);

class EditableCell extends React.Component {
    state = {
        editing: false,
    }

    componentDidMount() {
        if (this.props.editable) {
            document.addEventListener('click', this.handleClickOutside, true);
        }
    }

    componentWillUnmount() {
        if (this.props.editable) {
            document.removeEventListener('click', this.handleClickOutside, true);
        }
    }

    toggleEdit = () => {
        const editing = !this.state.editing;
        this.setState({ editing }, () => {
            if (editing) {
                this.input.focus();
            }
        });
    }

    handleClickOutside = (e) => {
        const { editing } = this.state;
        if (editing && this.cell !== e.target && !this.cell.contains(e.target)) {
            this.save();
        }
    }

    save = () => {
        const { record, handleSave } = this.props;
        this.form.validateFields((error, values) => {
            if (error) {
                return;
            }
            this.toggleEdit();
            handleSave({ ...record, ...values });
        });
    }

    render() {
        const { editing } = this.state;
        const {
            editable,
            dataIndex,
            title,
            record,
            index,
            handleSave,
            ...restProps
        } = this.props;
        return (
            <td ref={node => (this.cell = node)} {...restProps}>
                {editable ? (
                    <EditableContext.Consumer>
                        {(form) => {
                            this.form = form;
                            return (
                                editing ? (
                                    <FormItem style={{ margin: 0 }}>
                                        {form.getFieldDecorator(dataIndex, {
                                            rules: [{
                                                required: true,
                                                message: `${title} is required.`,
                                            }],
                                            initialValue: record[dataIndex],
                                        })(
                                            <Input
                                                ref={node => (this.input = node)}
                                                onPressEnter={this.save}
                                            />
                                        )}
                                    </FormItem>
                                ) : (
                                        <div
                                            className="editable-cell-value-wrap"
                                            style={{ paddingRight: 24 }}
                                            onClick={this.toggleEdit}
                                        >
                                            {restProps.children}
                                        </div>
                                    )
                            );
                        }}
                    </EditableContext.Consumer>
                ) : restProps.children}
            </td>
        );
    }
}

class PageEntriesTableEditable extends React.Component {
    constructor(props) {
        super(props);
        this.columns = [{
            title: 'FieldName',
            dataIndex: 'name',
            filters: [{
                text: 'business',
                value: 'business',
            }, {
                text: 'company',
                value: 'company',
            }, {
                text: 'owner',
                value: 'owner',
            }],
            onFilter: (value, record) => record.name.toLowerCase().indexOf(value) === 0,
            sorter: (a, b) => a.name.length - b.name.length,
            editable: true,
        }, {
            title: 'Field id',
            dataIndex: 'id',
            sorter: (a, b) => a.id.length - b.id.length,
            editable: true,
        }, {
            title: 'Value',
            dataIndex: 'options',
            editable: true,
        }, {
            title: 'Delete',
            dataIndex: 'operation',
            render: (text, record) => {
                return (
                    this.props.dataSource.length >= 1
                        ? (
                            <Popconfirm title="Sure to delete?" onConfirm={() => this.handleDelete(record.key)}>
                                <a>Delete</a>
                            </Popconfirm>
                        ) : null
                );
            },
        }];
    }

    handleDelete = (key) => {
        const dataSource = [...this.props.dataSource];
        const state = {
            mode: this.props.mode,
            dataSource: dataSource.filter(item => item.key !== key),
            pageIndex: this.props.pageIndex
        }
        this.props.updateRevisedJson(state);
    }

    handleAdd = () => {
        const dataSource = [...this.props.dataSource];
        const newData = {
            name: 'default',
            id: 'default',
            type: 'text',
            options: 'default',
            tagName: 'INPUT',
            isRequired: false
        };

        const state = {
            mode: this.props.mode,
            dataSource: [newData, ...dataSource],
            pageIndex: this.props.pageIndex
        }

        this.props.updateRevisedJson(state);
    }

    handleSave = (row) => {
        const newData = [...this.props.dataSource];
        const index = newData.findIndex(item => row.key === item.key);
        const item = newData[index];
        newData.splice(index, 1, {
            ...item,
            ...row,
        });

        const state = {
            mode: this.props.mode,
            dataSource: newData,
            pageIndex: this.props.pageIndex
        }
        this.props.updateRevisedJson(state);
    }

    render() {
        const components = {
            body: {
                row: EditableFormRow,
                cell: EditableCell,
            },
        };
        const columns = this.columns.map((col) => {
            if (!col.editable) {
                return col;
            }
            return {
                ...col,
                onCell: record => ({
                    record,
                    editable: col.editable,
                    dataIndex: col.dataIndex,
                    title: col.title,
                    handleSave: this.handleSave,
                }),
            };
        });
        return (
            <div>
                <Button onClick={this.handleAdd} type="primary" style={{ marginBottom: 16 }}>
                    Add a new entry
                </Button>
                <Table
                    components={components}
                    rowClassName={() => 'editable-row'}
                    bordered
                    dataSource={this.props.dataSource}
                    columns={columns}
                    rowKey="key"
                />
            </div>
        );
    }
}

export {PageEntriesTableEditable, EditableCell, EditableFormRow};