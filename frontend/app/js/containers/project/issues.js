import React from 'react'
import AllIssues from 'app/containers/issues'

function Issues(props){
  return (
    <AllIssues project={props.project.shortname}/>
  )
}

export default Issues
