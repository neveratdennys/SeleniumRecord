import React from 'react';
import { Button, AutoComplete, Input, Icon } from 'antd';

class SearchBar extends React.Component {

    render() {
        return (
            <div className="search-wrapper" >
                <AutoComplete
                    className="custmizeSearchBar"
                    size="large"
                    dataSource={this.props.dataSource}
                    filterOption={(inputValue, option) => option.props.children.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1}
                    placeholder="Search here"
                    onSelect={this.props.onSelect}
                    onSearch={this.props.onSearch}
                    allowClear={true}
                />                
            </div>
        )
    }
}



export default SearchBar;



                                    