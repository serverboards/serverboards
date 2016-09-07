let React = Serverboards.React

function DataGrid(props){
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
                <td>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DataGrid
