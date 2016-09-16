const {rpc} = Serverboards

export function basename(filepath){
  var parts=filepath.split('/')
  if (parts.length==0)
    return ''
  return parts[parts.length-1]
}

// from MDN https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
export function hex(buffer) {
  var hexCodes = [];
  var view = new DataView(buffer);
  for (var i = 0; i < view.byteLength; i += 4) {
    // Using getUint32 reduces the number of iterations needed (we process 4 bytes each time)
    var value = view.getUint32(i)
    // toString(16) will give the hex representation of the number without padding
    var stringValue = value.toString(16)
    // We use concatenation and slice for padding
    var padding = '00000000'
    var paddedValue = (padding + stringValue).slice(-padding.length)
    hexCodes.push(paddedValue);
  }

  // Join all the hex strings into one
  return hexCodes.join("");
}

export function old_backup(date){
  // must match today date or yesterdays
  var today = (new Date()).toISOString().slice(0,10)
  var yesterday_d = new Date()
  yesterday_d.setDate(yesterday_d.getDate()-1)

  var yesterday = yesterday_d.toISOString().slice(0,10)
  return date == today || date == yesterday
}

export function get_servername(uuid){
  let p = new Promise(function(accept, reject){
    rpc.call("service.info", [uuid]).then( (service) => {
      accept(service.name)
    }).catch( (e) => {
      reject( e )
    })
  })
  return p
}
