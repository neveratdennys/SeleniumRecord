import { Layout, notification } from 'antd';
import React from 'react';
import HeaderPanel from './HeaderPanel';
import DisplayPanel from './DisplayPanel';
import ExportImportTool from './tools/ExportImportTool';
import SelfServeUrlTool from './tools/SelfServeUrlTool';

const { Content } = Layout;

class RecorderTools extends React.Component {

    constructor(props){
        super(props);

        notification.config({
            placement: 'bottomLeft',
            bottom: 20,
            duration: 1,
        });
    }

    static toolList = [<ExportImportTool />, <SelfServeUrlTool/>];   

    render() {
        return (
            <Layout>
                <HeaderPanel title="AEX Recorder JSON Tools"> </HeaderPanel>
                <Content style={{ margin: '0 16px' }}>
                    <div style={{ padding: 24, minHeight: 800 }}>
                        <div style={{ marginRight: '10px', minHeight: 750, maxWidth: "75%", margin: "0 auto" }}>
                            <DisplayPanel itemList={RecorderTools.toolList} />
                        </div>
                    </div>
                </Content>
            </Layout>
        )

    }
}

export default RecorderTools;