import React from 'react'
import IssuesView from 'app/components/issues'
import rpc from 'app/rpc'
import {flatmap, dedup} from 'app/utils'
import connect from 'app/containers/connect'
import { load_issues, clear_issues } from 'app/actions/issues'
import i18n from 'app/utils/i18n'

const IssuesOld = React.createClass({
  getInitialState(){
    return {
      open_count: 0,
      closed_count: 0,
      all_count: 0,
      issues: [],
      issues_show: [],
      filter: this.props.filter || "status:open",
      loading: true,
      labels: [],
      show_empty: false
    }
  },
  componentDidMount(){
    this.setState({loading: true})

    // Preselect project
    if (this.props.project)
      this.setFilter(`project:${this.props.project}`)
    else
      rpc.call("issues.list").then( this.updateIssueList )
  },
  updateIssueList(issues, filter){
    filter = filter || this.state.filter
    const labels = dedup(flatmap(issues, (i) => i.labels )).sort( (a,b) => (a.name.localeCompare(b.name)) )
    const issues_all = this.applyFilter(issues, filter)
    const issues_show = this.applyStatusFilter(issues_all, filter)
    this.setState({
      loading: false,
      issues,
      issues_show,
      open_count: issues_all.filter( (i) => i.status=='open' ).length,
      closed_count: issues_all.filter( (i) => i.status=='closed' ).length,
      all_count: issues_all.length,
      labels: labels,
      filter
    })
  },
  setFilter(update){
    let filter = this.state.filter
    if (update[0]=="+")
      filter=filter+" "+update.slice(1)
    else if (update[0]=="-"){
      const tag=update.slice(1)
      filter=filter.split(' ').filter( (f) => f!=tag).join(' ')
      console.log(tag, filter)
    }
    else if (update.indexOf(':')>0){ // for change status: projects: ...
      const prefix=update.split(':')[0]+':'
      const postfix=update.slice(prefix.length)
      filter = filter.split(' ').filter( (s) => !s.startsWith(prefix)).join(' ')
      console.log(postfix)
      if (postfix!="none"){
        filter += " " + update
      }
    }
    filter=filter.trim()

    if (update.startsWith("project:")){ // filters with server reload
      this.setState({filter})
      const project=update.slice(12)
      if (project!="none")
        rpc.call("issues.list",{alias:`project/${project}`}).then( this.updateIssueList )
      else
        rpc.call("issues.list",[]).then( this.updateIssueList )
    }
    else{ // Filters with only local filtering
      this.updateIssueList(this.state.issues, filter)
    }
  },
  applyFilter(issues, filter){
    let show_issues=issues
    if (filter.indexOf("tag:")>=0){
      const tags=filter.split(' ').filter( (f) => f.startsWith("tag:")).map( (f) => f.slice(4) )
      show_issues=show_issues.filter( (i) => i.labels.filter( (l) => tags.indexOf(l.name)>=0 ).length>0 )
    }

    return show_issues
  },
  applyStatusFilter(issues, filter){
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

const Issues = connect({
  state(state, props){
    const issues = state.issues.issues || []
    const filter = state.issues.filter.filter( f => !f.startsWith("status:") )

    // Manual filter for status
    let issues_show=issues
    {
      const statusl = state.issues.filter.filter( f => f.startsWith("status:") )
      if (statusl.length>0 && statusl[0]!="status:*"){
        const status = statusl[0].slice(7,1000)
        issues_show = issues.filter( i => i.status == status )
      }
    }

    // Manual filter for tags
    filter.filter( f => f.startsWith("tag:") ).map( f => {
      let tag=f.slice(4)
      issues_show=issues_show.filter( (i) => i.labels.filter( (l) => l.name == tag ).length>0 )
    })

    const labels = dedup(flatmap(issues_show, (i) => i.labels )).sort( (a,b) => (a.name.localeCompare(b.name)) )
    return {
      issues,
      issues_show,
      all_count: issues.length,
      open_count: issues.filter( (i) => i.status=='open' ).length,
      closed_count: issues.filter( (i) => i.status=='closed' ).length,
      filter: state.issues.filter,
      labels
    }
  },
  handlers: (dispatch) => ({
    setFilter(filtermod){
      if (!filtermod){
        dispatch( load_issues(["status:open"]) )
        return
      }
      let filter = this.filter
      for (let update of filtermod.split(' ')){
        if (update[0]=="+")
          filter=filter.concat(update.slice(1))
        else if (update[0]=="-"){
          const tag=update.slice(1)
          filter=filter.filter( (f) => f!=tag)
        }
        else if (update.indexOf(':')>0){ // for change status: projects: ...
          const prefix=update.split(':')[0]+':'
          const postfix=update.slice(prefix.length)
          filter = filter.filter( (s) => !s.startsWith(prefix))
          if (postfix!="none" && postfix!=""){
            filter = filter.concat(update)
          }
        }
      }
      console.log("Set filter %o %o", filter)
      dispatch( load_issues(filter) )

    }
  }),
  store_enter: (state, props) => {
    let filter
    if (props.project)
      filter=[`project:${props.project}`, "status:open"]
    else
      filter = state.issues.filter

    return [
      () => load_issues(filter)
    ]
  },
  store_exit: [ clear_issues ],
  loading(state, props){
    if (state.issues.issues == undefined){
      return i18n("Issues")
    }
    return false
  }
})(IssuesView)


export default Issues
