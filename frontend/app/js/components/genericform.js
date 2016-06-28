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
            defaultValue={props.value}
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
            defaultValue={props.value}
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
            defaultValue={props.value}
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
  getInitialState(props){
    props = props || this.props
    let state={};
    (props.fields || []).map((f) => state[f.name]=f.value || '')
    if (props.data){
      Object.keys(props.data).map( (k) => { state[k]=props.data[k] })
    }
    return state
  },
  setValue : function(ev, field){
    let update = {[field]: ev.target.value }
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
        className={`ui form ${props.className}`}
        onSubmit={(ev) => { ev.preventDefault(); props.onSubmit && props.onSubmit(ev) }}>
        {(props.fields || []).map((f) => (
            <GenericField key={f.name} setValue={(ev) => this.setValue(ev, f.name)} value={this.state[f.name]} {...f}/>
        ))}
        {props.children}
      </form>
    )
  }
})

export default GenericForm
