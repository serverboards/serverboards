import React from 'react'
import View from 'app/components/dashboard'
import {goto} from 'app/utils/store'
import { connect } from 'react-redux'
import { get_last_project } from 'app/utils/project'
import Flash from 'app/flash'
import rpc from 'app/rpc'

let Dashboard = connect(
  (state) => {
    get_last_project()
      .then(project =>
        false ?
          `/project/${project}/` :
          rpc.call('settings.get', ['ui', {}]).then(data => data.start || '/project/wizard')
        )
      .then((path) => goto(path))
      .catch((e) => Flash.error(e))
    return {}
  }
)(View)

export default Dashboard
