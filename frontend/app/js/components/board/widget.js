import React from 'react'
import plugin from 'app/utils/plugin'
import {object_is_equal, to_keywordmap, colorize} from 'app/utils'
import {merge, map_get} from 'app/utils'
import Restricted from 'app/restricted'
import i18n from 'app/utils/i18n'
import {MarkdownPreview} from 'react-marked-markdown'
import {ErrorBoundary} from 'app/components/error'

class Widget extends React.Component{
  constructor(props){
    super(props)
    this.umount = undefined
    this.state = {
      title: undefined,
      default_title: true,
      error: false,
      component: undefined,
      context: {}
    }
  }
  setTitle(title){
    this.setState({title, default_title: false})
  }
  do_widget(props){
    let self=this
    const template = props.template || {}
    let plugin_component=(template.id || "/").split('/')
    const context={
      setTitle: this.setTitle.bind(this),
      setClass(klass){ self.setState({klass}) },
      setError(err){
        console.error(err)
        self.setState({error: err})
      },
      plugin_id: plugin_component[0],
      component_id: plugin_component[1],
      widget_id: template.id,
      project: props.project,
    }
    const layout = props.layout || {}
    $(this.refs.el)
      .attr('data-pluginid', props.widget.split('/')[0])
      .attr('data-widgetid', props.widget)
      .attr('data-height', layout.height)
      .attr('data-width', layout.width)
    return plugin.do_widget(
      props.widget,
      this.refs.el,
      props.config,
      {...context, layout}
    ).then( ({umount, component}) => {
      if (umount)
        this.umount=umount
      if (react)
        this.setState({component, context})
    } )
  }
  componentDidMount(){
    let toload = [plugin.load(`${this.props.widget}.js`)]
    if (!to_keywordmap((this.props.template || {}).hints)["nocss"])
      toload.push(plugin.load(`${this.props.widget}.css`))
    Promise.all(toload).then( () => {
      if (!this.cancel_widget)
        this.do_widget(this.props)
    }).catch( (e) => {
      console.error(e)
      this.setState({error: e.name || e.message || i18n("Could not load JS code")})
      $(this.refs.el).html("")
    } )
  }
  componentWillUnmount(){
    try{
      this.cancel_widget = true // the widget may be unmounted beore we got the promise of the js
      this.umount && this.umount()
    } catch(e) {
      console.error("Could not umount widget %o %o", (this.props.template || {}).id,  e)
    }
  }
  componentWillReceiveProps(nextprops){
    if ((this.state.component == undefined) &&
        ( !object_is_equal(nextprops.config, this.props.config) ||
          (nextprops.layout && this.props.layout && !object_is_equal(nextprops.layout, this.props.layout))
        )){
        this.umount && this.umount()
        $(this.refs.el).html('')
        this.do_widget(nextprops)
    }
    // No need for manual set title
    if (nextprops.config.title != this.state.title && this.state.default_title)
      this.setState({title: nextprops.config.title})
  }
  render(){
    const state = this.state || {}
    const props = this.props
    const config = props.config || {}
    const widget = props.template || {}
    const Component = state.component

    const parts = (state.title || config.name || widget.name || "").split('|')
    const title = parts[0].trim()
    const titleColor = parts[2] || "grey"
    const titleColorClass = (
      (titleColor.startsWith("#") || titleColor.startsWith("rgb(") || titleColor.startsWith("rgba(")) ?
      "" : colorize(titleColor))
    const titleClass = `${parts[1] || ""} ${titleColorClass} ${title != "" ? "" : "no background"}`
    const titleStyle = (titleColorClass ? {} : {background: titleColor})

    const finalprops = {...props, ...state, ...state.context}

    return (
      <div>
        <div className={`ui top mini menu ${titleClass}`} style={titleStyle}>
          <span className="ui header oneline">
            {title}
          </span>
          <Restricted perm="dashboard.widget.update">
            <a className="item right" onClick={props.onEdit}>
              <i className="icon configure"/>
            </a>
          </Restricted>
        </div>
        <div className={state.klass || "card"}>
          <ErrorBoundary error={i18n("Error rendering widget. {type}. Contact author.", {type: widget.name})}>
            {state.error ? (
              <section ref="error" className="plugin error">
                <div><i className="ui huge warning sign red icon"/></div>
                <div className="ui text red bold">{i18n("Error loading widget")}</div>
                <div className="ui meta">{widget.name}</div>
                <div className="ui meta">{props.widget}</div>
                <div style={{paddingTop:10}}><MarkdownPreview value={state.error}/></div>
              </section>
            ) : (Component!=undefined) ? (
                <Component {...finalprops}/>
            ) : (
              <div ref="el"/>
            )}
          </ErrorBoundary>
        </div>
      </div>
    )
  }
}


export default Widget
