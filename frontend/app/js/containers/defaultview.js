import React from 'react'
import View from 'app/components/defaultview'
import {goto} from 'app/utils/store'
import { connect } from 'react-redux'
import { get_last_project } from 'app/utils/project'
import Flash from 'app/flash'
import rpc from 'app/rpc'

let DefaultView = connect(
  (state) => {
    rpc.call('settings.get', ['ui', {}]).then(data => data.start || 'default')
      .then( start => {
        if (start != 'default')
          goto(start)
        })
      .catch((e) => Flash.error(e))
    return {}
  }
)(View)

export default DefaultView
