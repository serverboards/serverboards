let flash={
  add: (message, options) => ({
   type: 'FLASH_ADD',
   message, options
 }),
  remove: (message) => ({
    type: 'FLASH_REMOVE',
    message
  })
}

export default flash
