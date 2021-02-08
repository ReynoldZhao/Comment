# Comment App

## Comment App Redux Design pattern

加载数据，都是放在action中，loadXXX: dispatch(fetchXXX()) 通过中间件获取，fetchXXX()是个actionCreator，里面放的有FETCH_DATA, endpoint, schema

还有的actioncreator丰富了action要想reducer中传递的内容

请求的endpoint放在url文件中，请求发送放在api文件中间件中，并且请求到的数据，会以

```json
{
	schema.name:{
		id-1: item,
		id-2: item
	},
	ids: []
}
```

的扁平化形式存放

领域数据reducer

```javascript
const createReducer = (name) => {
  return (state = {}, action) => {
    if(action.response && action.response[name]) {
      return {...state, ...action.response[name]}
    }
    return state;
  }
}
export default createReducer
所以每个领域的state里直接放的就是
{
	id-1: item,
	id-2: item,
        ...
}
```



## 1. Home Page

![image-20210208161423127](C:\Users\Lenovo\AppData\Roaming\Typora\typora-user-images\image-20210208161423127.png)

用来获取likes数据，和discounts数据，分别呈现在猜你喜欢组件以及，超值特惠中

### initialState

存放的都是ids

```javascript
const initialState = {
  likes: {
    isFetching: false,
    pageCount: 0,
    ids: []
  },
  discounts: {
    isFetching: false,
    ids: []
  }
};
```

### actions

//加载猜你喜欢的数据 loadLikes, 附加扩充的actionCreator，dispatch给reducer

//加载特惠商品 loadDiscounts

### reducer

就是直接把获取到的ids，存进来

### selector

根据home.js中state存放的likes, discounts的id，再到领域实体products中根据id找到对应的详细数据，返回

### 领域数据 Products

存放product数据，提供selector：

* getProductDetail
* getProductById

## 2. ProductDetail Page

![image-20210208161441090](C:\Users\Lenovo\AppData\Roaming\Typora\typora-user-images\image-20210208161441090.png)

module领域用到了detail.js，实体领域用到了product.js，shops.js

由home的likeitem，点击，通过路由到达product detail页面，

并且由`const productId = this.props.match.params.id;` 来获取点击的**product的id**

获取productDetail数据，relatedShop数据

componentDidMount阶段，通过判断已有数据有无，直接通过detailActions调用action，获取数据，存放在detial和products的state里，渲染的时候可以直接通过selector来获取

```javascript
  componentDidMount() {
    const { product } = this.props;
    if (!product) {
      const productId = this.props.match.params.id;
      this.props.detailActions.loadProductDetail(productId);
    } else if (!this.props.relatedShop) {
      this.props.detailActions.loadShopById(product.nearestShop);
    }
  }
```

## Redux detail.js

### initalState

存放的依然是id

```javascript
const initialState = {
  product: {
    isFetching: false,
    id: null
  },
  relatedShop: {
    isFetching: false,
    id: null
  }
};
```

### Actions

会先判断

```javascript
  //获取商品详情
  loadProductDetail: id => {
    return (dispatch, getState) => {
        //getProductDetail是products领域的，会去products领域判断，这个id对应的数据是否有detail数据，如果没用再用endpoint去发送请求获得
        //fetchProductDetail用的schema还是product，所以会存放在product中
      const product = getProductDetail(getState(), id);
      if (product) {
        return dispatch(fetchProductDetailSuccess(id));
      }
      const endpoint = url.getProductDetail(id);
      return dispatch(fetchProductDetail(endpoint, id));
    };
  },
  // 获取店铺信息，shop同理，不过会去shop实体领域中去查找
  loadShopById: id => {
    return (dispatch, getState) => {
      const shop = getShopById(getState(), id);
      if (shop) {
        return dispatch(fetchShopSuccess(id));
      }
      const endpoint = url.getShopById(id);
      return dispatch(fetchShopById(endpoint, id));
    };
  }
```

### reducer

