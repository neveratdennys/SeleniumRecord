import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import 'antd/dist/antd.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

ReactDOM.render((
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  ), document.getElementById('root'));
