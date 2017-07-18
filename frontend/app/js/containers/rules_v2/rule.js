import React from 'react'
import View from 'app/components/rules_v2/rule'
import Loading from 'app/components/loading'
import i18n from 'app/utils/i18n'
import {object_is_equal, merge, map_set} from 'app/utils'
import cache from 'app/utils/cache'

import Description from 'app/components/rules_v2/edit/description'
import Service from 'app/components/rules_v2/edit/service'
import Trigger from 'app/components/rules_v2/edit/trigger'
import Params from 'app/components/rules_v2/edit/params'
import Condition from 'app/components/rules_v2/edit/condition'
import ActionEdit from 'app/components/rules_v2/edit/action'
import Error from 'app/components/error'


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
      const rule = map_set( this.state.rule, ["rule", ...what], value )
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
          onChangeSection("params", ["when", "params"], {
            data: when.params,
            trigger: when.trigger,
            skip_fields: service_params.concat("service_id"),
            prevStep: () => this.gotoStep("when:trigger")
          } )
          break;
        default:
          console.error("Unknown step %o", step)
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
