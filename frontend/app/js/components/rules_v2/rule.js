import React from 'react'
import i18n from 'app/utils/i18n'
import Action from './action'
import When from 'app/containers/rules_v2/when'

function Rule(props){
  const {rule, section, Section} = props

  return (
    <div id="rule" className="ui two column grid grey background" style={{margin:0, height: "100%"}}>
      <div className="ui column">
        <div className="ui round pane white background">
          <div className="ui attached top form">
            <div className="ui input seamless white">
              <i className="icon pencil"/>
              <input
                type="text"
                placeholder={i18n("Rule name")}
                defaultValue={rule.name}
                onClick={() => props.gotoStep("description")}
                />
            </div>
          </div>
          <div className="ui rule graph with scroll">
            <div className="connected">
              <When
                when={rule.rule.when}
                section={section}
                gotoStep={props.gotoStep}
                />
              {rule.rule.actions.map( (action, index) => (
                <Action
                  key={index}
                  path={[index]}
                  action={action}
                  section={section}
                  gotoStep={props.gotoStep}
                  />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="column">
        <div className="ui round right pane white background">
          <Section
            id={section.id}
            rule={rule}
            onUpdate={props.onUpdate}
            gotoStep={props.gotoStep}
            {...section.data}
            />
        </div>
      </div>
    </div>
  )
}

export default Rule
