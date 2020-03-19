const parse = require("csv-parse");
const fs = require("fs");
const Transform = require("stream").Transform;
const Writeable = require("stream").Writable;
const request = require("request");

class CouchBulkImporter extends Writeable {
    constructor(options){
        if (!options){
            options = {};
        }

        if (!options.url){
            const msg = [
                "options.url must be set",
                "example: ",
                "new CouchBulkImporter({url: "http://localhost:5984/baseball"})"
            ].join("\n");
            throw new Error(msg);
        }

        options.objectMode = true;

        super(options);

        // sanitize url, remove trailing slash;
        this.url = options.url.replace(/\/$/, "");
    }

    _write(chunk, enc, done){
        request({
            json: true,    
            uri: this.url + "/_bulk_docs",    
            method: "POST",    
            body: chunk  
        }, function (err, res, body) {    
            if (err) {
                return done(err);    
            }    
            if (!/^2../.test(res.statusCode)) {
                const msg = "CouchDB server answered: \n Status: " +    
                            res.statusCode + "\n Body: " + JSON.stringify(body);
                return done(new Error(msg));
            }
            done();
        })
    }
}

class TransformToBulkDocs extends Transform {
    constructor(options={objectMode: true, bufferedDocCount: 200}){
        options.objectMode = true;
        super(options);

        this.buffer = [];
        this.bufferedDocCount = options.bufferedDocCount;
    }

    _transform(chunk, encoding, done){
        this.buffer.push(chunk);

        if(this.buffer.length >= this.bufferedDocCount){
            this.push({docs: this.buffer});
            console.log({docs: this.buffer});
            this.buffer = [];
        }

        done();
    }

    _flush(done){
        this.buffer.length && this.push({ docs: this.buffer });
        console.log({docs: this.buffer});

        done();
    }

}

const opts = {comment: "#", delimiter: ";", columns: true};
const parser = parse(opts);
const input = fs.createReadStream(__dirname + "/test/fixtures/test.csv");

input
    .pipe(parser)
    .pipe(new TransformToBulkDocs())
    .pipe(new CouchBulkImporter({url: "http://127.0.0.`:5984/travel"}))


