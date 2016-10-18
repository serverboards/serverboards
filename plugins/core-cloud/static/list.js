'strict mode'

var rpc = Serverboards.rpc

function create_table(headers, data){
  var table = $('<table class="ui table">')
  var tr = $('<tr>')
  headers.map( function(h){ tr.append($('<th>').text(h)) })
  table.append($('<thead>').html(tr))

  var tbody= $('<tbody>')
  table.append(tbody)
  data.map(function(d){
    tr=$('<tr>')
    headers.map( function(h){
      tr.append($('<td>').text(d[h]))
    })
    tbody.append(tr)
  })

  return table
}

function main(el, config){
  var d={
    daemon: undefined,
    server: undefined,
  }
  var service=config.service.config
  console.log(service)
  rpc.call('plugin.start',["serverboards.core.cloud/daemon"]).then(function(daemon){
    d.daemon=daemon
    return rpc.call(d.daemon+'.connect', service)
  }).then(function(server){
    d.server=server
    return rpc.call(d.daemon+'.list', [d.server])
  }).then(function(list){
    $(el).find('#node-list').html( create_table( ["id","name","state"], list ) )

    console.log(list)
  }).catch(function(e){
    Serverboards.Flash.error("Error gathering list of nodes\n\n"+e)
  })
}

Serverboards.add_screen("serverboards.core.cloud/list", main)
