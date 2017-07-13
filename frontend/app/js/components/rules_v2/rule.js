import React from 'react'
import i18n from 'app/utils/i18n'
import Action from './action'
import When from './when'
import Error from '../error'

import Description from './edit/description'
import Service from './edit/service'
import Trigger from './edit/trigger'
import Params from './edit/params'

class Rule extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      rule: this.props.rule,
      section: {
        id: "description",
        data: {},
        section: "description"
      }
    }
    this.handleUpdate = (what, update) => {
      this.setState({rule: map_set(rule, what, update) })
    }
    this.handleChangeSection = (section, id, data) => {
      console.log(section, id, data)
      if (this.state.section.section == section &&
          this.state.section.id == id){
        this.setState({section: {id: "description", section: "description", data: {}}})
      }
      else{
        this.setState({section: {id, section, data}})
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
    }
    return () => (
      <Error>{i18n(`Unknown section ${this.state.section.section}`)}</Error>
    )
  }
  render(){
    const rule = this.state.rule
    const section = this.state.section
    const Section = this.getCurrentSection()

    return (
      <div id="rule" className="ui two column grid grey background" style={{margin:0, height: "100%"}}>
        <div className="ui column">
          <div className="ui round pane white background">
            <div className="ui attached top form">
              <div className="ui input seamless white">
                <i className="icon pencil"/>
                <input type="text" placeholder={i18n("Rule name")} defaultValue={rule.name}/>
              </div>
            </div>
            <div className="ui rule graph with scroll">
              <div className="connected">
                <When
                  when={rule.rule.when}
                  section={section}
                  onChangeSection={this.handleChangeSection}
                  />
                {rule.rule.actions.map( (action, index) => (
                  <Action key={index} action={action}/>
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
              onUpdate={this.handleUpdate}
              {...section.data}
              />
          </div>
        </div>
      </div>
    )
  }
}

export default Rule
