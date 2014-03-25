var spawn = require('child_process').spawn,
    path = require('path'),
    util = require('util'),
    Transform = require('stream').Transform || require('readable-stream').Transform;

var tmp = require('temporary');

// omit `-o` option
function parseOpts(obj){
  var ret = [];
  for(var k in obj){
    if(k!=='-o'){
      ret.push(k+':'+obj[k]);
    }
  };
  return ret
};

util.inherits(Saxon,Transform);

function Saxon(jar_path,opts){
  this.jar_path = path.resolve(jar_path);
  this.opts = opts || {'-warnings':'silent'};
};                              

Saxon.prototype.xslt = function(xsl_path){
  this.xsl = path.resolve(xsl_path);
  Transform.call(this);
  return this
};

Saxon.prototype._transform = function(chunk,encoding,done){
  var self = this;
  var cont = chunk.toString();
  self.xml = new tmp.File();
  self.xml.writeFileSync(cont);

  var _opts = Array.prototype.concat.call(
    ['-jar',self.jar_path,'-s:'+self.xml.path,'-xsl:'+self.xsl],
    parseOpts(self.opts)
  );

  var cmd = spawn('java',_opts);
  
  cmd.stdout.on('data',function(data){
    self.push(data+'');
  });

  cmd.stderr.on('data',function(data){
    self.emit('error',data+'');
  });
  
  cmd.on('exit',function(code){
    done();
  });
};

Saxon.prototype._flush = function(done){
  var self = this;
  self.xml.unlink();
  done();
};

module.exports = Saxon;
