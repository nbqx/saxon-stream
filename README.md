## saxon-stream

saxon transform stream wrapper

## Usage

    $ npm install saxon-stream

```js
var fs = require('fs'),
    Saxon = require('saxon-stream');
var xml = fs.createReadStream('/path/to/xml');
var saxon = new Saxon('/path/to/saxon9he.jar');
saxon.on('error',function(err){ console.log(err) });
xml.pipe(saxon.xslt('/path/to/xsl')).pipe(process.stdout);
```
