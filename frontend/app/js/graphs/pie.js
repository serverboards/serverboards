/**
 * This is not a React component as it may be used by widgets which do not need
 * to be react components.
 *
 * Example of use:
 * ```
 * var lg=new PieChart(el)
 * lg.set_data({"Test": 100, "Test2": 20})
 * ```
 *
 * Just setting data with set_data, renders it. Internally its free to use
 * whatever it wants.
 *
 * This is encapsulated here, instead of providing direct access to a graphing
 * library, to be able to switch it if necesary  in the future, keeping
 * compatibility.
 */

import Plotly from './plotly'
import 'sass/graphs/index.sass'
import moment from 'moment'
import {merge} from 'app/utils'
import {create_error} from './utils'

const config = {
  displaylogo: false,
  autosizable: true,
  fillFrame: false,
  showLink: false
}

class PieChart{
  constructor(el){
    this.plot=document.createElement('div')
    this.$el=$(el)
    this.$el.addClass('ui graph pie')
    this.data={}
    $(window).on('resize', () => this.resize() )
    this.set_loading()
    this.config={}
  }
  set_loading(){
    this.$el
      .text("Loading")
  }
  set_error(e){
    create_error(this.$el, e)
  }
  resize(){
    Plotly.Plots.resize(this.plot);
  }
  update_config(upd){
    this.config=merge(this.config, upd)
  }
  /**
   * Data is a dict with {label: value} for each label:value to show
   */
  set_data(data){
    let pldata={ values:[], labels:[],
      type: 'pie',
      textinfo: 'value+percent',
      hoverinfo: 'label+value+percent',
      hole: this.config.hole
    }
    Object.keys(data).map( (k) => {
      pldata.values.push( data[k] )
      pldata.labels.push( k )
    })

    const layout = {
      margin: { t: 10, b: 40, l: 50 },
      height: this.$el.height(),
      width: this.$el.width(),
      autosize: true,
      showlegend: ((this.$el.width() > 300) || (this.$el.height() > 300))
    }

    Plotly.newPlot(this.plot, [pldata], layout, config)
    this.$el.html(this.plot)
  }
}

export default PieChart
