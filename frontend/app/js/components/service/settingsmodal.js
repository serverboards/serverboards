import React from 'react'
import Settings from './settings'
import Modal from '../modal'
import {MarkdownPreview} from 'react-marked-markdown';
import { service_definition } from '../service/utils'

function SettingsModal(props){
  let servicedef=service_definition(props.service.type, props.service_catalog)
  return (
    <Modal>
      <div>
        <div className="ui top secondary menu">
          <h3 className="ui header">
            Settings for {props.service.name}
          </h3>
        </div>
        <div className="ui meta" style={{paddingBottom: 20}}>
          <MarkdownPreview value={servicedef.description || "No description at service definition"}/>
        </div>
        <Settings {...props}/>
      </div>
    </Modal>
  )
}

export default SettingsModal
