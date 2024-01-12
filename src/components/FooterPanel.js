
import React from 'react';

import { Layout } from 'antd';

const { Footer } = Layout;

class FooterPanel extends React.Component {
    render() {
        return (
            <Footer style={{ textAlign: 'center' }}> &copy; 2018 Agreement Express Inc.</Footer>
        )
    }
}
 
export default FooterPanel;