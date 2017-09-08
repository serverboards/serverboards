import React from 'react'
import Details from 'app/containers/service/details'
import Modal from 'app/components/modal'
import {goto} from 'app/utils/store'

function ModalDetails(props){
  let handleClose = undefined
  if (props.project)
    handleClose = () => goto(`/project/${props.project.shortname}/services`)
  return (
    <Modal className="wide" onClose={handleClose}>
      <Details {...props}/>
    </Modal>
  )
}

export default ModalDetails
