import {connect} from 'react-redux'
import View from 'app/components/board/edit_widget'
import rpc from 'app/rpc'
import {set_modal} from 'app/utils/store'
import Modal from 'app/components/modal'
import React from 'react'
import HoldButton from 'app/components/holdbutton'
import Loading from 'app/components/loading'
import i18n from 'app/utils/i18n'
import moment from 'moment'
import Flash from 'app/flash'

function EditWidgetModal(props){
  if (!props.template){
    return (
      <Loading>{i18n("Widget description")}</Loading>
    )
  }

  // console.log(props)
  return (
    <Modal className="wide">
      <div className="ui top serverboards secondary menu">
        <h3 className="ui header">{props.template.name}</h3>
        <div className="right menu">
          <HoldButton className="item" onHoldClick={props.removeWidget}>{i18n("Remove")} <i className="ui icon trash"/></HoldButton>
        </div>
      </div>
      <View {...props}/>
    </Modal>
  )
}

const Controller = connect(
  (state, props) => ({
    template: state.project.widget_catalog && (
      state.project.widget_catalog.find( (w) => (w.id == props.widget.widget) ) || "not-found"
    ),
    widget_id: props.widget.widget,
    project: state.project.current,
    vars: {
      start: state.project.daterange.start.toISOString(),
      end: state.project.daterange.end.toISOString(),
      prev: moment(state.project.daterange.start).subtract(
              state.project.daterange.end.diff(state.project.daterange.start, "seconds")
              , "seconds"
            ).toISOString()
    }
  }),
  (dispatch, props) => ({
    saveWidget(data){
      rpc.call("dashboard.widget.update", data).then( () => {
        set_modal(null)
      })
    },
    removeWidget(){
      rpc.call("dashboard.widget.delete", [props.widget.uuid]).then(() => {
        set_modal(null)
        Flash.success("Widet removed")
      }).catch( e => {
        console.error(e)
        Flash.error("Could not remove widget.")
      })
    }
  }),
)(EditWidgetModal)

export default Controller
