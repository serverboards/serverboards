import React from 'react'
import Modal from '../modal'
import AddService from 'app/containers/service/add'

function AddServiceModal(props){
  return (
    <Modal className="wide">
      <AddService {...props}/>
    </Modal>
  )
}

export default AddServiceModal
