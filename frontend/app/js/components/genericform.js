import React from 'react'
import rpc from 'app/rpc'
import {MarkdownPreview} from 'react-marked-markdown'
import {to_list} from 'app/utils'
import Flash from 'app/flash'

const RichDescription=React.createClass({
  process_description(vars){
    vars = vars || []
    let text = this.props.value
    vars.map( (kv) => {
      text=text.replace(`{{${kv[0]}}}`, kv[1])
    })
    return text
  },
  getInitialState(){
    return {
      content: this.process_description(),
      extraClass: "loading"
    }
  },
  componentDidMount(){
    Promise.all( (this.props.vars || []).map( (v) => { // For each var run plugin, get value, stop plugin
      let p=new Promise((resolve, reject) => {
        rpc.call("plugin.start", [v.command])
        .then((uuid) => {
          rpc.call(`${uuid}.${v.call}`, [])
          .then((content) => resolve([v.id, content]))
          .catch((e) => reject(e))
          .then(() => rpc.call("plugin.stop", [uuid]))
          .catch((e) => true) // no prob if no stop
        })
        .catch((e) => reject(e))
      })
      return p
    })).then( (vars) => { // Then set it into the state, update content
      this.setState({content: this.process_description(vars), extraClass: ""})
    }).catch((e) => {
      console.error(e)
      this.setState({content: "Error loading dynamic data. Contact plugin author. [Error #100]", extraClass: "error"})
      Flash.error("Error loading dynamic data. Contact plugin author.",{error: 100})
    })
  },
  render(){
    const props=this.props
    const state=this.state
    return (
      <div className={`${props.className} ${state.extraClass || ""}`}><MarkdownPreview value={state.content}/></div>
    )
  }
})

const SelectService=React.createClass({
  contextTypes:{
    store: React.PropTypes.object.isRequired
  },
  getInitialState(){
    return { items: [] }
  },
  componentDidMount(){
    let self=this
    let filter = {}
    let store_state = this.context.store.getState()
    if (self.props.traits)
      filter.traits=self.props.traits
    if (store_state.serverboard.current)
      filter.serverboard=store_state.serverboard.current

    rpc.call("service.list", filter).then( (services) => {
      const results=services.map( (s) => ({
        //name: s.name,
        value: s.uuid,
        name: s.name,
        description: s.fields.filter( (p) => p.card ).map( (p) => p.value ).join(',')
      }))
      self.setState({items: results})
      $(self.refs.select).dropdown({
        onChange(value){
          self.props.setValue(self.props.name, value)
        }
      })
    })
  },
  render(){
    const props = this.props
    return (
      <div className="field">
        <label>{props.label}</label>
        <RichDescription className="ui meta" value={props.description} vars={props.vars}/>
        <div ref="select" className={`ui fluid ${props.search ? "search" : ""} selection dropdown`}>
          <input type="hidden" name={props.name} defaultValue={props.value} onChange={props.onChange}/>
          <i className="dropdown icon"></i>
          <div className="default text" style={{display:"block"}}>{props.value || props.placeholder}</div>
          <div className="menu">
            {(this.state.items || []).map( (ac) => (
              <div key={ac.id} className="item" data-value={ac.value}>{ac.name}<span className="ui meta" style={{float:"right"}}>{ac.description}</span></div>
            ))}
          </div>
        </div>
      </div>
    )
  }
})

let GenericField=React.createClass({
  getInitialState(){
    return { items: [] }
  },
  handleChange: function(ev){
    this.props.setValue(this.props.name, ev.target.value)
  },
  componentDidMount(){
    // Some may need post initialization
    switch (this.props.type){
      case 'select':
        $(this.refs.select).dropdown()
        break;
      default:
        ;;
      break;
    }
  },
  render(){
    let props=this.props
    switch (props.type){
      case undefined:
      case '':
      case 'text':
        return (
          <div className="field">
            <label>{props.label}</label>
            <RichDescription className="ui meta" value={props.description} vars={props.vars}/>
            <input type="text"
              name={props.name}
              placeholder={props.placeholder || props.description}
              defaultValue={props.value}
              onChange={this.handleChange}/>
          </div>
        )
      case 'url':
        return (
          <div className="field">
            <label>{props.label}</label>
            <RichDescription className="ui meta" value={props.description} vars={props.vars}/>
            <input type="url"
              name={props.name}
              placeholder={props.placeholder || props.description}
              defaultValue={props.value}
              onChange={this.handleChange}/>
          </div>
        )
      case 'textarea':
        return (
          <div className="field">
            <label>{props.label}</label>
            <RichDescription className="ui meta" value={props.description} vars={props.vars}/>
            <textarea
              name={props.name}
              placeholder={props.placeholder || props.description}
              defaultValue={props.value}
              onChange={this.handleChange}/>
          </div>
        )
      case 'password':
        return (
          <div className="field">
            <label>{props.label}</label>
            <RichDescription className="ui meta" value={props.description} vars={props.vars}/>
            <input type="password"
              name={props.name}
              placeholder={props.placeholder || props.description}
              defaultValue={props.value}
              onChange={this.handleChange}/>
          </div>
        )
      case 'description':
        return (
          <div className="field">
            <label>{props.label}</label>
            <RichDescription className="ui meta" value={props.description} vars={props.vars}/>
          </div>
        )
      case 'hidden':
        return (
          <input type="hidden" disabled={true} name={props.name} value={props.value}/>
        )
      case 'select':
        return (
          <div className="field">
            <label>{props.label}</label>
            <RichDescription className="ui meta" value={props.description} vars={props.vars}/>
            <select ref="select" name={props.name} defaultValue={props.value} className={`ui fluid ${props.search ? "search" : ""} dropdown`} onChange={this.handleChange}>
              {props.options.map((o) => (
                <option value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        )
      case 'service':
        return (
          <SelectService {...props} onChange={this.handleChange}/>
        )
      default:
        return (
          <div className="ui message error" style={{display: "block"}}>Unknown field type "{props.type}"</div>
        )
    }
  }
})

let GenericForm=React.createClass({
  getInitialState(props){
    props = props || this.props
    let state={};
    (props.fields || []).map((f) => state[f.name]=f.value || '')
    if (props.data){
      Object.keys(props.data).map( (k) => { state[k]=props.data[k] })
    }
    return state
  },
  setValue : function(k, v){
    let update = {[k]: v }
    this.setState( update )
    let nstate=Object.assign({}, this.state, update ) // looks like react delays state change, I need it now
    //console.log(nstate, this.props)
    this.props.updateForm && this.props.updateForm(nstate)
  },
  componentWillReceiveProps(newprops){
    if (newprops.fields != this.props.fields || newprops.data != this.props.data){
      this.setState( this.getInitialState(newprops) )
    }
  },
  componentDidMount(){
    let fields = {};
    (this.props.fields || []).map((f) => {
      if (f.validation)
        fields[f.name]=f.validation
    })
    $(this.refs.form).form({ on: 'blur', fields }).on('submit', function(ev){
      ev.preventDefault()
    })
    this.props.updateForm && this.props.updateForm(this.state)
  },
  render(){
    const props=this.props
    return (
      <form
        ref="form"
        className={`ui form ${props.className || ""}`}
        onSubmit={(ev) => { ev.preventDefault(); props.onSubmit && props.onSubmit(ev) }}>
        {(props.fields || []).map((f) => (
            <GenericField key={f.name} setValue={this.setValue} value={this.state[f.name]} {...f}/>
        ))}
        {props.children}
      </form>
    )
  }
})

export default GenericForm
