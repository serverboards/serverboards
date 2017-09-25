import React from 'react'
import AddService from 'app/containers/service/add'

export function make_services(props){
  return (
      <AddService
        onServiceAdded={props.nextStep}
        />
  )
}
