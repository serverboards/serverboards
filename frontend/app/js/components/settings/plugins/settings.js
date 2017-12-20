import React from 'react'
import {MarkdownPreview} from 'react-marked-markdown'
import Modal from 'app/components/modal'
import Flash from 'app/flash'
import Loading from 'app/components/loading'
import GenericForm from 'app/components/genericform'
import i18n from 'app/utils/i18n'
import {map_set} from 'app/utils'
import rpc from 'app/rpc'

class Settings extends React.Component{
  constructor(props){
    super(props)
    this.state={
      loading: true,
      data: undefined
    }
    this.handleSave = () => {
      const data = this.state.data
      Promise.all(Object.keys(data).map( k =>
        rpc.call("settings.update", [k, data[k]])
      )).then(
        Flash.success(i18n("Settings updated"))
      )
    }
  }
  componentDidMount(){
    Promise.all(this.props.settings.map(s => s.id)
      .map( id =>
        rpc.call("settings.get",[id])
            .then( data => ({id, data }))
    )).then( fulldata => {
      let data = {}
      fulldata.map( d => {
        data[d.id]=d.data
      })
      this.setState({data, loading: false})
    }).catch( e => {
      if (e=="not_found")
        this.setState({data:{}, loading: false})
      else{
        console.error(e)
        Flash.error(i18n("Error loading settings"))
      }
    })
  }
  render(){
    if (this.state.loading){
      return (
        <Modal>
          <Loading>{i18n("Plugin settings")}</Loading>
        </Modal>
      )
    }
    const props = this.props
    const data = this.state.data
    return (
      <Modal>
        <div className="ui top secondary menu">
          <div style={{display:"inline-block"}}>
            <h3 className="ui header">{i18n("{plugin} settings",{plugin: props.plugin.name})}</h3>
          </div>
        </div>
        <div className="ui text container">
          {this.props.settings.map( settings => (
            <div className="" key={settings.id}>
              <h4 className="ui header">{settings.name}</h4>
              <MarkdownPreview value={settings.description || ""}/>
              <GenericForm
                fields={settings.extra.fields}
                data={data[settings.id]}
                updateForm={(data) => this.setState({data: map_set(this.state.data, [settings.id], data)})}
                />
            </div>
          ))}
          <div className="ui buttons" style={{margin: "20px 0"}}>
            <button className="ui button teal" onClick={this.handleSave}>{i18n("Save settings")}</button>
          </div>
        </div>
      </Modal>
    )
  }
}

export default Settings
