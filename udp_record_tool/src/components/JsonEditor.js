import React from 'react';
import saveAs from 'file-saver';
import { Layout, Row, Col, Button } from 'antd';
import HeaderPanel from './HeaderPanel';
import FileUpload from './FileUpload';
import PagesTab from './PagesTab';
import EditorInstruction from './EditorInstruction';
import MetaInfoCard from './MetaInfoCard';

const { Content } = Layout;

class JsonEditor extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            uploadedJson: {},
            displayPages: false,
            downloadBtnDisable: true,
            fileName: "",
            editMetaInfo: this.parseMetaInfo()
        }
    }

    setUploadedJson = (json, fileName) => {
        if (json.meta) {
            this.setState({
                uploadedJson: json,
                editMetaInfo: this.parseMetaInfo(json.meta),
                displayPages: true,
                fileName
            })
        } else {
            this.setState({
                uploadedJson: {},
                editMetaInfo: {},
                displayPages: false,
                downloadBtnDisable: true,
                fileName: ""
            })
        }
    }

    updateRevisedJson = (json) => {
        if (json.meta) {
            this.setState({
                uploadedJson: json,
                downloadBtnDisable: false
            })
        }
    }

    downloadRevisedJson = () => {
        console.log("downloading");
        const json = JSON.stringify(this.state.uploadedJson, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        saveAs(blob, this.state.fileName.split(".")[0] + "-REVISED.json");
    }

    updateEditMetaInfo = (changedMetaInfo) => {        
        this.setState(({ editMetaInfo }) => ({
            editMetaInfo: { ...editMetaInfo, ...changedMetaInfo }
        }));
    }

    updateMetaInfo = () => {
        let newJson = Object.assign({}, this.state.uploadedJson);
        newJson.meta.companyName = this.state.editMetaInfo.companyName.value;
        newJson.meta.companyId = this.state.editMetaInfo.companyId.value;
        newJson.meta.transactionName = this.state.editMetaInfo.transactionName.value;
        newJson.meta.transRefId = this.state.editMetaInfo.transRefId.value;
        newJson.meta.transactionFolderName = this.state.editMetaInfo.transactionFolderName.value;
        newJson.meta.transactionFolderId = this.state.editMetaInfo.transactionFolderId.value;

        this.setState({
            uploadedJson: newJson,
            downloadBtnDisable: false
        });
    }

    parseMetaInfo = (meta) => {
        return {
            companyName: {
                value: meta? meta.companyName : ""
            },
            companyId: {
                value: meta? meta.companyId : ""
            },
            transactionName: {
                value: meta? meta.transactionName : ""
            },
            transRefId: {
                value: meta? meta.transRefId: ""
            },
            transactionFolderName: {
                value: meta? meta.transactionFolderName: ""
            },
            transactionFolderId: {
                value: meta? meta.transactionFolderId: ""
            }
        }
    }

    onEditMetaInfoClose = () => {
        const meta = this.state.uploadedJson.meta? this.state.uploadedJson.meta : false;
        this.setState({
            editMetaInfo: this.parseMetaInfo(meta)
        })
    }

    render() {
        const json = this.state.uploadedJson;
        const metaInfo = json.meta? json.meta : {};
        const metaInfoVisible = (typeof json.meta !== "undefined");
        const pageNum = json.meta? ((json.pages? json.pages.length : 0) + (json.pages_recipient? json.pages_recipient.length : 0)) : 0;        
        const pageDisplay = this.state.displayPages ?
            (
                <PagesTab json={this.state.uploadedJson} updateRevisedJson={this.updateRevisedJson}/>
            ) :
            (
                <EditorInstruction />
            );
        return (
            <Layout>
                <HeaderPanel title="AEX Recorder JSON Editor" />
                <Content style={{ margin: '0 16px' }}>
                    <div style={{ padding: 24 }}>
                        <Row gutter={16}>
                            <Col lg={6} span={24}>
                                <div style={{ marginRight: '10px' }}>
                                    <FileUpload 
                                        setUploadedJson={this.setUploadedJson} 
                                        dragger={true}
                                    />
                                </div>

                                <div>
                                    <MetaInfoCard 
                                        editMetaInfo={this.state.editMetaInfo} 
                                        meta={metaInfo}
                                        numOfPages = {pageNum}
                                        visible={metaInfoVisible}
                                        margin={true}   
                                        updateMetaInfo={this.updateMetaInfo}   
                                        updateEditMetaInfo={this.updateEditMetaInfo}
                                        onEditMetaInfoClose={this.onEditMetaInfoClose}                                                     
                                    />
                                </div>
                                <div style={{ margin: '50px 10px 50px 0px' }}>
                                    <Button 
                                        type="primary" 
                                        icon="download" 
                                        size="large" 
                                        onClick={this.downloadRevisedJson} 
                                        disabled={this.state.downloadBtnDisable}                                        
                                        block 
                                    >
                                        Download
                                    </Button>
                                </div>

                            </Col>
                            <Col lg={18} span={24}>
                                <div style={{ marginLeft: '10px', minHeight: '68vh', background: '#fafafa' }}>
                                    {pageDisplay}
                                </div>
                            </Col>
                        </Row>
                    </div>
                </Content>
            </Layout>
        )

    }
}

export default JsonEditor;