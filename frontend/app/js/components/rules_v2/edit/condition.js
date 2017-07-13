import React from 'react'
import i18n from 'app/utils/i18n'

function Condition({condition}){
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
          <input type="text" value={condition}/>
        </div>
      </div>
      <div className="separator" style={{height: 40}}/>
      <button className="ui teal button">{i18n("Save and Continue")}</button>
    </div>
  )
}

export default Condition
