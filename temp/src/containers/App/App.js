import React, { Component } from 'react'
import ErrorToast from "../../components/ErrorToast";
import { connect } from "react-redux";
import { bindActionCreators } from 'redux';
import { actions as appActions, getError } from "../../redux/modules/app";
import Home from '../Home';

class App extends Component {
  render() {
    const { error, appActions: { clearError } } = this.props;
    return (
      <div className="App">
        <Home/>
        {error ? <ErrorToast msg={error} clearError={clearError} /> : null}
      </div>
    );
  }
}

//state是redux的，props是当前组件的
const mapStateToProps = (state, props) => {
  return {
    error: getError(state)
  };
};

//将组件内的函数/回调函数，如果要触发状态改变，就用
const mapDispatchToProps = (dispatch) => {
  return {
    //可以直接发送actions，不用调用dispatch了
    appActions: bindActionCreators(appActions, dispatch)
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(App);