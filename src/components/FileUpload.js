import React from 'react';
import { Upload, Icon, Button } from 'antd';
import { FileUtil } from '../util/FileUtil';

const Dragger = Upload.Dragger;

class FileUpload extends React.Component {
    state = {
        fileList: []
    }

    handleUpload = (file) => {
        const fileName = file[0].name;
        FileUtil.readFile(file[0]).then(json => {
            this.props.setUploadedJson(json, fileName);
        });
    }

    render() {    

        const props1 = {
            accept:".json",
            onRemove: (file) => {
                this.setState(({ fileList }) => {
                  const index = fileList.indexOf(file);
                  const newFileList = fileList.slice();
                  newFileList.splice(index, 1);
                  return {
                    fileList: newFileList,
                  };
                });

                this.props.setUploadedJson({});
              },
            beforeUpload: (file) => {
                this.setState({
                    fileList: [file],
                });

                this.handleUpload([file]);
                return false;
            },
            fileList: this.state.fileList,
        }

        const props2 = {
            accept:".json",
            beforeUpload: (file) => {
                this.handleUpload([file]);
                return false;
            },
            showUploadList: false
        }

        const props = this.props.dragger? props1 : props2;

        const uploadComponent = this.props.dragger? (
            <Dragger {...props} style={{background:'#ffb74d'}}>
                <p className="ant-upload-drag-icon">
                <Icon type="inbox" />
                </p>
                <p className="ant-upload-text">Click or drag file to this area to upload</p>
                <p className="ant-upload-hint">Please use JSON file from AEX Reccorder</p>
            </Dragger>
        ) : (
            <Upload {...props}>                                      
                <Button type="primary" size="large">
                    <Icon type="upload" /> Add New File
                </Button>     
            </Upload>  
        ) 

        return (
            <div>{uploadComponent}</div>            
        );
    }

}

export default FileUpload;