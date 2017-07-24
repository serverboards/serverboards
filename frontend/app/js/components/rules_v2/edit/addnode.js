import React from 'react'
import i18n from 'app/utils/i18n'

function AddNode(props){
  const {AddNode, gotoStep, onUpdate, id, section, addNode} = props
  console.log(props)
  let input_id="AddNode_"+id.join("_")
  return (
    <div className="ui extend with padding">
      <h2 className="ui centered header">
        <i className="ui icon plus"/>
        {i18n("Add an action or condition")}
      </h2>

      <div className="separator" style={{height: 40}}/>
      <div className="ui one narrow column form">
        <button
          className="ui button basic basic teal"
          onClick={() => addNode("action")}>
            {i18n("Add action")}
        </button>
        <button
          className="ui button basic basic teal"
          onClick={() => addNode("condition")}>
            {i18n("Add condition")}
        </button>
      </div>
      <div className="separator" style={{height: 40}}/>
      <div className="ui right aligned">
        <div className="ui buttons">
          <button
            className="ui button basic"
            onClick={() => gotoStep("prev", undefined, id)}>
              {i18n("Previous step")}
          </button>
          <button
            className="ui button basic"
            onClick={() => gotoStep("next", undefined, id)}>
              {i18n("Skip step")}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddNode
