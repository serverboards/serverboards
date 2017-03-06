import React from 'react'
import {object_is_equal} from 'app/utils'
import {i18n} from 'app/utils/i18n'

const TriggerSelect=React.createClass({
  propTypes:{
    defaultValue: React.PropTypes.string,
    triggers: React.PropTypes.array.isRequired,
    onChange: React.PropTypes.func.isRequired
  },
  componentDidMount(){
    let self=this
    $(this.refs.trigger).dropdown({
      onChange(value, text, $el){
        self.props.onChange(self.find_trigger(value, self.props.triggers))
      }
    }).dropdown("set selected", this.props.defaultValue)
  },
  componentWillReceiveProps(newprops){
    if (!object_is_equal(newprops.triggers, this.props.triggers)){
      console.log("Got new props: ", this.props.defaultValue)
      setTimeout(() =>
        $(this.refs.trigger).dropdown("set selected", this.props.defaultValue)
      , 100)
      this.props.onChange(this.find_trigger(this.props.defaultValue, newprops.triggers))
    }
  },
  find_trigger(id, triggers){
    return triggers.find( (t) => t.id == id )
  },
  render(){
    const props=this.props
    return (
      <div ref="trigger" className="ui fluid search normal selection dropdown">
        <input type="hidden" defaultValue={props.defaultValue}
          name="trigger" onChange={props.onChange}/>
        <i className="dropdown icon"/>
        <div className="default text">{i18n("Select trigger")}</div>
        <div className="menu">
          {props.triggers.map( (tr) => (
            <div key={tr.id} className="item" data-value={tr.id}>{i18n(tr.name)}</div>
          ))}
        </div>
      </div>
    )
  }
})

export default TriggerSelect
