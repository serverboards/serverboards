import React from 'react'
import HoldButton from '../holdbutton'
import Link from 'app/router'

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
    $(this.refs.form).find('input[name=shortname]').attr('maxlength',5)
  },
  render(){
    let props=this.props

    let extra_buttons=[]
    if (props.edit)
      extra_buttons=(
        <HoldButton className="ui item" onHoldClick={props.onDelete}>Delete serverboard <i className="ui icon trash"/></HoldButton>
      )

    let state=this.state
    let serverboard=this.props.serverboard || { tags: [], name: '', description: ''}

    return (
      <div className="ui background white central">
        <div className="ui top secondary menu">
          <div className="right menu">
            {extra_buttons}
          </div>
        </div>
        <div className="ui text container" style={{marginTop:20}}>
          <form className="ui form" ref="form">
            <div className="field">
              <label>Shortname</label>
              <div className="ui meta">This name is used as a Serverboard identifier and has a maximum lenght of 5 characters.</div>
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

            <div className="field">
              <button type="submit" className="ui button positive">{props.edit ? "Update serverboard" : "Create serverboard" }</button>
            </div>
          </form>
          {props.children}
        </div>

      </div>
    )
  }
})

export default Settings
