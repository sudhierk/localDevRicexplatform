import React, { Component } from "react";
import Pagination from "react-js-pagination";
import "./pagination.css";

class PaginationCustom extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activePage: 1,
      totalItems: 0
    };
  }
  handlePageChange = activePage => {
    // console.log(activePage, this.props.itemsPerPage);
    let skipValue = (activePage - 1) * this.props.itemsPerPage;
    this.props.fetchFunction(skipValue, this.props.itemsPerPage);
    this.setState({ activePage });
  };
  componentDidMount() {
    this.props.fetchFunction(0, this.props.itemsPerPage);
  }
  render() {
    /******************************************
    VALUES:
    1) #TotalItems
    2) #itemsPerPage
    3) #Page Range
    4) #URL
    5) #ActivePage
    6) #ComponentAPI

    CALCULATED VALUES:
    1)#SkipValue: (#ActivePage-1 * #itemsPerPage)
    2)

    ACTIONS:
    1) ComponentAPI that fetch needed information and

    //After store was updated, component where that pagination was gonna update
    ******************************************/
   if (this.props.totalItemsCount && Math.ceil(this.props.totalItemsCount / this.props.itemsPerPage) < this.state.activePage) {
       this.setState({activePage: 1});
   }
    return (
      <React.Fragment>
        <Pagination
          nextPageText=""
          prevPageText=""
          hideFirstLastPages
          activePage={this.state.activePage}
          itemsCountPerPage={this.props.itemsPerPage}
          totalItemsCount={this.props.totalItemsCount}
          pageRangeDisplayed={this.props.pagesAtOnce}
          onChange={this.handlePageChange}
        />
      </React.Fragment>
    );
  }
}

export default PaginationCustom;
