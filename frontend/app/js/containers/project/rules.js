import React from 'react'
import RulesView from '../rules'

function Rules(props){
  return (
    <RulesView {...props} filter={{project: props.project.shortname}}/>
  )
}

export default Rules
