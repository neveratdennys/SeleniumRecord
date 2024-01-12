import { Col, Row } from 'antd';
import React from 'react';

class DisplayPanel extends React.Component {

    getItemList = (itemList) => {
        const list = [];
        for (let i = 0; i < itemList.length; i += 3) {
            const row = itemList.slice(i, i + 3);
            list.push(<Row key={i} gutter={16} style={{ marginBottom: 16 }}>
                {
                    row.map((item, itemIndex) =>
                        <Col key={itemIndex} xs={24} sm={24} md={12} lg={8} xl={8}>
                            {item}
                        </Col>
                    )
                }
            </Row>);
        }
        return list;
    }

    render() {
        return this.getItemList(this.props.itemList);
    }
}

export default DisplayPanel;