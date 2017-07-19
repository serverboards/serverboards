import React from 'react'
import View from 'app/components/rules_v2/rule'
import Loading from 'app/components/loading'
import i18n from 'app/utils/i18n'
import {object_is_equal, merge, map_set, concat} from 'app/utils'
import cache from 'app/utils/cache'

import Description from 'app/components/rules_v2/edit/description'
import Service from 'app/components/rules_v2/edit/service'
import Trigger from 'app/components/rules_v2/edit/trigger'
import Params from 'app/components/rules_v2/edit/params'
import Condition from 'app/components/rules_v2/edit/condition'
import ActionEdit from 'app/components/rules_v2/edit/action'
import Error from 'app/components/error'

function find_action(actions, path){
  if (path.length==0)
    return actions
  let head = path[0]
  let rest = path.slice(1)
  return find_action(actions[path[0]], rest)
}

function update_rule(rule, path, value){
  if (path.length==0){
      switch (rule.type){
        case "action":
          return merge(rule, {config: value})
        case "condition":
          return merge(rule, {condition: value})
        default:
          console.error("Invalid rule leaf node for updating: %o", rule)
          return rule
      }
  }
  const head = path[0]
  const rest = path.slice(1)
  if (!isNaN(head)){ // an index of an array
    const before=(head>0) ? rule.slice(0, head) : []
    const after=rule.slice(head+1)
    const item = update_rule(rule[head], rest, value)
    const ret = [...before, item, ...after]
    console.assert(ret.length==rule.length, ret.length, rule.length, rule, before, head, after)
    return ret
  }
  else{
    return merge(rule, {[head]: update_rule(rule[head], rest, value)})
  }
}

class Model extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      rule: this.props.rule,
      section: {
        id: "description",
        data: {},
        section: "description"
      },
    }
    this.updateRule = (what, value) => {
      let rule = this.state.rule
      if (!isNaN(what[0])){
        console.log("Update %o => %o", what, value)
        rule = update_rule(rule, ["rule", "actions", ...what], value)
      }
      else{
        rule = map_set( rule, ["rule", ...what], value )
      }
      this.setState({rule})
      return rule
    }
    // Passing the optional rule is necesary when updating state and changing section
    // if not, by the wayt react apply state, will not realize of the updated
    // data on section change. Maybe on next gotoStep.
    this.gotoStep = (step, rule=undefined) => {
      const {section} = this.state
      if (!rule)
        rule=this.state.rule
      const {when} = rule.rule
      const onChangeSection = (section, id, data) =>
        this.setState({section: {id, section, data}})

      switch(step){
        case "description":
          onChangeSection("description")
          break;
        case "when:service":
          cache.service(when.params.service_id).then( s =>
            onChangeSection("when:service", null, {
              service_id: s.uuid,
              onSelect: (s) => {
                console.log("Selected service %o", s)
                const rule = this.updateRule(["when", "params", "service_id"], s.uuid )
                this.gotoStep("when:trigger", rule)
              },
              type: s.type,
              nextStep: () => this.gotoStep("when:trigger")
            })
          )
          break;
        case "when:trigger":
          onChangeSection("when:trigger", null, {
            current: when.trigger,
            onSelect: (t) => {
              const rule = this.updateRule(["when","trigger"], t.id)
              this.gotoStep("when:params", rule)
            },
            prevStep: () => this.gotoStep("when:service"),
            nextStep: () => this.gotoStep("when:params")
          })
          break;
        case "when:params":
          if (when.params.service_id){
            cache.service(when.params.service_id).then( s =>{
              console.log(s)
              onChangeSection("params", ["when", "params"], {
                data: when.params,
                trigger: when.trigger,
                skip_fields: Object.keys(s.config).concat("service_id").concat("service"),
                prevStep: () => this.gotoStep("when:trigger"),
                onUpdate: (data) => {
                  this.updateRule(["when","params"], data)
                  this.gotoStep("action:"+rule.rule.actions[0].id)
                }
              } )
            })
          }
          else{
            onChangeSection("params", ["when", "params"], {
              data: when.params,
              trigger: when.trigger,
              skip_fields: [],
              prevStep: () => this.gotoStep("when:trigger"),
              onUpdate: (data) => {
                this.updateRule(["when","params"], data)
                this.gotoStep("action:"+rule.rule.actions[0].id)
              }
            } )
          }
          break;
        default:
          const action = find_action(rule.rule.actions, step)
          if (action){
            if (action.type=="action"){
              onChangeSection("action", step, {
                action
              })
            }
            else{
              onChangeSection("condition", step, {
                action,
                condition: action.condition,
                onUpdate: (data) => {
                  this.updateRule(step, data)
                }
              })
            }
          }
          else{
            console.error("Unknown step %o", step)
          }
          break;
      }
    }
  }
  getCurrentSection(){
    switch(this.state.section.section){
      case "description":
        return Description
      case "params":
        return Params
      case "when:service":
        return Service
      case "when:trigger":
        return Trigger
      case "condition":
        return Condition
      case "action":
        return ActionEdit
    }
    return () => (
      <Error>{i18n(`Unknown section ${this.state.section.section}`)}</Error>
    )
  }
  render(){
    const props = this.props
    const state = this.state
    if (!props.rule)
      return (
        <div>{i18n("Unknown Rule. Try another.")}</div>
      )
    return (
      <View
        {...props}
        {...state}
        Section={this.getCurrentSection()}
        // onUpdate={this.updateRule}
        gotoStep={this.gotoStep}
        />
    )
  }
}

export default Model
