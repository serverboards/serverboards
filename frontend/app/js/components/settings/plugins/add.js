import React from 'react'
import {Panes, Tip, Selector} from 'app/components'
import i18n from 'app/utils/i18n'
import {goto} from 'app/utils/store'

function View(props){
  const tip = (
    <Tip
      subtitle={i18n("Install plugins from the Serverboards marketplace")}
      description={i18n("All plugins are free to use, and allow you to add new functionalities to your Serverboards installation with a simple click")}
      />
  )

  const work = (
    <div className="ui vertical split area">
      <Selector
        title={i18n("Select a plugin to add")}
        get_items={props.get_items}
        no_items_label={i18n("You already have all the plugins installed. Maybe its time you [develop](https://serverboards.io/developers/) your own one?")}
        onSelect={(s) => props.onInstallPlugin(s.giturl)}
        />
      <div className="ui divider" style={{marginTop:0}}/>
      <div className="ui padding">
        {i18n("Or add manually from a git repository:")}
        <div className="ui form">
          <div className="field">
            <input id="add_plugin_url" type="text" style={{width: "30em"}} placeholder={i18n("Enter plugin git repository URL")}/>
          </div>
          <div className="field">
            <button className="ui button yellow" onClick={() => props.onInstallPlugin($('#add_plugin_url').val())}>
              {i18n("Install")}
            </button>
          </div>
        </div>
      </div>
      {(props.nextStep || props.prevStep) && (
        <div>
          <div className="ui divider" style={{marginTop:0}}/>
          <div className="ui padding right aligned">
            <div className="ui buttons">
              {props.prevStep && (
                <button className="ui basic button" onClick={props.prevStep}>
                  {props.prev_label || i18n("Back")}
                </button>
              )}
              {props.nextStep && (
                  <button className="ui teal button" onClick={props.nextStep}>
                    {props.next_label || i18n("Continue")}
                  </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="ui vertical split area">
      {!props.hide_menu && (
        <div className="ui top secondary menu">
          <h3 className="ui header">{i18n("Plugins")}</h3>
          <div className="item stretch"/>
          <div className="item">
            <a
                className="ui medium button"
                onClick={() => goto('/settings/plugins')}
                >
              {i18n("Back to list")}
            </a>
          </div>
        </div>
      )}
      <Panes
        column1={tip}
        column2={work}
        />
    </div>
  )
}

export default View
