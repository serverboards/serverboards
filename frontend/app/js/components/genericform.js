import React from 'react'

let GenericField=React.createClass({
  getInitialState(){
    return {
      value: this.props.value || ''
    }
  },
  handleChange: function(ev){
    this.setState({value: ev.target.value})
    this.props.setValue(ev)
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
          <input type="text"
            name={props.name}
            placeholder={props.placeholder || props.description}
            value={this.state.value}
            onChange={this.handleChange}/>
          </div>
        )
      case 'textarea':
        return (
          <div className="field">
          <label>{props.label}</label>
          <textarea
            name={props.name}
            placeholder={props.placeholder || props.description}
            value={this.state.value}
            onChange={this.handleChange}/>
          </div>
        )
      case 'password':
        return (
          <div className="field">
          <label>{props.label}</label>
          <input type="password"
            name={props.name}
            placeholder={props.placeholder || props.description}
            value={this.state.value}
            onChange={this.handleChange}/>
          </div>
        )
      default:
        return (
          <div className="ui message error" style={{display: "block"}}>Unknown field type "{props.type}"</div>
        )
    }
  }
})

let GenericForm=React.createClass({
  getInitialState(){
    let state={}
    this.props.fields.map((f) => state[f.name]=f.value || '')
    return state
  },
  setValue : function(ev, field){
    let update = {[field]: ev.target.value }
    this.setState( update )
    let nstate=Object.assign({}, this.state, update ) // looks like react delays state change, I need it now
    //console.log(nstate, this.props)
    this.props.updateForm && this.props.updateForm(nstate)
  },
  componentDidMount(){
    let fields = {}
    this.props.fields.map((f) => {
      if (f.validation)
        fields[f.name]=f.validation
    })
    $(this.refs.form).form({ on: 'blur', fields })
  },
  render(){
    let self=this
    function generic_field(f){
      return (
        <GenericField key={f.name} setValue={(ev) => self.setValue(ev, f.name)} {...f}/>
      )
    }
    return (
      <form ref="form" className="ui form" onSubmit={(ev) => { ev.preventDefault(); self.props.onSubmit(ev) }}>
        {this.props.fields.map((f) => generic_field(f)) }
        {this.props.children}
      </form>
    )
  }
})

export default GenericForm
