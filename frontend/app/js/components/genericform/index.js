import React from 'react'

import GenericField from './genericfield'
import {object_is_equal} from 'app/utils'
import PropTypes from 'prop-types'

class GenericForm extends React.Component{
  constructor(props){
    super(props)
    this.state = this.getInitialState(props)
  }
  getInitialState(props){
    props = props || this.props
    let state={};
    (props.fields || []).map((f) => { if (f.name){ state[f.name]=(f.value || f.default || '') } } )
    if (props.data){
      Object.keys(props.data).map( (k) => { if (k){ state[k]=props.data[k] }})
    }
    return state
  }
  setValue(k, v){
    let update = {[k]: v }
    this.setState( update )
    let nstate=Object.assign({}, this.state, update ) // looks like react delays state change, I need it now
    //console.log(nstate, this.props)
    this.props.updateForm && this.props.updateForm(nstate)
  }
  componentWillReceiveProps(newprops){
    if (!object_is_equal(newprops.fields, this.props.fields) || !object_is_equal(newprops.data, this.props.data)){
      this.setState( this.getInitialState(newprops) )
    }
  }
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
  }
  render(){
    const props=this.props
    return (
      <form
        ref="form"
        className={`ui form ${props.className || ""}`}
        onSubmit={(ev) => { ev.preventDefault(); props.onSubmit && props.onSubmit(ev) }}>
        {(props.fields || []).map((f, i) => (
            <GenericField
              key={f.name || i}
              setValue={this.setValue.bind(this)}
              value={this.state[f.name]}
              fields={props.fields}
              form_data={this.state}
              {...f}
              />
        ))}
        {props.children}
      </form>
    )
  }
}

GenericForm.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      name: PropTypes.string,
      description: PropTypes.string,
      type: PropTypes.string,
      value: PropTypes.string,
      params: PropTypes.string,
    }).isRequired).isRequired,
  data: PropTypes.object,
  updateForm: PropTypes.func.isRequired
}

export default GenericForm
