import React from 'react'
import AddWidget from 'app/containers/project/board/add_widget'

export function make_widgets(props){
  return (
      <AddWidget
        onClose={props.nextStep}
        />
  )
}
