import React from 'react'
import Modal from '../modal'
import GenericForm from '../genericform'
import { setup_fields, service_definition } from '../service/utils'
import Loading from '../loading'
import rpc from 'app/rpc'
import { merge, to_map, to_list } from 'app/utils'
import {i18n} from 'app/utils/i18n'

const RuleList = React.createClass({
  componentDidMount(){
    this.updateToggles( $(this.refs.form).find('.checkbox.toggle') )
  },
  updateToggles(sel){
    let self=this
    $(sel).checkbox({
      onChecked(){
        self.props.activateRule(this.name)
      },
      onUnchecked(){
        self.props.deactivateRule(this.name)
      }
    }).addClass("ready")
  },
  componentDidUpdate(newprops){
    this.updateToggles( $(this.refs.form).find('.checkbox.toggle:not(.ready)') )
  },
  render(){
    const props = this.props
    if (props.rules.length == 0)
      return (<span/>)
    return (
      <div className="ui equal width form" ref="form">
        <h4 className="ui header">
          {i18n("Rule presets")}
        </h4>
        <div className="ui two column grid"  style={{paddingTop:10}}>
        {props.rules.map( (r) => (
          <div key={r.id} className="field column">
            <div className="ui checkbox toggle" data-position="bottom left" data-tooltip={r.description}>
              <input type="checkbox" className="toggle" defaultChecked={r.is_active} name={r.id}/>
              <label>{i18n(r.name)}</label>
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

    let $form = $(this.refs.form.refs.form)
    if ( $form.form('validate form' ) ){
      //console.log("Ok %o", this.state.values)
      let operations={}
      let values = this.state.values
      this.get_fields().map( (f) => {
        let v = values[f.name]
        if (v)
          operations[f.name]=v
      })
      //console.log(operations)
      let name = $(this.refs.content).find("input[name=name]").val()
      let description = $(this.refs.content).find("textarea[name=description]").val()
      console.log(name, description)
      this.props.onUpdate( this.props.service.uuid, {
        name: name,
        description: description,
        config: operations
      } )
      // Save changed rules
      //console.log("Save rules %o %o", this.state.changed_rules, this.state.rules)
      this.state.rules.find( (rule) => {
        if (this.state.changed_rules.indexOf(rule.id)>=0){
          //console.log("Save rule %o", rule)
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
    let filter = { traits: this.props.service.traits, type: "rule template" }
    console.log(filter)
    Promise.all([
      rpc.call("plugin.component.catalog", filter),
      rpc.call("rules.list", { service: this.props.service.uuid })
    ]).then( ([templates, rules]) => {
      templates = templates.map( t => ({
        id: t.id,
        name: t.name,
        traits: t.traits,
        description: t.description,
        plugin: t.plugin,
        trigger: {
          trigger: t.extra.trigger.trigger,
          params: t.extra.trigger.params
        },
        actions: to_map(to_list(t.extra.actions).map( kv => {
          const k=kv[0]
          const v=kv[1]
          return [k, { params: v.params, action: v.action }]
        }))
      }))


      //console.log(templates, rules)
      const decorated_templates = templates.map( (t) => {
        let r = rules.find( (r) => t.id == r.from_template )
        //console.log("Found rule: %o", r)
        t = merge(t, {service: this.props.service.uuid, is_active: false, from_template: t.id } )
        if (r){
          return merge( t, {is_active: r.is_active, uuid: r.uuid} )
        }
        return t
      })
      //console.log(decorated_templates)
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
      <div className="ui text container" style={{paddingTop: 20}}>
        <div className="content" ref="content">
          <div className="ui form">
            <div className="field">
              <label>{i18n("Name")}</label>
              <input type="text" name="name"
                placeholder={i18n("Service name as shown in UI")}
                defaultValue={props.service.name}/>
            </div>

            <RuleList rules={rules} activateRule={this.handleActivateRule} deactivateRule={this.handleDeactivateRule}/>
            <GenericForm ref="form" fields={fields} data={{service: props.service}} updateForm={this.handleUpdateForm} onSubmit={this.handleAccept}/>

            <div className="field">
              <label>{i18n("Description")}</label>
              <textarea
                name="description"
                placeholder={i18n("Comments about this service")}
                defaultValue={i18n(props.service.description)}
              />
            </div>
          </div>
        </div>
        <div className="actions" style={{margin: "20px 0 0 0"}}>
          <button className="ui ok yellow button" onClick={this.handleAccept} style={{margin: 0}}>
            {i18n("Update service settings")}
          </button>
        </div>
      </div>
    )
  }
})


export default SetupComponent
