var fs = require("fs");

var callbacks = [];
callbacks.create = function(path, callback) {
	if(callbacks.length){
		var c = pool.pop();
		c.path = path; c.callback = callback;
		return c;
	}
	else{
		function c() {
			Array.prototype.splice.call(arguments, arguments.length, 0, c);
			if(c.action){c.action.apply(this, arguments);}
		}
		c.path = path; c.callback = callback;
		c.dispose = function(){
			if(callbacks.length<isDirectory.maxPoolSize){callbacks.push(c);}
			c.action = null;
			c.callback = null;
		}
		c.setAction = function(action){
			c.action = action;
			return this;
		};
		c.return = function(){
			c.callback.apply(this, arguments);
			c.dispose();
		};
		return c;
	}
};

function isDirectory(path, callback) {
	if(callback){
		var c = callbacks.create(path, callback);
		fs.exists(path, c.setAction(checkExists));
	}
}
function checkExists(exists, c) {
	if(exists){
		fs.stat(c.path, c.setAction(checkIsDir));
	}
	else{
		c.return(isDirectory.NON_EXISTANT);
	}
}
function checkIsDir(err, stat, c) {
	if(err){
		c.return(isDirectory.STAT_ERR);
	}
	else if(!stat.isDirectory()){
		c.return(isDirectory.NOT_FOLDER);
	}
	else {
		c.return(true);
	}
}

isDirectory.NON_EXISTANT = NaN;
isDirectory.STAT_ERR = 0;
isDirectory.NOT_FOLDER = false;

isDirectory.maxPoolSize = 10;
module.exports = isDirectory;