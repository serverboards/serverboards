import React from 'react'
import RulesView from '../rules_v2'

function Rules(props){
  return (
    <RulesView {...props} filter={{project: props.project.shortname}}/>
  )
}

export default Rules
