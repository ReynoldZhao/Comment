import { createStore, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import api from "./middleware/api";
import rootReducer from "./modules";

let store;

if (
  process.env.NODE_ENV !== "production" &&
  window.__REDUX_DEVTOOLS_EXTENSION__
) {
  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__;
  store = createStore(rootReducer, composeEnhancers(applyMiddleware(thunk, api)));
} else {
  store = createStore(rootReducer, applyMiddleware(thunk, api));
}

//thunk帮助我们能处理函数类型的中间件
//api中间件执行具体的请求的封装
export default store;
