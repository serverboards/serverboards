import React from 'react'
import View from 'app/components/dashboard'
import {goto} from 'app/utils/store'
import { connect } from 'react-redux'

let Dashboard = connect(
  (state) => {
    let last_project = localStorage.last_project
    if (!last_project){
      const prjs = state.project.projects
      console.log(prjs)
      if (prjs && prjs.length > 0)
        last_project=prjs[0].shortname
    }
    if (last_project && last_project.indexOf("/")<0)
      goto(`/project/${last_project}/`)
    return {}
  }
)(View)

export default Dashboard
