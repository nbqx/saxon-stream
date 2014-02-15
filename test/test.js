var should = require('should'),
    fs = require('fs');
var Saxon = require('../');

describe('Saxon',function(){

  var xml = __dirname+'/fixtures/test.xml';
  var xsl = __dirname+'/fixtures/test.xsl';
  
  function testStream(stream,inputs,output,next){
    for(var i=0; i<inputs.length; i++){
      stream.write(inputs[i]);
    }
    stream.end();

    stream.on('data',function(data){
      data.should.be.an.instanceOf(Buffer);
      data.toString().should.equal(output);
      next();
    });
  };
  
  describe('constructor',function(){
    it('should have a `_transformState` property', function(done){
      var s = new Saxon(__dirname+'/../vendor/saxon9he.jar');
      s.xslt(xsl).should.have.property('_transformState');
      done();
    });
  });

  describe('transform', function(){
    it('should return a result of XSLT', function(done){
      var s = new Saxon(__dirname+'/../vendor/saxon9he.jar');
      testStream(s.xslt(xsl),[fs.readFileSync(xml)],'my name',done);
    });
  });
});


