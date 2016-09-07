let React = Serverboards.React

function DataGrid(props){
  function to_string(c){
    if (typeof c == 'object')
      return JSON.stringify(c)
    return c
  }

  return (
    <div style={{height:"60vh", overflow: "scroll"}}>
      <table className="ui celled unstackable table">
        <thead>
          {props.headers.map( (h) => (
            <th>{h}</th>
          ))}
        </thead>
        <tbody>
          {props.data.map( (row) => (
            <tr>
              {row.map( (cell) => (
                <td>{to_string(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DataGrid
