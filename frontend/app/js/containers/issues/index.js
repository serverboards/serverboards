import React from 'react'
import IssuesView from 'app/components/issues'
import rpc from 'app/rpc'

const Issues = React.createClass({
  getInitialState(){
    return {
      open_count: 0,
      closed_count: 0,
      all_count: 0,
      issues: [],
      show_issues: [],
      filter: "status:open",
      loading: true,
    }
  },
  componentDidMount(){
    this.setState({loading: true})

    rpc.call("issues.list").then( (issues) => {
      this.setState({
        loading: false,
        issues,
        show_issues: this.applyFilter(issues, this.state.filter),
        open_count: issues.filter( (i) => i.status=='open' ).length,
        closed_count: issues.filter( (i) => i.status=='closed' ).length,
        all_count: issues.length,
      })
    } )
  },
  setFilter(filter){
    this.setState({
      filter,
      show_issues: this.applyFilter(this.state.issues, filter)
    })
  },
  applyFilter(issues, filter){
    let show_issues=issues
    if (filter.indexOf("status:open")>=0){
      show_issues=show_issues.filter( (i) => i.status=="open" )
    }
    if (filter.indexOf("status:closed")>=0){
      show_issues=show_issues.filter( (i) => i.status=="closed" )
    }
    return show_issues
  },
  render(){
    return (
      <IssuesView {...this.props} {...this.state} setFilter={this.setFilter}/>
    )
  }
})

export default Issues
