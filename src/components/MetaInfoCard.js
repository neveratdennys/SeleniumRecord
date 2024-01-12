import React from 'react';
import { Card, Modal, Form, Input, Button } from 'antd';

const FormItem = Form.Item;

const CustomizedForm = Form.create({
    onFieldsChange(props, changedFields) {
        props.onChange(changedFields);
    },
    mapPropsToFields(props) {
        return {
            companyName: Form.createFormField({
                ...props.companyName,
                value: props.companyName.value,
            }),
            companyId: Form.createFormField({
                ...props.companyId,
                value: props.companyId.value,
            }),
            transactionName: Form.createFormField({
                ...props.transactionName,
                value: props.transactionName.value,
            }),
            transRefId: Form.createFormField({
                ...props.transRefId,
                value: props.transRefId.value,
            }),
            transactionFolderName: Form.createFormField({
                ...props.transactionFolderName,
                value: props.transactionFolderName.value,
            }),
            transactionFolderId: Form.createFormField({
                ...props.transactionFolderId,
                value: props.transactionFolderId.value,
            })
        };
    },
    onValuesChange(props, values) {
        //console.log(props);
    }
})((props) => {
    const { getFieldDecorator } = props.form;

    const checkValidation = () => {
        props.form.validateFields(
            (err) => {
              if (!err) {
                props.handleSave()
              }
            },
          );
    }
    return (
        <Form layout="vertical" hideRequiredMark={true} >
            <FormItem label="Company Name" >
                {getFieldDecorator('companyName', {
                    rules: [{ required: true, message: 'Please input company name!' }]
                })(<Input/>)}
            </FormItem>
            <FormItem label="Company Id" >
                {getFieldDecorator('companyId', {
                    rules: [{ required: true, message: 'Please input company id!' } ],
                })(<Input />)}
            </FormItem>
            <FormItem label="Transaction Name" >
                {getFieldDecorator('transactionName', {
                    rules: [{ required: true, message: 'Please input transaction name!' }],
                })(<Input />)}
            </FormItem>
            <FormItem label="TransRefId" >
                {getFieldDecorator('transRefId', {
                    rules: [{ required: true, message: 'Please input transRefId!' }],
                })(<Input />)}
            </FormItem>
            <FormItem label="Transaction Folder Name" >
                {getFieldDecorator('transactionFolderName', {
                    rules: [{ required: true, message: 'Please input transaction folder name' }],
                })(<Input />)}
            </FormItem>
            <FormItem label="Transaction Folder Id" >
                {getFieldDecorator('transactionFolderId', {
                    rules: [{ required: true, message: 'Please input transaction folder id' }],
                })(<Input />)}
            </FormItem>
            <FormItem>
                <Button type="primary" onClick={checkValidation} block>Update</Button>
            </FormItem>
        </Form>
    );
});


class MetaInfoCard extends React.Component {
    
    constructor(props) {
        super(props);
        this.state = {
            editDialogVisible: false,
            editMetaInfo: this.props.editMetaInfo ? this.props.editMetaInfo : this.parseMetaInfo(this.props.meta),
        }
    }    

    editMetaInfo = () => {
        if(this.props.id){
            this.setState({
                editMetaInfo: this.parseMetaInfo(this.props.meta)
            })
        }

        this.setState({
            editDialogVisible: true
        });
    }

    closeEditDialog = () => {
        this.setState({
            editDialogVisible: false,
        });

        if(this.props.onEditMetaInfoClose) {
            this.props.onEditMetaInfoClose();
        }        
    }

    handleEditFormChange = (changedMetaInfo) => {
        if(this.props.updateEditMetaInfo) {
            this.props.updateEditMetaInfo(changedMetaInfo);
        } else {
            this.setState(({ editMetaInfo }) => ({
                editMetaInfo: { ...editMetaInfo, ...changedMetaInfo }
            }));
        }
    }

    handleSave = () => {
        if(this.props.id){
            let newMeta = Object.assign({}, this.props.meta);
            newMeta.companyName = this.state.editMetaInfo.companyName.value;
            newMeta.companyId = this.state.editMetaInfo.companyId.value;
            newMeta.transactionName = this.state.editMetaInfo.transactionName.value;
            newMeta.transRefId = this.state.editMetaInfo.transRefId.value;
            newMeta.transactionFolderName = this.state.editMetaInfo.transactionFolderName.value;
            newMeta.transactionFolderId = this.state.editMetaInfo.transactionFolderId.value;

            this.props.updateMetaInfo(newMeta, this.props.id);
        } else {
            this.props.updateMetaInfo();
        }
        
        this.setState({
            editDialogVisible: false,
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

    render() {
        const style = this.props.visible ? (this.props.margin ? { marginTop: '50px', display: 'block' } : { display: 'block' }) : { display: 'none' };
        const fields = this.props.editMetaInfo ? this.props.editMetaInfo : this.state.editMetaInfo;
        const meta = this.props.meta;
        return (
            <Card
                title={meta.companyName ? meta.companyName : "Unknown Company"}
                style={style}
                hoverable={true}
                extra={<a onClick={this.editMetaInfo}>Edit</a>}
            >                
                <p><strong>Transaction Name:</strong> {meta.transactionName ? meta.transactionName : ""}</p>
                <p><strong>TransRefId: </strong> {meta.transRefId ? meta.transRefId : ""}</p>
                <p><strong>Number of Pages: </strong>{this.props.numOfPages} </p>
                <p><strong>Recorder version:</strong> {meta.recorderVersion ? meta.recorderVersion : "Old version"}</p>
                <Modal
                    title="Edit Meta Info"
                    visible={this.state.editDialogVisible}
                    onCancel={this.closeEditDialog}
                    footer={null}
                    centered={true}
                >
                    <CustomizedForm {...fields} onChange={this.handleEditFormChange} handleSave={this.handleSave}/>      
                </Modal>
            </Card>
        )
    }

}

export default MetaInfoCard;