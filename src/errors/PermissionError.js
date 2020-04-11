module.exports = class PermissionError extends Error {
  constructor (e, ...perm) {
    super(e)
    this.name = '[PermissionError]'
    this.perms = perm
  }
}
