import React from 'react'

function Description(props){
  return (
    <div className="extend">
      <div className="ui attached top form">
        <h3 className="ui header">Description</h3>
      </div>
      <textarea className="ui fill area">{props.rule.description}</textarea>
    </div>

  )
}

export default Description