由于detail中只会存id，所以只改变id

### selector

所以selector能不能获取到，要看actions中的load有没有加载进去，所以要在componentDidMount的时候直接load

```javascript
// selectors
//获取商品详情, 实际上是去product领域获取
export const getProduct = (state, id) => {
  return getProductDetail(state, id)
}
//获取管理的店铺信息，先去product领域获取，再由有无shopId，去shop领域确认
export const getRelatedShop = (state, productId) => {
  const product = getProductById(state, productId);
  let shopId = product ? product.nearestShop : null;
  if(shopId) {
    return getShopById(state, shopId);
  }
  return null;
}
```

## 3. Search Page

![image-20210208161454692](C:\Users\Lenovo\AppData\Roaming\Typora\typora-user-images\image-20210208161454692.png)

![image-20210208180319109](C:\Users\Lenovo\AppData\Roaming\Typora\typora-user-images\image-20210208180319109.png)

使用到的props, 相关关键词，输入文本，流行关键词，历史搜索关键词

```javascript
const mapStateToProps = (state, props) => {
  return {
    relatedKeywords: getRelatedKeywords(state),
    inputText: getInputText(state),
    popularKeywords: getPopularKeywords(state),
    historyKeywords: getHistoryKeywords(state)
  };
};
```

componentDidMount阶段就要，通过`const { loadPopularKeywords } = this.props.searchActions`
加载流行关键词

### SearchBox

```html
	<SearchBox inputText={inputText} relatedKeywords={relatedKeywords}
        onChange={this.handleChangeInput}
        onClear={this.handleClearInput}
        onCancel={this.handleCancel}
        onClickItem={this.handleClickItem}
        />
```

input的内容都是保存在search.js的redux state中的，所以每次变化都要调用search.js中的action，改变redux state中的值，例如`onChange={this.handleChangeInput}`
**输入的input实时变化，调用search中的action，改变redux state中关键词的值，并且根据此时的关键词，load最新的relatedkeywords，更新放在state里，继而重新渲染在searchBox组件中**

```javascript
  handleChangeInput = text => {
    const { setInputText, loadRelatedKeywords } = this.props.searchActions
    setInputText(text)
    loadRelatedKeywords(text)
  }
```

每次input内容变化，都会set state中的inputtext，并且加载最新的相关关检测

### `this.handleClickItem`

三个组件共享相同的，点击搜索逻辑: 更新keyword，放入搜索历史，加载最新的相关shop供searchResult使用，跳转页面

```javascript
  // 处理点击关键词的逻辑
  handleClickItem = item => {
    const { setInputText, addHistoryKeyword, loadRelatedShops } = this.props.searchActions
    setInputText(item.keyword)
    addHistoryKeyword(item.id)
    loadRelatedShops(item.id)
    this.props.history.push("/search_result")
  }
```

## Redux search.js

领域实体数据存放在keywords.js中，即search中存放的只是id，具体详细的数据要去entities中的keywords redux中通过其提供的selector方法获得。

### initialState

注意，虽然输入的是关键词，但是我们保存的基本都是id

```javascript
const initialState = {
  inputText: "",
  popularKeywords: {
    isFetching: false,
    ids: []
  },
  /**
   * relatedKeywords对象结构：
   * {
   *   '火锅': {
   *       isFetching: false,
   *       ids: []
   *    }
   * }
   */
  relatedKeywords: {},
  historyKeywords: [], //保存关键词id
    /**
   * searchedShopsByKeywords结构
   * {
   *   'keywordId': {
   *       isFetching: false,
   *       ids: [] 放的是shopId
   *    }
   * }
   */
  searchedShopsByKeyword: {}
};
```

### Actions

