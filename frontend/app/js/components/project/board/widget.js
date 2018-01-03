import React from 'react'
import plugin from 'app/utils/plugin'
import {object_is_equal} from 'app/utils'
import {merge} from 'app/utils'
import Restricted from 'app/restricted'
import i18n from 'app/utils/i18n'
import {MarkdownPreview} from 'react-marked-markdown'

const Widget = React.createClass({
  umount: undefined,
  getInitialState(){
    return {
      title: undefined,
      error: false,
      component: undefined,
      context: {}
    }
  },
  setTitle(title){
    this.setState({title})
  },
  do_widget(props){
    let self=this
    let plugin_component=props.template.id.split('/')
    const context={
      setTitle: self.setTitle,
      setError(err){ self.setState({error: err}) },
      setClass(klass){ self.setState({klass}) },
      plugin_id: plugin_component[0],
      component_id: plugin_component[1],
      widget_id: props.template.id,
      layout: props.layout
    }
    $(this.refs.el)
      .attr('data-pluginid', props.widget.split('/')[0])
      .attr('data-widgetid', props.widget)
      .attr('data-height', props.layout.height)
      .attr('data-width', props.layout.width)
    return plugin.do_widget(
      props.widget,
      this.refs.el,
      props.config,
      context
    ).then( ({umount, component}) => {
      if (umount)
        this.umount=umount
      if (react)
        this.setState({component, context})
    } )
  },
  componentDidMount(){
    Promise.all([plugin.load(`${this.props.widget}.js`),plugin.load(`${this.props.widget}.css`)]).then( () => {
      if (!this.cancel_widget)
        this.do_widget(this.props)
    }).catch( (e) => {
      console.error(e)
      this.setState({error: e.name || e.message || i18n("Could not load JS code")})
      $(this.refs.el).html("")
    } )
  },
  componentWillUnmount(){
    try{
      this.cancel_widget = true // the widget may be unmounted beore we got the promise of the js
      this.umount && this.umount()
    } catch(e) {
      console.error("Could not umount widget %o %o", this.props.template.id,  e)
    }
  },
  componentWillReceiveProps(nextprops){
    if (!object_is_equal(nextprops.config, this.props.config) ||
        (nextprops.layout && this.props.layout && !object_is_equal(nextprops.layout, this.props.layout))
      ){
        this.umount && this.umount()
        $(this.refs.el).html('')
        this.do_widget(nextprops)
    }
  },
  render(){
    const config = this.props.config || {}
    const widget = this.props.template || {}
    const state = this.state
    const Component = this.state.component

    return (
      <div>
        <div className="ui top mini menu">
          <span className="ui header oneline">
            {state.title || config.name || widget.name}
          </span>
          <Restricted perm="dashboard.widget.update">
            <a className="item right" onClick={this.props.onEdit}>
              <i className="icon configure"/>
            </a>
          </Restricted>
        </div>
        <div className={state.klass || "white card"}>
          {this.state.error ? (
            <section ref="error" className="plugin error">
              <div><i className="ui huge warning sign red icon"/></div>
              <div className="ui text red bold">{i18n("Error loading widget")}</div>
              <div className="ui meta">{widget.name}</div>
              <div className="ui meta">{this.props.widget}</div>
              <div style={{paddingTop:10}}><MarkdownPreview value={this.state.error}/></div>
            </section>
          ) : (Component!=undefined) ? (
            <Component {...state} {...this.state.context}/>
          ) : (
            <div ref="el"/>
          )}
        </div>
      </div>
    )
  }
})


export default Widget
