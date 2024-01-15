import React from 'react';
import { saveAs } from 'file-saver';
import { Card, Upload, Icon, notification, Popconfirm, Modal, Table } from 'antd';
import { ChromeUtil } from '../../util/ChromeUitl';
import { FileUtil } from '../../util/FileUtil';

function getDateString(time) {
    const date = new Date(time);
    return (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear() + " @ "
        + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
}

class ExportImportTool extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            modalVisible: false,
            confirmLoading: false,
            importJson: null
        };
    }

    openImportModal = (file) => {
        FileUtil.readFile(file)
            .then((json) => {
                this.setState({ modalVisible: true, importJson: json });
            });
        return false;
    }

    handleImport = () => {
        this.setState({ confirmLoading: true });
        ChromeUtil.addJsonToDatabase_import(this.state.importJson)
            .then(error => {
                if (error) {
                    notification.error({
                        message: "Error",
                        description: "Failed to import recored jsons."
                    });
                } else {
                    notification.success({
                        message: "Succeed",
                        description: "Successfully imported Recored jsons."
                    });
                }
            })
            .catch((e) => {
                notification.warn("Failed to import recored jsons.");
            });
        this.setState({ modalVisible: false, confirmLoading: false, importFile: null });
        return false;
    }

    handleExport = () => {
        ChromeUtil.getFromStorage("database")
            .then(({ database }) => {
                const blob = new Blob([JSON.stringify(database)], { type: "application/json" });
                saveAs(blob, `Recorder-Export-${getDateString(new Date().getTime())}.export`);
            });
    }

    render() {
        return (<div>
            <Modal
                title="Import recored jsons"
                closable={false}
                maskClosable={false}
                confirmLoading={this.state.confirmLoading}
                visible={this.state.modalVisible}
                onOk={this.handleImport}
                onCancel={() => this.setState({ modalVisible: false, importFile: null })}
            >
                <p>You are about to import the following jsons</p>
                <Table
                    pagination={{ pageSize: 5 }}
                    columns={[
                        {
                            title: "Name",
                            key: "fileName",
                            dataIndex: "fileName"
                        },
                        {
                            title: "Date",
                            key: "Date",
                            dataIndex: "Date",
                            render: getDateString
                        }
                    ]}
                    dataSource={this.state.importJson}
                ></Table>
            </Modal>
            <Card
                title="Back-up Tool"
                actions={[
                    <Upload
                        name='file'
                        accept=".export"
                        showUploadList={false}
                        beforeUpload={this.openImportModal}
                    >
                        <Icon type="upload" /> Import All
                </Upload>,
                    <Popconfirm title="You are about to export all the recorded jsons stored in the extension." onConfirm={this.handleExport}>
                        <Icon type="export" /> Export All
                </Popconfirm>
                ]}
                bodyStyle={{minHeight: 90}}
            >
                Easily backup and restore all your recorded json!
            </Card>
        </div>);
    }

}

export default ExportImportTool;