```javascript
  //获取热门关键词
  loadPopularKeywords: () => {
    return (dispatch, getState) => {
        //先到当前state检查有无已经加载，如若已经加载则action return null， 什么都不做，不然dispatch fetch，发送请求
      const { ids } = getState().search.popularKeywords;
      if (ids.length > 0) {
        return null;
      }
      const endpoint = url.getPopularKeywords();
      return dispatch(fetchPopularKeywords(endpoint));
    };
  },
  // 根据输入获取相关关键词
  loadRelatedKeywords: text => {
    return (dispatch, getState) => {
      const { relatedKeywords } = getState().search;
      if (relatedKeywords[text]) {
          //注意relatedKeywords的结构，逻辑同上
        return null;
      }
      const endpoint = url.getRelatedKeywords(text);
      return dispatch(fetchRelatedKeywords(text, endpoint));
    };
  },
  // 获取查询到的店铺列表
  loadRelatedShops: keyword => {
    return (dispatch, getState) => {
      const { searchedShopsByKeyword } = getState().search;
      if(searchedShopsByKeyword[keyword]) {
        return null
      }
        //请求连接，根据关键词，变化请求url
      const endpoint = url.getRelatedShops(keyword);
      return dispatch(fetchRelatedShops(keyword, endpoint));
    }
  },
      
  const fetchRelatedKeywords = (text, endpoint) => ({
  [FETCH_DATA]: {
    types: [
      types.FETCH_RELATED_KEYWORDS_REQUEST,
      types.FETCH_RELATED_KEYWORDS_SUCCESS,
      types.FETCH_RELATED_KEYWORDS_FAILURE
    ],
    endpoint,
    schema: keywordSchema
  },
  text
});
```

### reducers

更改和存放的还是，text对应的ids

```javascript
const popularKeywords = (state = initialState.popularKeywords, action)
//relatedKeyword在initalState中定义的结构特殊，使用两层reducer
const relatedKeywords = (state = initialState.relatedKeywords, action) => {
  switch (action.type) {
    case types.FETCH_RELATED_KEYWORDS_REQUEST:
    case types.FETCH_RELATED_KEYWORDS_SUCCESS:
    case types.FETCH_RELATED_KEYWORDS_FAILURE:
      return {
        ...state,
        [action.text]: relatedKeywordsByText(state[action.text], action)
      };
    default:
      return state;
  }
};

const relatedKeywordsByText = (
  state = { isFetching: false, ids: [] },
  action
) => {
  switch (action.type) {
    case types.FETCH_RELATED_KEYWORDS_REQUEST:
      return { ...state, isFetching: true };
    case types.FETCH_RELATED_KEYWORDS_SUCCESS:
      return {
        ...state,
        isFetching: false,
          //response中总有一个ids项
        ids: state.ids.concat(action.response.ids)
      };
    case types.FETCH_RELATED_KEYWORDS_FAILURE:
      return { ...state, isFetching: false };
    default:
      return state;
  }
};

//同上
//根据关键词查找相关shop，关键词会放进url里作为参数，返回shopId，放入shop.js领域实体中
//为啥大家请求不同，但是返回都是ids，并且能返回至这个请求所需要的时候的entitie，我就不知道了，可能每次请求都是一次一次的，单线程，所以能分清吧
const searchedShopsByKeyword = (state = initialState.searchedShopsByKeyword, action) => {
  switch (action.type) {
    case types.FETCH_SHOPS_REQUEST:
    case types.FETCH_SHOPS_SUCCESS:
    case types.FETCH_SHOPS_FAILURE:
      return {
        ...state,
        [action.text]: searchedShops(state[action.text], action)
      };
    default:
      return state;
  }
};

const searchedShops = (
  state = { isFetching: false, ids: [] },
  action
) => {
  switch (action.type) {
    case types.FETCH_SHOPS_REQUEST:
      return { ...state, isFetching: true };
    case types.FETCH_SHOPS_SUCCESS:
      return {
        ...state,
        isFetching: false,
        ids: action.response.ids
      };
    case types.FETCH_SHOPS_FAILURE:
      return { ...state, isFetching: false };
    default:
      return state;
  }
};

const historyKeywords = (state = initialState.historyKeywords, action) => {
  switch(action.type) {
    case types.ADD_HISTORY_KEYWORD: 
      const data = state.filter(item => {
        if(item !== action.text) {
          return true;
        }
        return false;
      })
      //这样每次搜索一个，都会直接放进历史的第一个
      return [action.text, ...data];
    case types.CLEAR_HISTORY_KEYWORDS:
      return [];
    default:
      return state;
  }
};

```

