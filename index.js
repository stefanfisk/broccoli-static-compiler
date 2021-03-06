var fs = require('fs')
var path = require('path')
var grunt = require('grunt')
var symlinkOrCopySync = require('symlink-or-copy').sync
var Writer = require('broccoli-writer')

module.exports = StaticCompiler
StaticCompiler.prototype = Object.create(Writer.prototype)
StaticCompiler.prototype.constructor = StaticCompiler
function StaticCompiler (inputTree, options) {
  if (!(this instanceof StaticCompiler)) return new StaticCompiler(inputTree, options)
  this.inputTree = inputTree

  if (Array.isArray(options)) {
    this.options = {
      files: options
    }
  } else if (typeof options === 'string' || options instanceof String) {
    this.options = {
      files: [options]
    }
  } else {
    this.options = options || {};
  }

  this.options.srcDir = this.options.srcDir || '/';
  this.options.destDir = this.options.destDir || '/';
}

StaticCompiler.prototype.write = function (readTree, destDir) {
  var self = this

  return readTree(this.inputTree).then(function (srcDir) {
    var sourcePath = path.join(srcDir, self.options.srcDir)
    var destPath   = path.join(destDir, self.options.destDir)

    if (self.options.files == null) {
      self._copy(sourcePath, destPath)
    } else {
      var baseDir = path.join(srcDir, self.options.srcDir)
      var files = grunt.file.expand({cwd: baseDir}, self.options.files)
      for (var i = 0; i < files.length; i++) {
        var fileSourcePath = path.join(sourcePath, files[i])
        var fileDestPath = self.options.flatten ? path.join(destPath, path.basename(files[i])) : path.join(destPath, files[i])

        self._copy(fileSourcePath, fileDestPath)
      }
    }
  })
}

StaticCompiler.prototype._copy = function (sourcePath, destPath) {
  if (destPath[destPath.length -1] === '/') {
    destPath = destPath.slice(0, -1)
  }

  var destDir = path.dirname(destPath)
  if (!fs.existsSync(destDir)) {
    grunt.file.mkdir(destDir)
  }

  // if destDir was / then remove the temp folder
  // created by broccoli-writer so we can symlink
  // directly
  if (this.tmpDestDir === destPath) {
    fs.rmdirSync(destPath);
  }
  symlinkOrCopySync(sourcePath, destPath)
}
