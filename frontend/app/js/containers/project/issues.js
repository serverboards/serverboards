import React from 'react'
import AllIssues from 'app/containers/issues'

function Issues(props){
  return (
    <AllIssues project={props.project.shortname} setSectionMenu={props.setSectionMenu} setSectionMenuProps={props.setSectionMenuProps}/>
  )
}

export default Issues
