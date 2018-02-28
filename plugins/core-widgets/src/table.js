const {React, rpc, Components} = Serverboards
const {Error, Loading} = Components

function nameof(c){
  if (c[0])
    return `${c[0]}.${c[1]}.${c[2]}`
  return c
}

function Table(props){
  const data = props.config.data

  if (props.config.loading || (props.config.data && props.config.data.loading))
    return (
      <Loading>Data</Loading>
    )


  if (!data || !data.columns)
    return (
      <Error>Need some data to show</Error>
    )

  if (data.error){
    return (
      <Error>{data.error}</Error>
    )
  }

  return (
    <div className="ui with scroll">
      <table className="ui striped table">
        <thead>
          <tr>
            {data.columns.map( (c, i) => (
              <th key={i}>{nameof(c)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map( (row, j) => (
            <tr key={j}>
              {row.map( (cell, i) => (
                <td key={i}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

Serverboards.add_widget("serverboards.core.widgets/table", Table, {react: true})
