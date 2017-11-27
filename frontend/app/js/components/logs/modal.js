import React from 'react'
import Modal from '../modal'
import Logs from '../logs'

function ModalLogs(props){
  return (
    <Modal>
      <Logs {...props}/>
    </Modal>
  )
}

export default ModalLogs
