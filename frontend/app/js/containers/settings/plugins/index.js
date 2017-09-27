import React from 'react'
import PropTypes from 'prop-types'
import PluginList from 'app/components/settings/plugins'
import PluginAdd from 'app/containers/settings/plugins/add'
import Error from 'app/components'

function PluginRouter(props){
  if (!props.params.subsection)
    return (
      <PluginList {...props}/>
    )
  if (props.params.subsection=="add")
    return (
      <PluginAdd {...props}/>
    )
  return (
    <Error>
      {i18n("Unknown section")}
    </Error>
  )
}

export default PluginRouter
