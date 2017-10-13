import React from 'react'
import Link from 'app/router'
import i18n from 'app/utils/i18n'

var Settings=React.createClass({
  getInitialState(){
    return { shortname: "" }
  },
  updateShortname(){
    if (this.props.shortname)
      return;
    const name = $(this.refs.name).val()
    let shortname = name
    if (shortname.length>5)
      shortname = shortname.replace(/[aeiou]/gi,"")
    if (shortname.length>5)
      shortname=shortname.slice(0,2) + shortname.slice( shortname.length - 3)
    shortname=shortname.toUpperCase()
    this.setState({shortname})
  },
  handleSubmit(ev){
    ev.preventDefault()

    let $form=$(this.refs.form)

    if ($form.form('validate form')){
      let fields=$form.form('get values')

      let project = {
        name: fields.name,
        shortname: fields.shortname,
        tags: fields.tags.split(' '),
        description: fields.description,
      }
      this.props.onSubmit( project )
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

    let state=this.state
    let project=this.props.project || { tags: [], name: '', description: ''}

    return (
      <div className="ui background white central">
        <div className="ui text container" style={{marginTop:20}}>
          <form className="ui form" ref="form">
            <div className="field">
              <label>{i18n("Project Name")}</label>
              <input type="text" name="name" ref="name"
                defaultValue={project.name}
                onKeyUp={this.updateShortname}
                placeholder={i18n("Ex. My company name, web projects, external projects...")}/>
            </div>
            <div className="field">
              <label>{i18n("Description")}</label>
              <textarea placeholder={i18n("Long description")}  name="description"
                defaultValue={project.description}
                />
            </div>

            <div className="field">
              <button type="submit" className="ui button teal">{props.edit ? i18n("Update project") : i18n("Create project") }</button>
            </div>
          </form>
          {props.children}
        </div>

      </div>
    )
  }
})

export default Settings
