import React from 'react'
import GenericForm from '../genericform'
import Loading from '../loading'
import Flash from 'app/flash'
import rpc from 'app/rpc'
import {MarkdownPreview} from 'react-marked-markdown';
import Restricted from 'app/restricted'

function Section(props){
  return (
    <section key={props.id}>
      <h2 className="ui header">{props.name}</h2>
      <div className="ui description"><MarkdownPreview value={props.description}/></div>
      <GenericForm fields={props.fields} onSubmit={(ev) => ev.preventDefault() }/>
    </section>
  )
}

let System=React.createClass({
  handleSubmit(){
    //console.log(this.refs)
    var all_updates=[]
    for(let section of this.props.settings){
      section=section.id
      console.log(section)
      let data={}
      let $form=$(this.refs[section]).find('form')
      $form.serializeArray().map( ({name, value}) => {
        data[name]=value
      })
      all_updates.push(
        rpc.call("settings.update", [section, data])
      )
    }
    Promise.all(all_updates).then(function(){
      Flash.success("Updated settings!")
    })
  },
  render(){
    let props=this.props
    if (!props.settings)
      return (
        <Loading>Loading settings</Loading>
      )

    return (
      <div>
        <div className="ui secondary header top menu">
          <h3 className="ui header">System Settings</h3>
        </div>
        <div className="ui text container settings">


          {props.settings.map( (section) => (
              <div key={section.id} ref={section.id}>
                <Section {...section} />
              </div>
            )) }
          <Restricted perm="settings.update">
            <button
                type="button"
                className="ui button approve floating right yellow"
                onClick={this.handleSubmit}
                >
              Save all changes
            </button>
          </Restricted>
        </div>
      </div>
    )
  }
})

export default System
