const UNITS = [ "B", "KiB", "MiB", "GiB", "TiB", "ZiB"]

function calculate_size(size){
  let csize = size
  let i
  for (i=0;i<UNITS.length;i++){
    let nsize = csize/1024;
    if (nsize<1.0)
      break
    csize = nsize
  }

  return {
    size: csize,
    unit: UNITS[i]
  }
}

export {calculate_size}
