import React from 'react'
import GenericForm from '../genericform'
import Loading from '../loading'
import Flash from 'app/flash'
import rpc from 'app/rpc'
import {MarkdownPreview} from 'react-marked-markdown';
import Restricted from 'app/restricted'
import store from 'app/utils/store'
import {settings_all} from 'app/actions/settings'
import i18n from 'app/utils/i18n'
import {SectionMenu} from 'app/components'


function Section(props){
  return (
    <section key={props.id}>
      <h2 className="ui header">{i18n(props.name)}</h2>
      {props.description && (
        <div className="ui description"><MarkdownPreview value={i18n(props.description)}/></div>
      )}
      <GenericForm fields={props.fields} onSubmit={(ev) => ev.preventDefault() } updateForm={props.updateSection}/>
    </section>
  )
}

class System extends React.Component{
  constructor(props){
    super(props)
    this.state = {}
  }
  handleSubmit(){
    //console.log(this.refs)
    var all_updates=[]
    for(let section of this.props.settings){
      section=section.id
      let data=this.state[section]
      if (!data)
        continue
      all_updates.push(
        rpc.call("settings.update", [section, data])
      )
    }
    Promise.all(all_updates).then(function(){
      Flash.success(i18n("Updated settings!"))
    }).then( () => store.dispatch(settings_all()) )
  }
  handleUpdateSection(section, data){
    this.setState({[section]:data})
  }
  render(){
    let props=this.props
    if (!props.settings)
      return (
        <Loading>{i18n("Loading settings")}</Loading>
      )

    return (
      <React.Fragment>
        <div className="ui text container settings" style={{paddingBottom: 60}}>
          {props.settings.map( (section) => (
              <div key={section.id} ref={section.id}>
                <Section {...section} updateSection={(data) => this.handleUpdateSection(section.id, data)}/>
              </div>
            )) }
          <Restricted perm="settings.update">
            <button
                type="button"
                className="ui button approve teal"
                onClick={this.handleSubmit.bind(this)}
                >
              {i18n("Save all changes")}
            </button>
          </Restricted>
        </div>
      </React.Fragment>
    )
  }
}

export default System
