import React from 'react'
import Settings from './settings'
import Modal from '../modal'
import {MarkdownPreview} from 'react-marked-markdown';
import { service_definition } from '../service/utils'

function SettingsModal(props){
  let servicedef=service_definition(props.service.type, props.service_catalog)
  return (
    <Modal>
      <div style={{paddingTop: 40}}>
        <h2 className="ui header">
          Update settings for {props.service.name}
        </h2>
        <div className="ui meta" style={{paddingBottom: 20}}>
          <MarkdownPreview value={servicedef.description || "No description at service definition"}/>
        </div>
        <Settings {...props}/>
      </div>
    </Modal>
  )
}

export default SettingsModal
