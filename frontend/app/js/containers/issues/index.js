import React from 'react'
import IssuesView from 'app/components/issues'
import rpc from 'app/rpc'
import {flatmap, dedup} from 'app/utils'

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
      labels: []
    }
  },
  componentDidMount(){
    this.setState({loading: true})

    rpc.call("issues.list").then( (issues) => {
      const labels = dedup(flatmap(issues, (i) => i.labels )).sort( (a,b) => (a.name.localeCompare(b.name)) )
      this.setState({
        loading: false,
        issues,
        show_issues: this.applyFilter(issues, this.state.filter),
        open_count: issues.filter( (i) => i.status=='open' ).length,
        closed_count: issues.filter( (i) => i.status=='closed' ).length,
        all_count: issues.length,
        labels: labels
      })
    } )
  },
  setFilter(update){
    let filter = this.state.filter
    if (update[0]=="+")
      filter=filter+" "+update.slice(1)
    if (update[0]=="-"){
      const tag=update.slice(1)
      filter=filter.split(' ').filter( (f) => f!=tag).join(' ')
      console.log(tag, filter)
    }
    if (update.startsWith("status:")){
      const pfilter=filter.split(' ').filter( (f) => !f.startsWith("status:") ).join(' ')
      filter=update+' '+pfilter
    }
    filter=filter.trim()

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
    if (filter.indexOf("tag:")>=0){
      const tags=filter.split(' ').filter( (f) => f.startsWith("tag:")).map( (f) => f.slice(4) )
      show_issues=show_issues.filter( (i) => i.labels.filter( (l) => tags.indexOf(l.name)>=0 ).length>0 )
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
