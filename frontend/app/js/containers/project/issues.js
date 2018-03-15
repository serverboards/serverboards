import React from 'react'
import AllIssues from 'app/containers/issues'
import { clear_issues_count_at_project } from 'app/actions/issues'
import store from 'app/utils/store'

class Issues extends React.Component{
  componentDidMount(){
    store.dispatch( clear_issues_count_at_project(this.props.project.shortname) )
  }
  render(){
    const props = this.props
    return (
      <AllIssues project={props.project.shortname} setSectionMenu={props.setSectionMenu} setSectionMenuProps={props.setSectionMenuProps}/>
    )
  }
}

export default Issues
