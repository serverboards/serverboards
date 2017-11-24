import React from 'react'
import Rule from './rule'
import Modal from 'app/components/modal'
import i18n from 'app/utils/i18n'

const EMPTY_RULE={
  uuid: undefined,
  name: "",
  description: "",
  rule: {
    when: {
      id: "A",
      type: "trigger",
      trigger: undefined,
      params: {}
    },
    actions: []
  }
}

function AddRule(props){
  return (
    <Rule
      {...props}
      rule={{...EMPTY_RULE, project: props.project.shortname}}
      cancel_label={i18n("Cancel add rule")}
      save_label={i18n("Create rule")}
      />
  )
}

export default AddRule
