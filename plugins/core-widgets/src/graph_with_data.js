const {React} = Serverboards
import {get_data, colorize, is_string} from './utils'
const {map_get, object_is_equal, to_number} = Serverboards.utils
const {Loading, Error} = Serverboards.Components

const MULTOF = 4

function next_stop_point(point){
  const scale = Math.floor(Math.log10(point)) - 1
  const next_multof = MULTOF * (10 ** scale)

  return next_multof * Math.ceil( point / next_multof ) * 1.2
}

class GraphWithData extends React.Component {
  componentDidMount(){
    this.props.setTitle(map_get(this.props, ["config","title"]))
  }
  componentWillReceiveProps(nextprops){
    if (map_get(nextprops, ["config","title"]) != map_get(this.props, ["config","title"]))
      this.props.setTitle(map_get(nextprops, ["config","title"]))
  }
  shouldComponentUpdate(nextProps, nextState){
    return (
      !(object_is_equal(this.props.config, nextProps.config)) ||
      !(object_is_equal(this.props.layout, nextProps.layout))
    )
  }
  render(){
    const props = this.props
    const config = props.config || {}
    const SVGComponent = props.svgComponent

    if (!SVGComponent)
      return (
        <Error>{i18n("Bad formed graph component")}</Error>
      )

    // console.log(config)
    if (!config.data)
      return (
        <Loading.Widget/>
      )

    if (config.data.error)
      return (
        <Error>{config.data.error}</Error>
      )
    if (!config.data.rows)
      return (
        <Loading.Widget/>
      )

    const performance = get_data(config.performance)
    let performance_color = ""
    if (is_string(performance) && performance.startsWith('-'))
      performance_color = 'red'
    if (is_string(performance) && performance.startsWith('+'))
      performance_color = 'teal'

    let categories = Array.from(new Set(config.data.rows.map( r => r[0] )))
    const xaxis = Array.from(new Set(config.data.rows.map( r => r[1] ))).sort()

    if (categories.length > 4){
      const total_by_category = config.data.rows.reduce( (acc, r) => {
        const prev = acc[r[0]] || 0
        acc[r[0]] = prev + (r[2] || 0)
        return acc
      }, {})
      const top3 = Object.keys(total_by_category)
          .map( cat => [total_by_category[cat], cat])
          .sort( (a,b) => b[0]-a[0] )
          .slice(0,3)
          .map( poscat => poscat[1] )
      // console.log(top3)
      categories = top3.concat("Other")
    }

    const data = config.data.rows.reduce( (acc, r) => {
      let cat = (categories.indexOf(r[0])>=0) ? r[0] : "Other"
      const k = [r[1], cat]
      const prev = acc[ k ] || 0
      acc[ k ] = prev + to_number(r[2] || 0)
      return acc
    }, {})
    // console.log("Next stop point!", next_stop_point)
    const maxy = next_stop_point(Object.values(data).reduce( (acc, r) => Math.max(acc, r), 0 ))

    let width = props.layout.width
    let height = props.layout.height
    let legend_width = 140

    const show_legend = config.show_legend || "hide"

    if (props.layout.h > 2)
      height -= 20
    if (props.layout.w > 2)
      width -= 20

    if (show_legend == "hide"){
      return (
        <div style={{display: "relative"}}>
          <div style={{position: "absolute", top: 10, right: 10}}>
            <div className="ui biggier bold text">{get_data(config.summary)}</div>
            <div className={`ui ${performance_color} text`}>{performance}</div>
          </div>

          <div style={{justifyContent: "center", alignItems: "center", display: "flex", flexDirection: "column"}}>
            <SVGComponent {...config} data={data} xaxis={xaxis} maxy={maxy} width={width} height={height} categories={categories} theme={props.theme}/>
          </div>
        </div>
      )
    }
    else if (show_legend == "bottom"){
      return (
        <div style={{display: "flex", flexDirection: "column", justifyContent: "space-evenly"}}>
          <div style={{position: "absolute", top: 10, right: 10}}>
            <div className="ui biggier bold text">{get_data(config.summary)}</div>
            <div className={`ui ${performance_color} text`}>{performance}</div>
          </div>

          <div style={{flex: 1, justifyContent: "center", alignItems: "center", display: "flex", flexDirection: "column", justifyContent: "space-evenly"}}>
            <SVGComponent {...config} data={data} xaxis={xaxis} maxy={maxy} width={width} height={height - ((props.layout.h > 1) ? 55 : 35)} categories={categories} theme={props.theme}/>
          </div>
          <div style={{flex: 0, padding: "0 0 10px 20px"}}>
            <div className="" style={{flex: 1, display: "flex", flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start", alignSelf: "flex-start"}}>
              {categories.map( (c, i) => (
                <div className="ui bold text padding left" key={i}>
                  <span className={`ui square`} style={{background: colorize(i)}}/>&nbsp;
                  {c}
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }
    else {
      return (
        <div style={{display: "flex"}}>
          <div style={{flex: 1, justifyContent: "center", alignItems: "center", display: "flex", flexDirection: "column", justifyContent: "space-evenly"}}>
            <SVGComponent {...config} data={data} xaxis={xaxis} maxy={maxy} width={width - 130} height={height} categories={categories} theme={props.theme}/>
          </div>

          <div style={{flex: 0, minWidth: "8em", display: "flex", flexDirection: "column", alignItems: "flex-end", minWidth: legend_width, width: legend_width, padding: 20}}>
            <div className="ui biggier bold text padding bottom">{get_data(config.summary)}</div>
            <div className={`ui ${performance_color} text`}>{performance}</div>
            <div style={{flex: 1}}/>
            <div className="" style={{flex: 2, display: "flex", flexDirection: "column", justifyContent: "space-around", alignSelf: "flex-start"}}>
              {categories.map( (c, i) => (
                <div className="ui bold text oneline" key={i}>
                  <span className={`ui square`} style={{background: colorize(i)}}/>&nbsp;
                  {c}
                </div>
              ))}
            </div>
            <div style={{flex: 2}}/>
          </div>
        </div>
      )

    }
    // console.log(categories)
  }
}

export default GraphWithData
