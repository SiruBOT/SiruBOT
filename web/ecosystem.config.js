module.exports = {
  apps: [{
    name: 'RewriteWEB',
    script: './index.js',
    instances: 1,
    exec_mode: 'cluster'
  }]
}
