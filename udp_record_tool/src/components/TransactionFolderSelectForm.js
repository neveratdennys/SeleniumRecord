import { Button, Form, notification, Select, Spin, Table } from 'antd';
import FormItem from 'antd/lib/form/FormItem';
import React from 'react';
import { aexUtils } from '../util/AexUtil';

const compareByKeyCaseInsensitive = (input, { key }) => input.toLowerCase().split('').every(char => key.toLowerCase().includes(char));

const TransactionFolderSelectForm = Form.create()(
    class extends React.Component {

        constructor(props) {
            super(props);
            this.state = {
                companyList: [],
                folderList: [],
                templateList: [],
                signaturePlaceholders: [],
                loading: false,
                server: null,
                URL: ""
            };
        }

        onServerChange = (server) => {
            this.setState({ server, companyList: [], folderList: [], templateList: [], loading: true });
            this.props.form.setFieldsValue({
                companyId: null,
                folderId: null
            });
            aexUtils[server].callServer({
                url: "/api/UserServices/v2/getUserInformation",
                option: {
                    method: "POST"
                },
                useSecToken: true
            })
                .then(res => res.json())
                .then(json => {
                    const companyList = json.res.companyList;
                    this.setState({ companyList });
                })
                .catch((e) => {
                    notification.error({ message: "Error", description: e });
                })
                .then(() => {
                    this.setState({ loading: false });
                });
        }

        onCompanyChange = (companyId) => {
            this.setState({ folderList: [], templateList: [], loading: true });
            this.props.form.setFieldsValue({
                folderId: null
            });
            aexUtils[this.state.server].callServer({
                url: `/api/TemplateServices/v2/getRootFolder?AEX_COMPANY_ID=${companyId}`,
                option: {
                    method: "GET"
                },
                useSecToken: true
            })
                .then(res => res.json())
                .then(json => {
                    const folderList = json.res.children;
                    this.setState({ folderList });
                })
                .catch((e) => {
                    notification.error({ message: "Error", description: e });
                })
                .then(() => {
                    this.setState({ loading: false });
                });
        }

        onFolderChange = (folderId) => {
            const folder = this.state.folderList.find(({ id }) => id == folderId);
            const templateList = folder.templateItems;

            this.setState({ templateList, loading: true });

            const guids = templateList.map((template) => {
                return template.guid;
            }).join(",");

            aexUtils[this.state.server].callServer({
                url: `/api/TemplateServices/v3/getTemplateSignaturesByGuids?guids=${guids}`,
                option: {
                    method: "GET"
                },
                useSecToken: true
            })
                .then(res => res.json())
                .then(json => {
                    const signaturePlaceholders = Object.keys(json.res).map(key => {
                        return { label: json.res[key].user, user: "" };
                    });
                    this.setState({ signaturePlaceholders });
                })
                .catch((e) => {
                    notification.error({ message: "Error", description: e });
                })
                .then(() => {
                    this.setState({ loading: false });
                });
        }

        submit = () => {
            this.props.form.validateFields((err, values) => {
                if (err) {
                    return;
                }

                const transRefId = this.state.folderList.find(({ id }) => id == values.folderId).transactionRefId;
                this.props.onFormSubmit(values, this.state);
            });
        }

        render() {
            const { getFieldDecorator } = this.props.form;
            return (
                <Spin tip="fetching data from server..." spinning={this.state.loading}>
                    <Form layout="vertical">
                        <FormItem label="Server">
                            {getFieldDecorator('server', {
                                rules: [{ required: true, message: 'Please choose a server!' }],
                            })(
                                <Select onSelect={this.onServerChange}
                                >
                                    <Select.Option value="LOCAL">Localhost</Select.Option>
                                    <Select.Option value="DEVSTAGE">US Dev Stage</Select.Option>
                                    <Select.Option value="STAGING">Staging</Select.Option>
                                    <Select.Option value="UAT">UAT</Select.Option>
                                    <Select.Option value="USPROD">US Production</Select.Option>
                                    <Select.Option value="CAPROD">CA Production</Select.Option>
                                </Select>
                            )}
                        </FormItem>
                        <FormItem label="Company">
                            {getFieldDecorator('companyId', {
                                rules: [{ required: true, message: 'Please choose a company!' }],
                            })(
                                <Select onSelect={this.onCompanyChange} showSearch filterOption={compareByKeyCaseInsensitive}>
                                    {this.state.companyList.map((company) => {
                                        return <Select.Option key={company.companyName} value={company.companyId}>{company.companyName}</Select.Option>;
                                    })}
                                </Select>
                            )}
                        </FormItem>
                        <FormItem label="Folder">
                            {getFieldDecorator('folderId', {
                                rules: [{ required: true, message: 'Please choose a folder!' }],
                            })(
                                <Select onSelect={this.onFolderChange} showSearch filterOption={compareByKeyCaseInsensitive}>
                                    {this.state.folderList.map((folder) => {
                                        return <Select.Option key={folder.folderName} value={folder.id}>{folder.folderName}</Select.Option>;
                                    })}
                                </Select>
                            )}
                        </FormItem>
                    </Form>
                    The Folder contains the following templates:
                            <Table pagination={{ pageSize: 5 }}
                        rowKey="guid"
                        columns={[
                            {
                                title: "Template Name",
                                key: "name",
                                dataIndex: "name"
                            },
                            {
                                title: "File Name",
                                key: "fileName",
                                dataIndex: "fileName"
                            }
                        ]}
                        dataSource={this.state.templateList} />
                    <Button type="primary" onClick={this.submit}>{this.props.submitBtnText}</Button>
                </Spin>
            );
        }

    }
)

export default TransactionFolderSelectForm;