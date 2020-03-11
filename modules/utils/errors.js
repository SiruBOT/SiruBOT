module.exports.PermError = class PermissionError {
  constructor (err, ...perm) {
    this.name = '[PermissionError] '
    this.message = err.message
    this.stack = this.name + err.stack
    this.perms = perm
  }
}
