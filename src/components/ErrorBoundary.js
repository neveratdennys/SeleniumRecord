import React from 'react';
import { EasterEggGame } from './EasterEggGame';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidCatch(error, info) {
    this.setState({ hasError: true });
  }  

  render() {
    if (this.state.hasError) {  
      return (
        <div> 
          <h1>Error! Something went wrong.</h1>
          <EasterEggGame />
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;