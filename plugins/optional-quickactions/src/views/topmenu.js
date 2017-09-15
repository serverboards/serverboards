const {i18n, React} = Serverboards

function TopMenu(props){
  return (
    <div className="menu">
      <div className="item stretch"/>
      <a className="ui teal button" onClick={props.onAddQuickAction}>{i18n("Add quick action")}</a>
    </div>
  )
}

export default TopMenu
