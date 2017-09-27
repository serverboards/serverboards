import React from 'react'
import Modal from '../modal'
import AddService from 'app/containers/service/add'
import store from 'app/utils/store'

function AddServiceModal(props){
  return (
    <Modal className="wide">
      <AddService
        {...props}
        onServiceAdded={props.onServiceAdded || store.back}
        />
    </Modal>
  )
}

export default AddServiceModal