## 4. SearchResult Page

![image-20210208181044968](C:\Users\Lenovo\AppData\Roaming\Typora\typora-user-images\image-20210208181044968.png)

根据关键词，加载相应的shop，使用的是search.js中的逻辑

### actions

```javascript
  // 获取查询到的店铺列表
  loadRelatedShops: keyword => {
    return (dispatch, getState) => {
      const { searchedShopsByKeyword } = getState().search;
      if(searchedShopsByKeyword[keyword]) {
        return null
      }
      const endpoint = url.getRelatedShops(keyword);
      return dispatch(fetchRelatedShops(keyword, endpoint));
    }
  },
  //endpoint指定了keyword参数，会直接放回相应的shop到shop entities领域中去，直接获取即可
  const fetchRelatedShops = (text, endpoint) => ({
  [FETCH_DATA]: {
    types: [
      types.FETCH_SHOPS_REQUEST,
      types.FETCH_SHOPS_SUCCESS,
      types.FETCH_SHOPS_FAILURE
    ],
    endpoint,
    schema: shopSchema
  },
  text
})
//reducer，由于state的特殊结构，要使用两层reducer
const searchedShopsByKeyword = (state = initialState.searchedShopsByKeyword, action) => {
  switch (action.type) {
    case types.FETCH_SHOPS_REQUEST:
    case types.FETCH_SHOPS_SUCCESS:
    case types.FETCH_SHOPS_FAILURE:
      return {
        ...state,
        [action.text]: searchedShops(state[action.text], action)
      };
    default:
      return state;
  }
};

const searchedShops = (
  state = { isFetching: false, ids: [] },
  action
) => {
  switch (action.type) {
    case types.FETCH_SHOPS_REQUEST:
      return { ...state, isFetching: true };
    case types.FETCH_SHOPS_SUCCESS:
      return {
        ...state,
        isFetching: false,
        ids: action.response.ids
      };
    case types.FETCH_SHOPS_FAILURE:
      return { ...state, isFetching: false };
    default:
      return state;
  }
};
```

## 5. User / UserMain Page

![image-20210208202318561](C:\Users\Lenovo\AppData\Roaming\Typora\typora-user-images\image-20210208202318561.png)

![image-20210208202419963](C:\Users\Lenovo\AppData\Roaming\Typora\typora-user-images\image-20210208202419963.png)

**User 中的 props** 有

* orders
* currentTab

这一层返回的数据已经是，根据currentTab筛选过的orders，并传递给usermain组件，作为data，放的还是ids，实体在order.js中

```javascript
export const getOrders = state => {
  const key = ["ids", "toPayIds", "availableIds", "refundIds"][
    state.user.currentTab
  ];
  return state.user.orders[key].map(id => {
    return getOrderById(state, id);
  });
};
```

## 6. UserMain

实现的逻辑，可以对订单进行删除和评价，评价完成后评价按钮消失

### props

```javascript
const mapStateToProps = (state, props) => {
  return {
      //目前指向那个tab，根据tab返回相应的数据
    currentTab: getCurrentTab(state),
      //正在删除是那个order
    deletingOrderId: getDeletingOrderId(state),
      //正在评论是哪个order
    commentingOrderId: getCommentingOrderId(state),
      //评论内容
    orderComment: getCurrentOrderComment(state),
      //评价等级
    orderStars: getCurrentOrderStars(state)
  };
};
```

## Redux User.js

order实体数据放在order.js中，comment数据放在comment.js中，user中只保存order的ids，分类tab的ids，当前的tab，以及当前选中的order的数据

