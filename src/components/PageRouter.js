
import React from 'react';

import JsonEditor from './JsonEditor';
import RecorderTools from './RecorderTools';
import JsonList from './JsonList';
import SettingPage from './SettingPage';

class PageRouter extends React.Component {

    getPage = () => {
        if (this.props.page === "editor") {
            return <JsonEditor />
        } else if (this.props.page === "tools") {
            return <RecorderTools />
        } else if (this.props.page === "jsonList") {
            return <JsonList />
        } else if (this.props.page === "setting") {
            return <SettingPage />
        } else {
            return <JsonEditor />
        }
    }

    render() {
        return this.getPage();
    }
}

export default PageRouter;