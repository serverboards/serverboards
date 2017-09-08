import React from 'react'
import View from 'app/components/dashboard'
import {goto} from 'app/utils/store'
import { connect } from 'react-redux'
import { get_last_project } from 'app/utils/project'

let Dashboard = connect(
  (state) => {
    get_last_project()
      .then(project => project ? goto(`/project/${project}/`) : null )
    return {}
  }
)(View)

export default Dashboard
