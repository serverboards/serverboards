import React from 'react'
import i18n from 'app/utils/i18n'
import GenericForm from 'app/components/genericform'
import {MarkdownPreview} from 'react-marked-markdown'

function AddTemplate(props){
	console.log(props)
	const {template} = props

	return (
      <div className="ui expand two column grid grey background" style={{margin:0}}>
        <div className="ui column">
          <div className="ui round pane white background with padding">
            <img src={require("imgs/024-illustration-addaddons.svg")} style={{height: 150}}/>
            <h2 className="ui header centered">{i18n("Add a simple rule to your project.")}</h2>
            <img src={require("imgs/019-illustration-tips.svg")} style={{height: 80}}/>
            <div className="ui text container">
              <h3 className="ui header centered">
                {i18n("Fill the form on the right and you will be adding this rule to this project. Simple.")}
              </h3>
              <div className="ui content">
              <MarkdownPreview value={i18n(`
Using the rule templates it is very easy to add rules to your project for the most common tasks.

Watching uptimes and creating issues has never been easier. Check out the marketplace for many more
simple rules. If you have any idea, don't hesitate to [contact us](mailto:connect@serverboards.io)!
`)}/>
              </div>
            </div>
          </div>
      	</div>
        <div className="ui column">
          <div className="ui round pane white background">
          	<div className="ui padding">
          		<h2 className="ui header">{template.name}</h2>
          		<div class="description">
          			<MarkdownPreview value={template.description}/>
          		</div>
          	</div>
          	<div className="ui expanding with padding and scroll">
          		<GenericForm fields={template.extra.fields}/>
	            <div className="right aligned">
	          		<div className="ui buttons">
	          			<a className="ui button basic" onClick={props.prevStep}>
	          				{i18n("Cancel")}
	          			</a>
	          			<a className="ui teal button" onClick={null}>
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

export default AddTemplate
