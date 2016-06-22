import React from 'react'

export default function(props){
  console.log("Details %o", props)
  return (
    <div>
      <h1 className="ui header">Rule {props.rule.name}</h1>

      <div className="ui form">
        <div className="field">
          <label>Name:</label>
          <input type="text" defaultValue={props.rule.name} name="name"/>
        </div>
        <div className="field">
          <label>Description:</label>
          <textarea type="text" defaultValue={props.rule.description} name="trigger"/>
        </div>


        <h2 className="ui dividing header">Trigger:</h2>
        <div className="field">
          <label>Service:</label>
          <input type="text" defaultValue={props.rule.trigger.service} name="trigger"/>
        </div>
        <div className="field">
          <label>Trigger:</label>
          <input type="text" defaultValue={props.rule.trigger.trigger} name="trigger"/>
        </div>
        <div className="field">
          <label>Grace time:</label>
          <input type="text" defaultValue={props.rule.trigger.params.grace} name="message"/>
        </div>


        <h2 className="ui dividing header">Actions:</h2>
        {props.rule.actions.map( (action) =>
          <div>
            <h3 className="ui header">Action at {action.state}:</h3>
            <div className="field">
              <label>Action:</label>
              <input type="text" defaultValue={action.action} name="action"/>
            </div>

            <div className="field">
              <label>Message:</label>
              <input type="text" defaultValue={action.params.message} name="message"/>
            </div>
          </div>
        )}

        <button className="ui button green">Save changes</button>
      </div>

    </div>
  )
}
