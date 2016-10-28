/**
 * This is not a React component as it may be used by widgets which do not need
 * to be react components.
 *
 * Example of use:
 * ```
 * var lg=new LineGraph(el)
 * lg.set_data([{"Test": [now-1, 0], [now, 1]}])
 * ```
 *
 * Just setting data with set_data, renders it. Internally its free to use
 * whatever it wants.
 *
 * This is encapsulated here, instead of providing direct access to a graphing
 * library, to be able to switch it if necesary  in the future, keeping
 * compatibility.
 */

import Plotly from 'plotly.js'
import 'sass/graphs/lines.sass'
import moment from 'moment'

const config = {
  displaylogo: false,
  autosizable: true,
  fillFrame: false,
  showLink: false
}

class LineGraph{
  constructor(el){
    this.plot=document.createElement("div")
    this.$el=$(el)
    this.$el
      .addClass("ui graph lines")
    this.data=[]
    $(window).on('resize', () => this.resize())
    this.set_loading()
  }
  set_loading(){
    this.$el
      .text("Loading")
  }
  set_error(e){
    this.$el.addClass("error").text(e)
  }
  set_data(data){
    let pldata=[]
    data.map( ({name, values}) => {
      let vx=[], vy=[]
      values.map(([x,y]) => {
        vx.push(moment.unix(x).format("YYYY-MM-DD HH:mm:ss")); vy.push(y)
      })

      pldata.push({
        name,
        x: vx, y: vy,
        type: "line"
      })
    })

    console.log(this.$el.height())
    const layout = {
      margin: { t: 10, b: 40, l: 50 },
      height: this.$el.height(),
      width: this.$el.width(),
      autosize: true,
    }

    Plotly.newPlot(this.plot, pldata, layout, config)
    this.$el.html(this.plot)
  }
  resize(){
    console.log("resize %o", this.plot)
    Plotly.Plots.resize(this.plot);
  }
}


export default LineGraph
