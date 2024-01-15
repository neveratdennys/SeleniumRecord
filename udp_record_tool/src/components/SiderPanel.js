
import React from 'react';

import { Layout, Menu, Icon } from 'antd';
const { Sider } = Layout;

class SiderPanel extends React.Component {
    state = {
        collapsed: true,
    };

    onCollapse = (collapsed) => {
        this.setState({ collapsed });
    }

    render() {

        const LogoDiv = (props) => {
            return (
                <div style={{height: '70px', marginLeft: props.collapsed? '0' : '25%'}} >
                    <img src="images/sider-logo.png" className="App-logo" alt="logo" />
                </div>  
            )
        }

        return (
            <Sider
            collapsible
            collapsed={this.state.collapsed}
            onCollapse={this.onCollapse}
            style={{ background: '#282c34' }}
            >
                <LogoDiv collapsed={this.state.collapsed} />
                <Menu 
                theme="dark" 
                defaultSelectedKeys={['editor']} 
                selectedKeys={[this.props.selectedKey]}
                mode="inline" 
                style={{ background: '#282c34' }}
                onClick={this.props.changePage}
                >                
                    <Menu.Item key="editor">
                        <Icon type="pie-chart" />
                        <span>JSON Editor</span>
                    </Menu.Item>                
                    
                    <Menu.Item key="jsonList">
                        <Icon type="database" />                
                        <span>Saved Files</span>
                    </Menu.Item>

                    <Menu.Item key="tools">
                        <Icon type="tool" />                
                        <span>Recorder Tools</span>
                    </Menu.Item>                 

                    <Menu.Item key="setting">
                        <Icon type="file" />
                        <span>Setting</span>
                    </Menu.Item>
                </Menu>
            </Sider>
        )
    }

}

export default SiderPanel;