import React from 'react'
import Modal from '../modal'
import GenericForm from '../genericform'
import { setup_fields, service_definition } from '../service'
import Loading from '../loading'
import rpc from 'app/rpc'
import { merge } from 'app/utils'

const RuleList = React.createClass({
  componentDidMount(){
    this.updateToggles( $(this.refs.form).find('.checkbox.toggle') )
  },
  updateToggles(sel){
    let self=this
    $(sel).checkbox({
      onChecked(ev){
        console.log("Activated rule name %o", this.name)
        self.props.activateRule(this.name)
      },
      onUnchecked(ev){
        console.log("Dectivated rule name %o", this.name)
        self.props.deactivateRule(this.name)
      }
    })
  },
  componentDidUpdate(newprops){
    this.updateToggles( $(this.refs.form).find('.checkbox.toggle') )
  },
  render(){
    const props = this.props
    if (props.rules.length == 0)
      return (<span/>)
    return (
      <div className="ui equal width form" ref="form">
        <h3 className="ui header">Rule presets</h3>
        <div className="ui meta">
          Here you can activate preset rules. Custom rules can be activated at the
          rules section
        </div>
        <div className="ui two column grid"  style={{paddingTop:10}}>
        {props.rules.map( (r) => (
          <div className="field column">
            <div className="ui checkbox toggle">
              <input type="checkbox" className="toggle" defaultChecked={r.is_active} name={r.id}/>
              <label>{r.name}
              <div className="ui meta">{r.description}</div></label>
            </div>
          </div>
        ))}
        </div>
      </div>
    )
  }
})

const SetupComponent=React.createClass({
  getInitialState(){
    let fields=undefined
    if (this.props.service_catalog){
      fields = this.get_fields()
    }
    return {fields,
      values:
        Object.assign({name: this.props.service.name}, this.props.service.config),
      changed_rules: [],
      rules: undefined
    }
  },
  handleActivateRule(id){
    let rules = this.state.rules.map( (r) => {
      if (r.id == id ){
        return merge(r, {is_active: true})
      }
      return r
    })
    let changed_rules=this.state.changed_rules.concat([id])
    console.log("updated rules: %o", rules)
    this.setState({rules, changed_rules})
  },
  handleDeactivateRule(id){
    let rules = this.state.rules.map( (r) => {
      if (r.id == id ){
        return merge(r, {is_active: false})
      }
      return r
    })
    console.log("updated rules: %o", rules)
    let changed_rules=this.state.changed_rules.concat([id])
    this.setState({rules, changed_rules})
  },
  handleAccept : function(ev){
    ev && ev.preventDefault()

    let form = this.refs.form.refs.form
    if ( $(form).form('validate form' ) ){
      //console.log("Ok %o", this.state.values)
      let operations={}
      let values = this.state.values
      this.get_fields().map( (f) => {
        let v = values[f.name]
        if (v)
          operations[f.name]=v
      })
      //console.log(operations)
      let name = operations.name
      delete operations.name
      let description = operations.description
      delete operations.description
      this.props.onUpdate( this.props.service.uuid, {
        name: name,
        description: description,
        config: operations
      } )
      // Save changed rules
      console.log("Save rules %o %o", this.state.changed_rules, this.state.rules)
      this.state.rules.find( (rule) => {
        if (this.state.changed_rules.indexOf(rule.id)>=0){
          console.log("Save rule %o", rule)
          this.props.onSaveRule(rule)
        }
      })
      this.props.onClose()
    }
  },
  handleUpdateForm : function(data){
    this.setState({values:data})
  },
  get_fields(){
    if (this.state && this.state.fields)
      return this.state.fields
    return setup_fields(this.props.service, this.props.service_catalog)
  },
  componentDidMount(){
    let filter = { traits: this.props.service.traits }
    console.log(filter)
    Promise.all([
      rpc.call("rules.templates", filter),
      rpc.call("rules.list", { service: this.props.service.uuid })
    ]).then( ([templates, rules]) => {
      console.log(templates, rules)
      const decorated_templates = templates.map( (t) => {
        let r = rules.find( (r) => t.id == r.from_template )
        console.log("Found rule: %o", r)
        t = merge(t, {service: this.props.service.uuid, is_active: false, from_template: t.id } )
        if (r){
          return merge( t, {is_active: r.is_active, uuid: r.uuid} )
        }
        return t
      })
      console.log(decorated_templates)
      this.setState({rules: decorated_templates})
    })
  },
  render(){
    const rules=this.state.rules || []

    let props=this.props
    let state=this.state
    if (!props.service_catalog)
      return (
        <Loading>
        Service catalog
        </Loading>
      )
    let fields = state.fields
    if (!fields)
      fields=this.get_fields()
    let servicedef=service_definition(this.props.service.type, this.props.service_catalog)
    return (
      <Modal onClose={props.onClose}>
        <h2 className="ui header">
          Update settings for {props.service.name}
        </h2>
        <div className="ui meta" style={{paddingBottom: 20}}>
          {servicedef.description || "No description at service definition"}
        </div>
        <div className="content">
          <GenericForm ref="form" fields={fields} updateForm={this.handleUpdateForm} onSubmit={this.handleAccept}/>
        </div>
        <RuleList rules={rules} activateRule={this.handleActivateRule} deactivateRule={this.handleDeactivateRule}/>
        <div className="actions">
          <button className="ui ok yellow button" onClick={this.handleAccept}>Accept</button>
        </div>
      </Modal>
    )
  }
})


export default SetupComponent
