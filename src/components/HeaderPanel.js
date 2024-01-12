
import React from 'react';
import { Layout } from 'antd';
const { Header } = Layout;

class HeaderPanel extends React.Component {
    render() {

        return (
            <Header className="App-header">  
                <span>
                    {this.props.title}
                </span>
            </Header>
        )
    }

}

export default HeaderPanel;