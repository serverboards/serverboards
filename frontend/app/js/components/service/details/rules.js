import React from 'react'
import RealRules from 'app/containers/rules'


function Rules(props){
  console.log(props)
  return (
    <RealRules filter={{service:props.service.uuid}}/>
  )
}

export default Rules
