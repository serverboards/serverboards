const {rpc, React} = Serverboards
const plugin_id="[plugin-id]"

function View(props){
  return (
    <pre>
      {JSON.stringify(props, undefined, 2)}
    </pre>
  )
}

Serverboards.add_[component-type](`${plugin_id}/[component-type]`, View, {react: true})
