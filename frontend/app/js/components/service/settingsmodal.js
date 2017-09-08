import React from 'react'
import Settings from './settings'
import Modal from '../modal'
import {MarkdownPreview} from 'react-marked-markdown';
import { service_definition } from '../service/utils'
import {i18n} from 'app/utils/i18n'

function SettingsModal(props){
  let servicedef=service_definition(props.service.type, props.service_catalog)
  return (
    <Modal>
      <div>
        <div className="ui top secondary menu">
          <h3 className="ui header">
            {i18n("Settings for {name}", {name: props.service.name})}
          </h3>
        </div>
        <div className="ui meta" style={{paddingBottom: 20}}>
          <MarkdownPreview value={i18n(servicedef.description) || i18n("No description at service definition")}/>
        </div>
        <Settings {...props}/>
      </div>
    </Modal>
  )
}

export default SettingsModal
