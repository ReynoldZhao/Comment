import React, { Component } from "react";
import LikeItem from "../LikeItem";
import Loading from "../../../../components/Loading";
import "./style.css";

class LikeList extends Component {
  constructor(props) {
    super(props);
    this.myRef = React.createRef();
    this.removeListener = false;
  }

  render() {
    const { data, pageCount } = this.props;
    return (
      <div ref={this.myRef} className="likeList">
        <div className="likeList__header">猜你喜欢</div>
        <div className="likeList__list">
          {data.map((item, index) => {
            return <LikeItem key={index} data={item} />;
          })}
        </div>
        {pageCount < 3 ? (
          <Loading />
        ) : (
          <a className="likeList__viewAll">查看更多</a>
        )}
      </div>
    );
  }

  componentDidMount() {
    document.addEventListener("scroll", this.handleScroll);
    this.props.fetchData();
  }

  componentDidUpdate() {
    if (this.props.pageCount >= 3 && !this.removeListener) {
      document.removeEventListener("scroll", this.handleScroll);
      this.removeListener = true;
    }
  }

  componentWillUnmount() {
    if (!this.removeListener) {
      document.removeEventListener("scroll", this.handleScroll);
    }
  }

  // 处理屏幕滚动事件，实现加载更多的效果
  handleScroll = () => {
    const {isFetching} = this.props;
    //滑动距离
    const scrollTop = document.documentElement.scrollTop 
    || document.body.scrollTop;
    //可视区域高度
    const screenHeight = document.documentElement.clientHeight;
    //likelist 距离屏幕顶部距离
    const likeListTop = this.myRef.current.offsetTop;
    //likelist 内容高度
    const likeListHeight = this.myRef.current.offsetHeight;
    if(scrollTop >= likeListHeight + likeListTop - screenHeight) {
      this.props.fetchData();
    }
  }
}

export default LikeList;
