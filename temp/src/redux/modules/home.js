import { combineReducers} from "redux"
import url from "../../utils/url";
import { FETCH_DATA } from "../middleware/api";
import { schema } from "./entities/products";

//发送网络请求时会用到的参数的常量对象
export const params = {
  PATH_LIKES: "likes",
  PATH_DISCOUNTS: "discounts",
  PAGE_SIZE_LIKES: 5,
  PAGE_SIZE_DISCOUNTS: 3
};

//异步请求类型
export const types = {
  //获取猜你喜欢请求
  FETCH_LIKES_REQUEST: "HOME/FETCH_LIKES_REQUEST",
  //获取猜你喜欢请求成功
  FETCH_LIKES_SUCCESS: "HOME/FETCH_LIKES_SUCCESS",
  //获取猜你喜欢请求失败
  FETCH_LIKES_FAILURE: "HOME/FETCH_LIKES_FAILURE",
  //获取超值特惠请求
  FETCH_DISCOUNTS_REQUEST: "HOME/FETCH_DISCOUNTS_REQUEST",
  //获取超值特惠请求成功
  FETCH_DISCOUNTS_SUCCESS: "HOME/FETCH_DISCOUNTS_SUCCESS",
  //获取超值特惠请求失败
  FETCH_DISCOUNTS_FAILURE: "HOME/FETCH_DISCOUNTS_FAILURE"
};

// 因为是内部请求的外部不会调用，
//action本质是一个object
// const fetchLikesRequest = () => ({
//   type: types.FETCH_LIKES_REQUEST
// })

// const fetchLikesSuccess = (data) => ({
//   type: types.FETCH_LIKES_SUCCESS,
//   data
// })

// const fetchLikesFailure = (error) => ({
//   type: types.FETCH_LIKES_FAILURE,
//   error
// })

//action creator 
// export const actions = {
//   loadLikes: () => {
//     return (dispatch, getState) => {
//       dispatch(fetchLikesRequest());
//       return  get(url.getProductList(0, 10)).then(
//         data => {
//           dispatch(fetchLikesSuccess(data));
//         },
//         error => {
//           dispatch(fetchLikesFailure(error));
//         }
//       );
//     }
//   }
// }

//首页的初始状态
const initialState = {
  likes: {
    isFetching: false,
    pageCount: 0,
    ids: [],
  },
  discounts: {
    isFetching: false,
    ids: [],
  }
}

//发送action
export const actions = {
  //加载猜你喜欢的数据
  loadLikes: () => {
    return (dispatch, getState) => {
      const { pageCount } = getState().home.likes;
      const rowIndex = pageCount * params.PAGE_SIZE_LIKES
      const endpoint = url.getProductList(params.PATH_LIKES, rowIndex, params.PAGE_SIZE_LIKES)
      return dispatch(fetchLikes(endpoint))
    }
  },
  loadDiscounts: () => {
    return (dispatch, getState) => {
      const endpoint = url.getProductList(
        params.PATH_DISCOUNTS,
        0,
        params.PAGE_SIZE_DISCOUNTS
      );
      return dispatch(fetchDiscounts(endpoint));
    };
  }
}

//action creator
//本质上是个集成的action
const fetchLikes = (endpoint) => ({
  [FETCH_DATA]: {
    types: [
      types.FETCH_LIKES_REQUEST,
      types.FETCH_LIKES_SUCCESS,
      types.FETCH_LIKES_FAILURE
    ],
    endpoint,
    schema
  }
})

const fetchDiscounts = endpoint => ({
  [FETCH_DATA]: {
    types: [
      types.FETCH_DISCOUNTS_REQUEST,
      types.FETCH_DISCOUNTS_SUCCESS,
      types.FETCH_DISCOUNTS_FAILURE
    ],
    endpoint,
    schema
  }
});

//reducers 接受action，改变state
const likes = (state = initialState.likes, action) => {
  switch (action.type) {
    case types.FETCH_DISCOUNTS_REQUEST:
      return { ...state, isFetching: true };
    case types.FETCH_DISCOUNTS_SUCCESS:
      return {
        ...state,
        isFetching: false,
        pageCount: state.pageCount + 1,
        ids: state.ids.concat(action.response.ids)
      };
    case types.FETCH_DISCOUNTS_FAILURE:
      return { ...state, isFetching: false }
    default:
      return state;
  }
};

const discounts = (state = initialState.discounts, action) => {
  switch (action.type) {
    case types.FETCH_DISCOUNTS_REQUEST:
      return { ...state, isFetching: true };
    case types.FETCH_DISCOUNTS_SUCCESS:
      return {
        ...state,
        isFetching: false,
        ids: state.ids.concat(action.response.ids)
      };
    case types.FETCH_DISCOUNTS_FAILURE:
      return {...state, isFetching: false}
    default:
      return state;
  }
};

const reducer = combineReducers({
  discounts,
  likes
})

export default reducer; 

//selectors
//获取猜你喜欢
export const getLikes = state => {
  return state.home.likes.ids.map(id => {
    return state.entities.products[id]
  })
}

//获取特惠商品state
export const getDiscounts = state => {
  return state.home.discounts.ids.map(id => {
    return state.entities.products[id]
  })
}

//猜你喜欢当前分页码
export const getLikesIsFetching = state => {
  return state.home.likes.isFetching;
}

//猜你喜欢当前分页码
export const getPageCountOfLikes = state => {
  return state.home.likes.pageCount
}