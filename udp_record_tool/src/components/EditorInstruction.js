import React from 'react';
import { Steps, Icon, Row, Col } from 'antd';

const Step = Steps.Step;

class EditorInstruction extends React.Component {

    render() {
        return (
            <div>
                <Row style={{paddingTop:"50px"}}>
                    <Col span={4}/>
                    <Col span={16} align="middle">
                        <Steps>
                            <Step status="finish" title="Upload" icon={<Icon type="upload" />} description="Upload your Json file" />
                            <Step status="finish" title="View" icon={<Icon type="solution" />} description="View data for each document" />
                            <Step status="finish" title="Edit" icon={<Icon type="edit" />} description="Edit, add, remove data entries" />
                            <Step status="finish" title="Download" icon={<Icon type="download" />} description="Download your Json file"/>
                        </Steps>
                    </Col>
                    <Col span={4}/>
                </Row>  
            </div>
        )
    }
} 

export default EditorInstruction;