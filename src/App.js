import React, { Component } from 'react';
import './App.css';

import SiderPanel from './components/SiderPanel';
import FooterPanel from './components/FooterPanel';
import PageRouter from './components/PageRouter';
import { Layout } from 'antd';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      page: "editor"
    };
    
    this.changePage = this.changePage.bind(this);
    
    chrome.runtime.onMessage.addListener(
      (request) => {
        if (request.message === "Open_Saved_Json_List") {
          this.changePage({key: "jsonList"});
        } else if( request.message === "Open_Json_Editor") {
          if(this.state.page !== "editor") {
            this.changePage({key: "editor"});
          }
        }
      }
    );
  }

  changePage = ({ key }) => {
    this.setState(() => ({ page: key }));
  }

  render() {
    return (
      <Layout>
        <SiderPanel selectedKey={this.state.page} changePage={this.changePage} />
        <Layout>
          <PageRouter page={this.state.page} />
          <FooterPanel />
        </Layout>
      </Layout>
    );
  }
}

export default App;