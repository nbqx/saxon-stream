var path = require('path'),
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

util.inherits(Saxon,Transform);

function Saxon(jar_path,opts){
  this.data = '';
  this.jar_path = path.resolve(jar_path);
  this.opts = opts || {'-warnings':'silent'};
  this.cont = '';
  this._timeout = 5000;
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
  
  var _opts = Array.prototype.concat.call(
    ['-jar',self.jar_path,'-s:'+self.xml.path,'-xsl:'+self.xsl],
    parseOpts(self.opts)
  );
  var cmd = require('child_process').exec('java '+_opts.join(' '),{timeout:self._timeout},function(err,stdout,stderr){
    if(err){
      var code = err.code;
      if(err) return self.emit('end',code,err.toString());
    }
    if(stderr) return self.emit('end',code,stderr);
    self.push(stdout);
    self.emit('end',code,stdout);
    done();
  });

  cmd.on('exit',function(code,sig){
    self.xml.unlink();
  });
};

module.exports = Saxon;
