import React from 'react'
import i18n from 'app/utils/i18n'

function Description(props){
  return (
    <div className="extend">
      <div className="ui attached top form">
        <h3 className="ui header">Description</h3>
      </div>
      <textarea
        className="ui fill area dark hover"
        defaultValue={props.rule.description}
        onChange={(ev) => props.onUpdate("description", ev.target.value)}
        placeholder={i18n("Enter here a description of what this rule do.")}
        />
    </div>

  )
}

export default Description
