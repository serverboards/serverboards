import React from 'react'
import i18n from 'app/utils/i18n'
import GenericForm from 'app/components/genericform'
import {MarkdownPreview} from 'react-marked-markdown'
import cache from 'app/utils/cache'
import Tip from 'app/components/tip'

class AddTemplate extends React.Component{
  constructor(props){
    super(props)

    this.state = {
      data: {}
    }
  }
  handleAddRule(){
    const {template, project} = this.props
    const data = this.state.data

    console.log("Create template rule %o %o", template.id, data)

    let name_promise
    if (data.service){
      name_promise = cache.service(data.service).then( s => `${template.name} -- ${s.name}` )
    }
    else{
      name_promise = Promise.resolve(template.name)
    }

    name_promise.then( name => {
      const rule = {
        name,
        description: template.description, 
        is_active: true, 
        project: project.shortname,
        from_template: template.id,
        rule: {
          template_data: this.state.data
        }
      }
      console.log("Create rule %o", rule)
      
      this.props.addTemplate(rule)
    })
  }
  render(){
    const props = this.props
  	const {template} = props

  	return (
        <div className="ui expand two column grid grey background" style={{margin:0}}>
          <div className="ui column">
            <Tip
              className="ui round pane white background with padding"
              top_img={require("imgs/024-illustration-addaddons.svg")}
              middle_img={require("imgs/019-illustration-tips.svg")}
              title={i18n("Add a simple rule to your project.")}
              subtitle={i18n("Fill the form on the right and you will be adding this rule to this project. Simple.")}
              description={i18n(`
Using the rule templates it is very easy to add rules to your project for the most common tasks.

Watching uptimes and creating issues has never been easier. Check out the marketplace for many more
simple rules. If you have any idea, don't hesitate to [contact us](mailto:connect@serverboards.io)!
`)}
              />
        	</div>
          <div className="ui column">
            <div className="ui round pane white background">
            	<div className="ui padding">
            		<h2 className="ui header">{template.name}</h2>
            		<div className="description">
            			<MarkdownPreview value={template.description}/>
            		</div>
            	</div>
            	<div className="ui expanding with padding and scroll">
            		<GenericForm 
                  fields={template.extra.fields}
                  updateForm={(data) => this.setState({data})}
                  />
  	            <div className="right aligned">
  	          		<div className="ui buttons">
  	          			<a className="ui button basic" onClick={props.prevStep}>
  	          				{i18n("Cancel")}
  	          			</a>
  	          			<a className="ui teal button" onClick={() => this.handleAddRule()}>
  	          				{i18n("Create rule")}
  	          			</a>
  	          		</div>
  	          	</div>
            	</div>
            </div>
        	</div>
        </div>
  	)
  }
}

export default AddTemplate
