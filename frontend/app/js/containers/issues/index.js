import React from 'react'
import IssuesView from 'app/components/issues'
import rpc from 'app/rpc'
import {flatmap, dedup, sort_by_name} from 'app/utils'
import connect from 'app/containers/connect'
import { load_issues, clear_issues, clear_issues_count } from 'app/actions/issues'
import i18n from 'app/utils/i18n'

class Issues extends React.Component{
  constructor(props){
    super(props)

    this.state = {
      filter: this.props.filter || "status:open",
      issues: [],
      issues_show: [],
      labels: [],
      open_count: 0,
      closed_count: 0,
      all_count: 0
    }
  }
  componentDidMount(){
    this.updateIssues()
  }
  updateIssues(filter=undefined){
    if (filter == undefined)
      filter = this.state.filter
    else {
      if (filter == this.state.filter){ // no changes
        console.log("No filter change", filter, this.state.filter)
        return
      }
    }
    this.setState({filter})

    let real_filter = {}
    for (const f of filter.split(' ')){
      const kv = f.split(':')
      if (kv.length==1)
        real_filter["q"] = (real_filter["q"] || []).concat(kv)
      else{
        real_filter[kv[0]] = (real_filter[kv[0]] || []).concat(kv[1])
      }
    }

    let status, q, tags
    if (real_filter["project"])
      real_filter["project"]=real_filter["project"][0]
    if (real_filter["status"]){
      status = real_filter["status"][0]
      delete real_filter["status"]
    }
    if (real_filter["q"]){
      q = real_filter["q"].map( i => i.toLowerCase() ).filter( i => i)
      delete real_filter["q"]
    }
    if (real_filter["tag"]){
      tags = real_filter["tag"]
      delete real_filter["tag"]
    }

    console.log("Filter: %o -> %o", filter, real_filter)

    rpc.call("issues.list", real_filter).then( issues => {
      let issues_show = status ? issues.filter( i => i.status == status ) : issues
      if (q){
        issues_show = issues_show.filter( is => {
          let descr = `${is.title} ${is.status} ${is.labels.map(l => l.name).join(' ')} ${is.id} #${is.id} ${is.date} ${is.creator || "system"}`.toLowerCase()
          for (const qq of q){
            if (!descr.includes(qq))
              return false
          }
          return true
        })
      }
      if (tags){
        issues_show = issues_show.filter( is => {
          for (const t of tags){
            console.log("tags", t, is)
            let ok = false
            for (const l of is.labels)
              if (l.name == t)
                ok = true
            if (!ok)
              return false
          }
          return true
        })
      }

      let open_count=0, closed_count=0, all_count=0
      for (const i of issues){
        if (i.status=="open")
          open_count+=1
        if (i.status=="closed")
          closed_count+=1
        all_count+=1
      }

      const labels = sort_by_name( dedup( flatmap(issues, (i) => i.labels) ) )
      this.setState({issues, labels, issues_show, open_count, closed_count, all_count})
    })
  }
  setFilter(filter){
    console.log("Set filter", filter)
    this.updateIssues(filter)
  }
  updateFilter(update){
    console.log("Update filter with this data", update)
    let filter = this.state.filter.split(' ')
    if (update.startsWith('+')){
      filter = filter.concat(update.slice(1))
    }
    else if (update.startsWith('-')){
      let torem = update.slice(1)
      if (torem.endsWith(":"))
        filter = filter.filter( f => !f.startsWith(torem) )
      else
        filter = filter.filter( f => f != torem )
    }
    else{
      let updated = false
      const k = update.split(':')[0]+':'
      filter = filter.map( f => {
        if (f.startsWith(k)){
          if (updated)
            return ""
          updated = true
          return update
        }
        else
          return f
      })
      if (!updated)
        filter = filter.concat(update)
    }

    this.setFilter(filter.join(' '))
  }
  render(){
    return (
      <IssuesView
        {...this.state}
        {...this.props}
        setFilter={this.setFilter.bind(this)}
        updateFilter={this.updateFilter.bind(this)}
        />
    )
  }
}

export default Issues
