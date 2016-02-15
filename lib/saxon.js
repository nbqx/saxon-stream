var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    Transform = require('stream').Transform || require('readable-stream').Transform;

var tmp = require('temporary');

function parseOpts(obj){
  var ret = [];
  for(var k in obj){
    ret.push(k+':'+obj[k]);
  };
  return ret
};

function assembleSaxonCommand(saxonJarPath, xmlPath, xslPath, opts) {
  var options = parseOpts(opts).join(' ');
  return util.format('java -jar "%s" "-s:%s" "-xsl:%s" %s', saxonJarPath, xmlPath, xslPath, options);
}

util.inherits(Saxon,Transform);

function Saxon(jar_path,opts){
  this.data = '';
  this.jar_path = path.resolve(jar_path);
  this.opts = opts || {'-warnings':'silent'};
  this.cont = '';
  this._timeout = 5000;

  if(!fs.existsSync(this.jar_path)){
    throw new Error('saxon jar not found');
  }
};

Saxon.prototype.timeout = function(ms){
  if(!isNaN(ms)){
    this._timeout = ms;
  }
  return this
};

Saxon.prototype.xslt = function(xsl_path){
  this.xsl = path.resolve(xsl_path);
  Transform.call(this);
  return this
};

Saxon.prototype._transform = function(chunk,encoding,done){
  var  self = this;
  if(chunk){
    self.cont += chunk;
  }
  done();
};

Saxon.prototype._flush = function(done){
  var self = this;

  self.xml = new tmp.File();
  self.xml.writeFileSync(self.cont);
  var command = assembleSaxonCommand(self.jar_path, self.xml.path, self.xsl, self.opts);
  var process = require('child_process').exec(command,{timeout:self._timeout, maxBuffer: 1024 * 2000},function(err,stdout,stderr){
    if(err){
      return self.emit('error',err);
    }
    if(stderr && !stderr.startsWith("Warning:")){
      return self.emit('error',stderr);
    }
    self.push(stdout);
    self.emit('end',0,stdout);
    done();
  });

  process.on('exit',function(code,sig){
    self.xml.unlink();
  });
};

module.exports = Saxon;