### initialState

```javascript
const initialState = {
  orders: {
    isFetching: false,
    ids: [],
    toPayIds: [], //待付款的订单id
    availableIds: [], //可使用的订单id
    refundIds: [] //退款订单id
  },
  currentTab: 0,
    //当前选中的order
  currentOrder: {
    id: null,
    isDeleting: false, //是否正在被删除
    isCommenting: false, //是否正在被评论
    comment: "",
    stars: 0
  }
};
```



### Actions 发送动作

```javascript
// 获取订单列表
  loadOrders: ()
	发送请求，获取所有的订单信息，
// 切换tab
  setCurrentTab
 //删除订单
  removeOrder
  	发送请求删除，当前选中的order信息
    调用order领域实体的action，删除id相应的order实体数据
//显示，隐藏删除对话框
    showDeleteDialog: orderId =>
    hideDeleteDialog: ()
//显示，隐藏订单评价编辑框
	showCommentArea: orderId
     hideCommentArea: ()
//设置评价信息，设置评级等级
	setComment: comment
   	setStars: stars
  以上都是简单的设置一下就可以了
//提交评价
  submitComment: () => {
    return (dispatch, getState) => {
      dispatch(postCommentRequest());
        //模仿发送，返回promise对象
      return new Promise((resolve, reject) => {
        setTimeout(() => {
            //根据user initialState中的currentOrder，合成commentObj对象
          const {
            currentOrder: { id, stars, comment }
          } = getState().user;
          const commentObj = {
            id: +new Date(),
            stars: stars,
            content: comment
          };
          dispatch(postCommentSuccess());
            //给comment领域实体发送，增加
          dispatch(commentActions.addComment(commentObj));
            //给order领域实体，给相应id的order增加comment信息
          dispatch(orderActions.addComment(id, commentObj.id));
          resolve();
        });
      });
    };
  }
```

### reducers

#### order reducer

````javascript
// reducers
const orders = (state = initialState.orders, action) => {
  switch (action.type) {
          //获取order的异步模板部分
    case types.FETCH_ORDERS_REQUEST:
      return { ...state, isFetching: true };
    case types.FETCH_ORDERS_SUCCESS:
          //给initialState中的四类tab分配id
      const toPayIds = action.response.ids.filter(
        id => action.response.orders[id].type === TO_PAY_TYPE
      );
      const availableIds = action.response.ids.filter(
        id => action.response.orders[id].type === AVAILABLE_TYPE
      );
      const refundIds = action.response.ids.filter(
        id => action.response.orders[id].type === REFUND_TYPE
      );
      return {
        ...state,
        isFetching: false,
        ids: state.ids.concat(action.response.ids),
        toPayIds: state.toPayIds.concat(toPayIds),
        availableIds: state.availableIds.concat(availableIds),
        refundIds: state.refundIds.concat(refundIds)
      };
          //调用order所属的delete时，不仅要在order中删除，还要在user中删除
    case orderTypes.DELETE_ORDER:
    case types.DELETE_ORDER_SUCCESS:
      return {
        ...state,
          //四类tab中都删除这个id
        ids: removeOrderId(state, "ids", action.orderId),
        toPayIds: removeOrderId(state, "toPayIds", action.orderId),
        availableIds: removeOrderId(state, "availableIds", action.orderId),
        refundIds: removeOrderId(state, "refundIds", action.orderId)
      };
    default:
      return state;
  }
};
````

#### 简单reducers

```javascript
const removeOrderId = (state, key, orderId)
const currentTab = (state = initialState.currentTab, action)
```

#### currentOrder

