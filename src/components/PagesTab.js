
import React from 'react';

import { Tabs, Icon, Tooltip } from 'antd';
import { PageEntriesTableEditable } from './PageEntriesTableEditable';

const TabPane = Tabs.TabPane;

class PagesTab extends React.Component {

    generateTable = (page, index, mode) => {
        const tabPaneStyle = { maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left'};
        const popoverContent = <div >{page.docName}</div>;
        const tabPaneContent = page.docName.length > 25 ? (
            <Tooltip placement="left" title={popoverContent} >            
                <div style={tabPaneStyle}>{page.docName}</div>
            </Tooltip>
        ) : (
            <div style={tabPaneStyle}>{page.docName}</div>
        );
        return (
            <TabPane tab={tabPaneContent} key={index}>
                <PageEntriesTableEditable
                    dataSource={this.parseData(page.entries)}
                    mode={mode}
                    pageIndex={index}
                    updateRevisedJson={this.updateRevisedJson}
                >
                </PageEntriesTableEditable>
            </TabPane>
        )
    }

    parseData = (entries) => {
        entries.forEach((entry, id) => {
            entry.key = id;
        })
        return entries;
    }

    updateRevisedJson = (newState) => {
        this.setState(() => {
            const index = newState.pageIndex;
            let tempJson = this.props.json;
            if (newState.mode === "publisher") {
                tempJson.pages[index].entries = newState.dataSource;
            } else {
                tempJson.pages_recipient[index].entries = newState.dataSource;
            }

            this.props.updateRevisedJson(tempJson);

            return {
                uploadedJson: tempJson,
            };
        })
    }

    render() {
        const pagesLeftTabs_publisher = this.props.json.pages ?
            this.props.json.pages.map((page, id) => this.generateTable(page, id, "publisher")) :
            <TabPane tab="Tab 1" key="1">No Data</TabPane>;
        const pagesLeftTabs_recipient = this.props.json.pages_recipient ?
            this.props.json.pages_recipient.map((page, id) => this.generateTable(page, id, "recipient")) :
            <TabPane tab="Tab 1" key="1">No Data</TabPane>;

        return (
            <Tabs defaultActiveKey="1">
                <TabPane tab={<span><Icon type="smile" />Publisher Mode</span>} key="1">
                    <Tabs defaultActiveKey="0" tabPosition="left" >
                        {pagesLeftTabs_publisher}
                    </Tabs>
                </TabPane>
                <TabPane tab={<span><Icon type="user" />Recipient Mode</span>} key="2">
                    <Tabs defaultActiveKey="0" tabPosition="left" >
                        {pagesLeftTabs_recipient}
                    </Tabs>
                </TabPane>
            </Tabs>
        )
    }
}

export default PagesTab;


