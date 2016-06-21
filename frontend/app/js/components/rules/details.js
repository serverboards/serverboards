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


                <h2 className="ui dividing header">Rule:</h2>
                <div className="field">
                    <label>Service:</label>
                    <input type="text" defaultValue={props.rule.service} name="trigger"/>
                </div>
                <div className="field">
                    <label>Trigger:</label>
                    <input type="text" defaultValue={props.rule.trigger} name="trigger"/>
                </div>

                <div className="field">
                    <label>Action:</label>
                    <input type="text" defaultValue={props.rule.action.action} name="action"/>
                </div>
                
                <h2 className="ui dividing header">Extra params:</h2>
                <div className="field">
                    <div className="field">
                        <label>Message:</label>
                        <input type="text" defaultValue={props.rule.action.params.message} name="message"/>
                    </div>
                </div>

                <button className="ui button green">Save changes</button>
            </div>

        </div>
    )
}