```javascript
const currentOrder = (state = initialState.currentOrder, action) => {
  switch (action.type) {
          //显示对话框，会由点击删除组件调用相应的action发出
    case types.SHOW_DELETE_DIALOG:
      return {
        ...state,
        id: action.orderId,
        isDeleting: true
      };
          //显示评论框，会由点击评论组件调用相应的action发出
    case types.SHOW_COMMENT_AREA:
      return {
        ...state,
        id: action.orderId,
        isCommenting: true
      };
    //隐藏删除框，评论框，删除订单类，发送评论类，action结束后，直接返回initialState.currentOrder就可以了
    case types.HIDE_DELETE_DIALOG:
    case types.HIDE_COMMENT_AREA:
    case types.DELETE_ORDER_SUCCESS:
    case types.DELETE_ORDER_FAILURE:
    case types.POST_COMMENT_SUCCESS:
    case types.POST_COMMENT_FAILURE:
      return initialState.currentOrder;
          //设置信息
    case types.SET_COMMENT:
      return { ...state, comment: action.comment };
    case types.SET_STARS:
      return { ...state, stars: action.stars };
    default:
      return state;
  }
};
```





### Redux Orders.js

```javascript
import createReducer from "../../../utils/createReducer"

export const schema = {
  name: 'orders',
  id: 'id',
} 

export const USED_TYPE = 1; // 已消费
export const TO_PAY_TYPE = 2; //待付款
export const AVAILABLE_TYPE = 3; //可使用
export const REFUND_TYPE = 4; //退款

export const types = {
  //删除订单
  DELETE_ORDER: "ORDERS/DELETE_ORDER",
  //新增评价
  ADD_COMMENT: "ORDERS/ADD_COMMENT"
}

export const actions = {
  //删除订单 order领域的
  deleteOrder: (orderId) => ({
    type: types.DELETE_ORDER,
    orderId
  }),
  //新增评价 order领域的，给order增加commentid
    //comment领域的就是增加内容了
  addComment: (orderId, commentId) => ({
    type: types.ADD_COMMENT,
    orderId,
    commentId
  })
}


const normalReducer = createReducer(schema.name)

const reducer = (state = {}, action) => {
    //如果是处理增加评论
  if(action.type === types.ADD_COMMENT) {
    return {
      ...state,
      [action.orderId]: {
        ...state[action.orderId],
          //只增加commentId
        commentId: action.commentId
      }
    }
      //如果是删除order
  } else if(action.type === types.DELETE_ORDER) {
    const {[action.orderId]: deleteOrder, ...restOrders} = state;
    return restOrders;
  } else {
    return normalReducer(state, action)
  }
}

export default reducer;

// selectors
export const getOrderById = (state, id) => {
  return state.entities.orders[id]
}

```

### Redux Comment.js

```javascript
import createReducer from "../../../utils/createReducer"

export const schema = {
  name: "comments",
  id: "id"
}

export const types = {
  ADD_COMMENT: "COMMENT/ADD_COMMENT"
}

export const actions = {
  addComment: (comment) => ({
    type: types.ADD_COMMENT,
    comment
  })
}

const normalReducer = createReducer(schema.name)
const reducer = (state = {}, action) => {
  if(action.type === types.ADD_COMMENT) {
    return {...state, [action.comment.id]: action.comment}
  } else {
    return normalReducer(state,action);
  }
}

export default reducer;
```

## 7. Back to UserMain

**state**

```javascript
const mapStateToProps = (state, props) => {
  return {
      //都是user中的selector
    currentTab: getCurrentTab(state),
    deletingOrderId: getDeletingOrderId(state),
    commentingOrderId: getCommentingOrderId(state),
    orderComment: getCurrentOrderComment(state),
    orderStars: getCurrentOrderStars(state)
  };
};
```

接收到的data数据已经是user中根据tab处理后的order ids数据了，切换tab的比较简单，讲一下渲染每个item的写法

**首先**，是否渲染删除confirm组件`{deletingOrderId ? this.renderConfirmDialog() : null}`, 根据是否存在`deletingOrderId`来确定

### renderOrderList

