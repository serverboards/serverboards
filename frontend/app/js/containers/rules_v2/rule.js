import React from 'react'
import View from 'app/components/rules_v2/rule'
import Loading from 'app/components/loading'
import i18n from 'app/utils/i18n'

const Model = React.createClass({
  render(){
    const props = this.props
    console.log(props)
    if (!props.rule)
      return (
        <div>{i18n("Unknown Rule. Try another.")}</div>
      )
    return (
      <View {...props}/>
    )
  }
})

export default Model
