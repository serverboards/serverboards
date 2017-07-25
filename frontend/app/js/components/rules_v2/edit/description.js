import React from 'react'

function Description(props){
  return (
    <div className="extend">
      <div className="ui attached top form">
        <h3 className="ui header">Description</h3>
      </div>
      <textarea
        className="ui fill area"
        defaultValue={props.rule.description}
        onChange={(ev) => props.onUpdate("description", ev.target.value)}
        />
    </div>

  )
}

export default Description
