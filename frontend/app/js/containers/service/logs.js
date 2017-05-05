import connect from 'app/containers/connect'
import View from 'app/containers/logs'
import React from 'react'

const Logs = function(props){
  return (
    <View filter={{service: props.service.uuid}}/>
  )
}

export default Logs
