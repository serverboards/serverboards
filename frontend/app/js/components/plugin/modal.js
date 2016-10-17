import React from 'react'
import Screen from './screen'
import Modal from 'app/components/modal'

function ModalPluginScreen(props){
  return (
    <Modal className="wide">
      <Screen {...props}/>
    </Modal>
  )
}

export default ModalPluginScreen
