import React from 'react'
import i18n from 'app/utils/i18n'
import RulesHelp from './ruleshelp'

function Condition(props){
  const {condition, gotoStep, onUpdate, id, section} = props
  // console.log(props)
  let input_id="condition_"+id.join("_")
  return (
    <div className="ui extend with padding">
      <h2 className="ui centered header">
        <i className="ui icon help circle"/>
        {i18n("Condition")}
      </h2>

      <div className="separator" style={{height: 40}}/>
      <div className="ui form">
        <div className="field">
          <label>{i18n("Edit the condition")}</label>
          <input key={input_id} type="text" defaultValue={condition} id={input_id}/>
        </div>
      </div>
      <div className="separator" style={{height: 40}}/>
      <RulesHelp rule={props.rule} show={true}/>
      <div className="separator" style={{height: 40}}/>
      <div className="ui right aligned">
        <div className="ui buttons">
          <button
            className="ui button basic"
            onClick={() => gotoStep("prev", undefined, id)}>
              {i18n("Previous step")}
          </button>
          <button
            className="ui teal button"
            onClick={() => onUpdate({condition: $('#'+input_id).val()}) }>
              {i18n("Save and Continue")}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Condition
