import { Layout, Collapse, Slider, Row, Col, Button, notification } from 'antd';
import React from 'react';
import HeaderPanel from './HeaderPanel';
import {CredentialSetter} from './CredentialSetter';
import { ChromeUtil } from '../util/ChromeUitl';

const { Content } = Layout;

class SettingPage extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            demoModeSpeed: 50,
            valueMap: this.createMap(),
        }

        this.loadSettings();
        notification.config({
            placement: 'bottomLeft',
            bottom: 20,
            duration: 1,
        });
    }

    createMap = () => {
        let valueMap = new Map();

        valueMap.set(0, 2000);
        valueMap.set(25, 1500);
        valueMap.set(50, 1000);
        valueMap.set(75, 650);
        valueMap.set(100, 300);
        valueMap.set(300, 100);
        valueMap.set(650, 75);
        valueMap.set(1000, 50);
        valueMap.set(1500, 20);
        valueMap.set(2000, 0);

        return valueMap;
    }

    loadSettings = () => {
        ChromeUtil.getFromStorage("settings")
            .then(({ settings }) => {
                var st = settings || [];
                this.setState({
                    demoModeSpeed: this.state.valueMap.get(st.demoModeInterval),
                });
                console.log(settings)
            });
    }

    updateDemoModeSliderValue = (value) => {
        this.setState({
            demoModeSpeed: value,
        });
    }

    saveSetting = () => {
        const settings = {demoModeInterval: this.state.valueMap.get(this.state.demoModeSpeed)};
        ChromeUtil.sendMessage("options_page_settings_changed", settings);
        ChromeUtil.setToStorage({ settings })
            .then((res) => {
                const msg = res ? res : "Settings saved successfully!";
                const type = res ? "error" : "success";
                notification[type]({
                    message: msg
                });           
            });
    }

    render() {
        const Panel = Collapse.Panel;

        const customPanelStyle = {
            background: '#ffb74d',
            borderRadius: 4,
            marginBottom: 24,
            border: 0,
            overflow: 'hidden',
        };

        const marks = {
            0: { label: <p>Very Slow</p> },
            25: { label: <p>Slow</p> },
            50: { label: <p>Normal</p> },
            75: { label: <p>Fast</p> },
            100: { label: <p>Very Fast</p> },
        };

        return (
            <Layout>
                <HeaderPanel title="AEX Recorder Settings"> </HeaderPanel>
                <Content style={{ margin: '0 16px' }}>
                    <div style={{ padding: 24, minHeight: 800 }}>
                        <div style={{ marginRight: '10px', minHeight: 750 }}>
                            <Collapse >
                                <Panel header="Demo Mode Playback Speed" key="1" style={customPanelStyle}>
                                    <Row gutter={16}>
                                        <Col span={16} >
                                            <Slider
                                                marks={marks}
                                                defaultValue={this.state.demoModeSpeed}
                                                style={{ margin: 30 }}
                                                step={25}
                                                onChange={this.updateDemoModeSliderValue}
                                            />
                                        </Col>

                                        <Col span={8}>
                                            <Button
                                                type="primary"
                                                icon="save"
                                                size="large"
                                                style={{ width: 200, margin: 20 }}
                                                onClick={this.saveSetting}
                                            >
                                                Save
                                            </Button>
                                        </Col>
                                    </Row>
                                </Panel>
                                <Panel header="AEX Credentials" key="3" style={customPanelStyle}>
                                    <CredentialSetter />
                                </Panel>
                                <Panel header="AEX Recorder User Guide" key="2" style={customPanelStyle}>
                                    <p>Google Team drive: <a href="https://docs.google.com/document/d/1waoxe3YEwuZLng2JFGEJHmiU4JyfdJVq_TlVJm35xDI/edit#">AEX Recorder User Guide</a></p>
                                </Panel>
                            </Collapse>
                        </div>
                    </div>
                </Content>
            </Layout>
        )

    }
}

export default SettingPage;