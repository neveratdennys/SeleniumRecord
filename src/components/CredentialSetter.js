import { Button, Form, Icon, Input, Select, notification } from 'antd';
import React from 'react';
import { ChromeUtil } from '../util/ChromeUitl';

const FormItem = Form.Item;

function hasErrors(fieldsError) {
    return Object.keys(fieldsError).some(field => fieldsError[field]);
}

export const CredentialSetter = Form.create()(class extends React.Component {

    handleSubmit = (e) => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                const { server, username, password } = values;
                ChromeUtil.setAexCredentials({
                    [server]: { username, password }
                }).then(() => {
                    notification.success({
                        message: 'Success',
                        description: 'credentials stored to local storage'
                    });
                });
            }
        });
    }

    render() {
        const { getFieldDecorator, getFieldsError } = this.props.form;

        return (
            <Form layout="inline" onSubmit={this.handleSubmit}>
                <FormItem label="Server">
                    {getFieldDecorator('server', {
                        rules: [{ required: true, message: 'Please choose a server!' }],
                    })(
                        <Select style={{ width: 200 }}
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
                <FormItem>
                    {getFieldDecorator('username', {
                        rules: [{ required: true, message: 'Please input your username!' }],
                    })(
                        <Input prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="Username" />
                    )}
                </FormItem>
                <FormItem>
                    {getFieldDecorator('password', {
                        rules: [{ required: true, message: 'Please input your Password!' }],
                    })(
                        <Input prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />} type="password" placeholder="Password" />
                    )}
                </FormItem>
                <FormItem>
                    <Button
                        type="primary"
                        htmlType="submit"
                        disabled={hasErrors(getFieldsError())}
                    >
                        Save
              </Button>
                    <Button
                        type="danger"
                        onClick={() => ChromeUtil.clearAexCredentials().then(() => notification.success({ message: 'Success', description: 'Credentials Cleared' }))}
                    >
                        Clear All
              </Button>
                </FormItem>
            </Form>
        );
    }
});