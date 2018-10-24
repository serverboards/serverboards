import React from 'react'
import i18n from 'app/utils/i18n'

function RuleMenu(props){
  return (
    <React.Fragment>
      <div className="item">
      {props.cancel_label ? (
        <a onClick={props.gotoRules} className="ui button basic">
          {props.cancel_label}
        </a>
      ) : (
        <a onClick={props.gotoRules} className="item">
          <i className="ui chevron left icon"/> {i18n("Back")}
        </a>
      )}
      </div>
      <div className="item stretch"/>
      <div className="item">
        <a onClick={props.saveRule} className={`ui button teal ${props.saveRule ? "" : "disabled"}`}>{props.save_label || i18n("Save rule")}</a>
      </div>
    </React.Fragment>
  )
}

export default RuleMenu
