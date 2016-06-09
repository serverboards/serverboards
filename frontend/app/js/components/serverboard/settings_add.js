import React from 'react'
import HoldButton from '../holdbutton'
import Link from '../../router'

var Settings=React.createClass({
  handleSubmit(ev){
    ev.preventDefault()

    let $form=$(this.refs.form)

    if ($form.form('validate form')){
      let fields=$form.form('get values')

      let serverboard = {
        name: fields.name,
        shortname: fields.shortname,
        tags: fields.tags.split(' '),
        description: fields.description,
      }
      this.props.onSubmit( serverboard )
    }
  },
  componentDidMount(){
    $(this.refs.form).form({
      on: 'blur',
      fields: {
        shortname: 'minLength[4]',
        name: 'minLength[4]'
      }
    }).on('submit', this.handleSubmit)
  },
  render(){
    let props=this.props

    let accept_buttons=[]
    if (!props.edit){
      accept_buttons=(
        <div className="field">
          <button type="submit" className="ui button positive">Create serverboard</button>
        </div>
      )
    }
    else {
      accept_buttons=(
        <div className="two fields">
          <div className="field">
            <button type="submit" className="ui button positive">Update serverboard</button>
          </div>
          <div className="ui field right aligned">
            <HoldButton type="button" className="ui button negative" onHoldClick={props.onDelete}>Delete serverboard</HoldButton>
          </div>
        </div>
      )
    }

    let state=this.state
    let serverboard=this.props.serverboard || { tags: [], name: '', description: ''}

    return (
      <div className="ui background white central">
        <div className="ui text container">
          <form className="ui form" ref="form">
            <h1 className="ui header">{this.props.title}</h1>
            <div className="field">
              <label>Shortname</label>
              <input type="text" name="shortname"
                defaultValue={serverboard.shortname}
                placeholder="Ex. CMPNY"/>
            </div>
            <div className="field">
              <label>Serverboard Name</label>
              <input type="text" name="name"
                defaultValue={serverboard.name}
                placeholder="Ex. My company name, web serverboards, external serverboards..."/>
            </div>
            <div className="field">
              <label>Tags</label>
              <input type="text" name="tags"
                defaultValue={serverboard.tags.join(' ')}
                placeholder="Ex. web, mail, external..."/>
            </div>
            <div className="field">
              <label>Description</label>
              <textarea placeholder="Long description"  name="description"
                defaultValue={serverboard.description}
                />
            </div>

            {accept_buttons}
          </form>

          <div className="ui fixed bottom">
            <a href={`#/serverboard/${props.serverboard.shortname}/services`}
            className="ui header medium link">
            Configure services for this serverboard <i className="ui icon angle right"/>
            </a>
          </div>
        </div>

      </div>
    )
  }
})

export default Settings
