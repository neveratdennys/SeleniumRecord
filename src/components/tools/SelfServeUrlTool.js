import { Button, Card, Icon, Modal, notification } from 'antd';
import React from 'react';
import { AexUtil } from '../../util/AexUtil';
import TransactionFolderSelectForm from '../TransactionFolderSelectForm';

class SelfServeUrlTool extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            modalVisible: false,
        };
    }

    generateURL = (values, state) => {
        const { server, folderId, companyId } = values;
        const transRefId = state.folderList.find(f => f.id === folderId).transactionRefId;
        const recipients = state.signaturePlaceholders.map(sig => `${sig.label}:${sig.label}`).join(',');

        const URL = `${AexUtil.AexServerUrl[server]}/api/TemplateServices/v2/publishTransaction?agexp_transrefid=${transRefId}&agexp_transfolderid=${folderId}&agexp_transcompany=${companyId}&allRecipients=${recipients}&aex_direct=true`;

        navigator.clipboard.writeText(URL)
            .then(() => {
                notification.success({
                    message: "the self-serve URL is copied to the clipboard!"
                });
            });
    }

    render() {
        return (
            <div>
                <Modal
                    title="Self-Serve URL Generator"
                    maskClosable={false}
                    visible={this.state.modalVisible}
                    onCancel={() => this.setState({ modalVisible: false })}
                    footer={[
                        <Button key="close" onClick={() => this.setState({ modalVisible: false })}>Close</Button>
                    ]}
                >
                    <TransactionFolderSelectForm onFormSubmit={this.generateURL} submitBtnText="Generate!" />
                </Modal>
                <Card
                    title="Self Serve URL Generator"
                    actions={[
                        <div onClick={() => this.setState({ modalVisible: true })}>
                            <Icon type="tool" /> Open
                        </div>
                    ]}
                    bodyStyle={{minHeight: 90}}
                >
                    Easily genrate URLs for launching transaction!!
                </Card>
            </div>
        );
    }

}


export default SelfServeUrlTool;