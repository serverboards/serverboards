import React from 'react'
import AllIssues from 'app/containers/issues'

function Issues(props){
  return (
    <AllIssues serverboard={props.serverboard.shortname}/>
  )
}

export default Issues
