import React from 'react'
import GenericForm from '../genericform'
import Loading from '../loading'
import Flash from '../../flash'
import rpc from '../../rpc'

function Section(props){
  console.log(props.fields)
  return (
    <section key={props.id}>
      <h2 className="ui header">{props.name}</h2>
      <div className="ui description">{props.description}</div>
      <GenericForm fields={props.fields} onSubmit={(ev) => ev.preventDefault() }/>
    </section>
  )
}

let System=React.createClass({
  handleSubmit(){
    console.log(this.refs)
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
      <div className="ui text container settings">
        <h1 className="ui header">System</h1>

        {props.settings.map( (section) => (
            <div ref={section.id}>
              <Section key={section.id} {...section} />
            </div>
          )) }
        <button
            type="button"
            className="ui button approve floating right yellow"
            onClick={this.handleSubmit}
            >
          Save all changes
        </button>
      </div>
    )
  }
})

export default System
