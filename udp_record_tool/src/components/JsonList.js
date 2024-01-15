import React from 'react';
import { Layout, Row, Col, Table, Divider, Popconfirm, notification, Drawer, Button, Form } from 'antd';
import HeaderPanel from './HeaderPanel';
import PagesTab from './PagesTab';
import MetaInfoCard from './MetaInfoCard';
import SearchBar from './SearchBar';
import FileUpload from './FileUpload';
import { ChromeUtil } from '../util/ChromeUitl';
import { EditableCell, EditableFormRow } from "./PageEntriesTableEditable";
import saveAs from 'file-saver';

const { Content } = Layout;

function getDateString(time) {
    const date = new Date(time);
    return (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear() + " @ "
        + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
}

class JsonList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            jsonArray: [],
            displayArray: [],
            selectedJson: {},
            selectedJsonId: '',
            editMode: false
        }

        this.loadDatabase();

        notification.config({
            placement: 'bottomLeft',
            bottom: 20,
            duration: 1,
        });

        chrome.storage.onChanged.addListener(this.loadDatabase);
    }

    componentWillUnmount = () => {
        chrome.storage.onChanged.removeListener(this.loadDatabase);
    }

    loadDatabase = () => {
        ChromeUtil.getFromStorage("database")
        .then(({ database }) => {
            var db = database || [];
            this.setState({
                jsonArray: db,
                displayArray: db
            });
        });
    }

    onEditDrawerClose = () => {
        this.setState({
            editMode: false,
            selectedJson: {},
            selectedJsonId: '',
        });
    };

    generateItemList = () => {
        const tempColumns = [
            {
                title: "Name",
                key: "name",
                dataIndex: "fileName",
                editable: true
            },
            {
                title: "Date Created",
                key: "date",
                dataIndex: "Date",
                render: getDateString
            }, 
            {
                title: 'Action',
                key: 'action',
                render: (text, record) => (
                    <span>
                        <Divider type="vertical" />
                        <a onClick={() => this.handleDownload(record.fileName, record.seleniumJson)}>Download </a>
                        <Divider type="vertical" />
                        <a onClick={() => this.handleEdit(record.Date, record.seleniumJson)}>Edit</a>
                        <Divider type="vertical" />
                        <Popconfirm title="Sure to delete?" onConfirm={() => this.handleDelete(record.Date)}>
                            <a>Delete</a>
                        </Popconfirm>
                        <Divider type="vertical" />
                    </span>
                ),
            }
        ];

        const columns = tempColumns.map((col) => {
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
                    handleSave: this.handleCellSave,
                }),
            };
        });

        const components = {
            body: {
                row: EditableFormRow,
                cell: EditableCell,
            },
        };

        return <Table
            components={components}
            rowClassName={() => 'editable-row'}
            columns={columns}
            expandedRowRender={file => {
                const json = file.seleniumJson;
                const pageNum = json.meta ? ((json.pages ? json.pages.length : 0) + (json.pages_recipient ? json.pages_recipient.length : 0)) : 0;
                const metaInfoVisible = (json.meta != null);


                return (<MetaInfoCard                            
                            meta={json.meta || {}} 
                            numOfPages={pageNum}
                            visible={metaInfoVisible}
                            margin={false}
                            updateMetaInfo={this.updateMetaInfo}
                            id={file.Date}
                        />);
            }}
            dataSource={this.state.displayArray}
            rowKey="Date"
        />;
    }

    updateMetaInfo = (meta, id) => {
        const newData = [...this.state.jsonArray];
        newData.forEach((input, index) => {
            if(input.Date == id) {
                newData[index].seleniumJson.meta = meta;
            }
        })        

        this.updateToLocalStorage(newData, "Meta info saved succesfully");
    }

    handleCellSave = (row) => {
        const newData = [...this.state.jsonArray];
        newData.forEach((input, index) => {
            if(input.Date == row.Date) {
                newData[index] = row;
            }
        })        

        this.updateToLocalStorage(newData, "File name saved succesfully");
    }

    updateRevisedJson = (json) => {
        let newJsonArray = this.state.jsonArray;
        newJsonArray.forEach(file => {
            if (file.Date === this.state.selectedJsonId) {
                file.seleniumJson = json;
            }
        })
        this.updateToLocalStorage(newJsonArray, "Changes saved");
    }

    handleDelete = (key) => {
        const newJsonArray = this.state.jsonArray.filter(file => file.Date !== key);
        this.updateToLocalStorage(newJsonArray, "Delete successfully");
    }

    handleEdit = (key, json) => {
        this.setState({
            selectedJson: json,
            selectedJsonId: key,
            editMode: true
        })
    }

    handleDownload = (name, seleniumJson) => {
        const json = JSON.stringify(seleniumJson, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        saveAs(blob, name + ".json");
    }

    updateToLocalStorage = (newJsonArray, successMessage) => {
        ChromeUtil.setToStorage({ database: newJsonArray })
            .then((res) => {
                if(successMessage){
                    const msg = res ? res : successMessage;
                    const type = res ? "error" : "success";
                    notification[type]({
                        message: msg
                    });
                }                
            });
    }

    handleSearch = (value) => {
        this.setState({
            displayArray: !value ? this.state.jsonArray : this.state.jsonArray.filter(file => file.fileName.toUpperCase().indexOf(value.toUpperCase()) !== -1)
        })
    }

    handleFileUpload = (json, name) => {
        const newEntry = {
            Date: new Date().getTime(),
            fileName: name.split(".")[0],
            seleniumJson: json
        }
        const newJsonArray = [newEntry, ...this.state.jsonArray];
        this.updateToLocalStorage(newJsonArray, "New file added successfully");
    }

    render() {

        let autoCompleteDataSource = [];
        this.state.jsonArray.forEach(file => {
            if (file.fileName) {
                autoCompleteDataSource.push(file.fileName);
            }
        });

        return (
            <Layout>
                <HeaderPanel title="AEX Recorder Saved JSON Files"> </HeaderPanel>
                <Content style={{ margin: '0 16px' }}>
                    <div style={{ padding: 24 }}>
                        <div style={{ background: '#fafafa' }}>
                            <Row gutter={16}>
                                <Col span={12} >
                                    <SearchBar
                                        dataSource={autoCompleteDataSource}
                                        onSelect={this.handleSearch}
                                        onSearch={this.handleSearch}
                                    />
                                </Col>

                                <Col span={12} style={{ padding: 10 }}>
                                    <FileUpload
                                        setUploadedJson={this.handleFileUpload}
                                    />
                                </Col>
                            </Row>
                        </div>
                        <Row gutter={16}>
                            <Col span={24} >
                                <div style={{ minHeight: '68vh', background: '#fafafa' }}>
                                    {this.generateItemList()}
                                </div>
                            </Col>
                        </Row>
                    </div>

                    <div>
                        <Drawer
                            title="Edit File"
                            placement="right"
                            closable={false}
                            onClose={this.onEditDrawerClose}
                            visible={this.state.editMode}
                            width="85em"
                        >
                            <PagesTab
                                json={this.state.selectedJson}
                                updateRevisedJson={this.updateRevisedJson}
                            />
                            <div style={{
                                position: 'absolute', bottom: 0, width: '100%', borderTop: '1px solid #e8e8e8', padding: '10px 16px', textAlign: 'right',
                                left: 0, background: '#fff', borderRadius: '0 0 4px 4px'
                            }}>
                                <Button
                                    style={{ marginRight: 8 }}
                                    onClick={this.onEditDrawerClose}
                                >
                                    Close
                                </Button>
                            </div>
                        </Drawer>
                    </div>
                </Content>
            </Layout>
        )

    }
}

export default JsonList;