```javascript
  renderOrderList = data => {
    const { commentingOrderId, orderComment, orderStars } = this.props;
    return data.map(item => {
      return (
        <OrderItem
          key={item.id}
          data={item}
  //点击评价触发，传入item.id，会调用userActions，更新user redux initialState中currentOrder中的id（即userMain中用到的props：commentingOrderId），以及isCommenting设置为true，表示当前orderItem，正在被评价，可供渲染评价框
          onComment={this.handleComment.bind(this, item.id)}
          
           //选中当前要评价的订单
          handleComment = orderId => {
            const {
              userActions: { showCommentArea }
            } = this.props;
            showCommentArea(orderId);
          };
  //是否是当前正在被评论的，将渲染评论框
          isCommenting={item.id === commentingOrderId}
//如果是，给出user redux的state中的comment
          comment={item.id === commentingOrderId ? orderComment : ""}
//如果是，获得当前order的评级等级
          stars={item.id === commentingOrderId ? orderStars : 0}
//如果改变评论框中的内容触发的回调，会调用userActions，更新user redux initialState中currentOrder中的comment
          onCommentChange={this.handleCommentChange}
//如果改变星级触发的回调，会调用userActions，更新user redux initialState中currentOrder中的stars
          onStarsChange={this.handleStarsChange}
//提交评论触发的回调，会调用userActions，将评论发送给后端，并且发送至comment.js领域以及order.js领域
          onSubmitComment={this.handleSubmitComment}
//取消评论会触发的回调，会调用userActions，恢复到initialState最初的状态
          onCancelComment={this.handleCancelComment}
//点击删除当前orderItem，会调用userActions，更新user redux initialState中currentOrder中的id（即userMain中用到的props：deletingOrderId），以及isDeleting设置为true，表示当前orderItem，正在被删除，可供渲染删除确认框
          onRemove={this.handleRemove.bind(this, item.id)}
        />
      );
    });
  };
```

举例一个完整的链

1. UserMain中的OrderItem触发onSubmitComment提交评论

```javascript
<OrderItem
	onSubmitComment={this.handleSubmitComment}
/>
//定义的回调函数是触发，userActions中的action，submitComment
  //提交评价
  handleSubmitComment = () => {
    const {
      userActions: { submitComment }
    } = this.props;
    submitComment();
  };
```

2. User redux中的action，actionCreator就不写了

``` javascript
  submitComment: () => {
    return (dispatch, getState) => {
      dispatch(postCommentRequest());
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const {
            currentOrder: { id, stars, comment }
          } = getState().user;
          const commentObj = {
            id: +new Date(),
            stars: stars,
            content: comment
          };
          dispatch(postCommentSuccess());
          dispatch(commentActions.addComment(commentObj));
          dispatch(orderActions.addComment(id, commentObj.id));
          resolve();
        });
      });
    };
  }
```

3. user中的reducer，comment领域的reducer，order领域中的reducer接受action，更新state

```javascript
//user中的
const currentOrder = (state = initialState.currentOrder, action) => {
  switch (action.type) {
          ......
    case types.POST_COMMENT_SUCCESS:
      return initialState.currentOrder;
    default:
      return state;
  }
};
//comment
const reducer = (state = {}, action) => {
  if(action.type === types.ADD_COMMENT) {
    return {...state, [action.comment.id]: action.comment}
}
//order中的
const reducer = (state = {}, action) => {
  if(action.type === types.ADD_COMMENT) {
    return {
      ...state,
      [action.orderId]: {
        ...state[action.orderId],
        commentId: action.commentId
      }
    }
}
```

### renderConfirmDialog 删除框

根据orderItem点击删除来触发`{deletingOrderId ? this.renderConfirmDialog() : null}`
取消：`onCancel={hideDeleteDialog}`, 给userAction，恢复initialState
删除：`onConfirm={removeOrder}`, id会由user redux中state的currentOder来获得，进行删除操作

## 总之就是把，当前选中的数据，从回调一开始，就都更新在user redux中，数据，id，标记为isCommenting，isDeleting，在触发回调的时候，都对其进行更新，获取也从他获取