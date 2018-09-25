import React from 'react'
import PropTypes from 'prop-types'
import PluginList from 'app/components/settings/plugins'
import PluginAdd from 'app/containers/settings/plugins/add'
import Error from 'app/components'

class PluginRouter extends React.Component {
  constructor(props){
    super(props)

    this.state = {
      tab: 0
    }
  }
  render(){
    const tab = this.state.tab

    if (tab == 0)
      return (
        <PluginList {...this.props} gotoMarketplace={() => this.setState({tab: 1})}/>
      )
    else
      return (
        <PluginAdd {...this.props} gotoList={() => this.setState({tab: 0})}/>
      )
  }
}

export default PluginRouter
