
var jsfy_res = jsfy_res || {};

// some basic extension

if (typeof String.prototype.startsWith != 'function') {
	String.prototype.startsWith = function(str) {
		return str.length > 0 && this.substring(0, str.length) === str;
	};
};

if (typeof String.prototype.endsWith != 'function') {
	String.prototype.endsWith = function(str) {
		return str.length > 0
				&& this.substring(this.length - str.length, this.length) === str;
	};
};

var getFileName = function(path) {
	return path.substring( path.lastIndexOf('/')+1 );
};

var getDirPath = function(path) {
	return path.substring(0, path.lastIndexOf('/'));
};

var getAbsPath = function(f, me) {
	if( f.indexOf('://') > -1 ) return f;
	
	d = getDirPath(me);
	do { // './xx.js' or '../xx.js'
		if (f.substring(0, 2) == './') {
			f = f.substring(2);
			continue;
		}
		if (d.length == 0)
			break;
		if (f.substring(0, 3) == '../') {
			f = f.substring(3);
			d = getDirPath(d);
			continue;
		}
		if (d.length > 0) {
			f = d + '/' + f;
			break;
		}
	} while (1);

	return f;
};

var trimRightTags = function( url ) {
	var filter = ['?', '#'];
	for(var i=0; i<filter.length; i++) {
		var pos = url.indexOf( '?' );
		if(pos > 0) {
			url = url.substring(0, pos);
		}
	}

	return url;
};

// dynamic loading javascript 

var loadJavascript = function( url, onload, onerror ) {
	console.log( "loading: " + url );
	
	var d = document, s = 'script';
	var ss = d.getElementsByTagName(s);

	for(var i=0; i<ss.length; i++) {
		if( ss[i].src == url ) {
			console.log( ss[i].src, url );
			return;
		}
	}
	
	o = d.createElement(s);
	o.async = 0;
	o.onload = onload;
	o.onerror = onerror;
	o.type = 'text/javascript';
	o.src = url;
	ss[0].parentNode.insertBefore(o, ss[0]);

	return o;
};

// patch AJAX to access local resource

var original_XMLHttpRequest = XMLHttpRequest;

XMLHttpRequest.prototype.x_open = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.x_send = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function(method, url, async, username, password) {
	console.log( "XMLHttpRequest.open: " + method + " " + url );
	this.x_url = url;
	this.x_open(method, url, async, username, password);
};

XMLHttpRequest.prototype.send = function( body ) {
	console.log( "XMLHttpRequest.send" );
	
	this.x_onreadystatechange = this.onreadystatechange;
	this.x_onload = this.onload;
	this.x_onerror = this.onerror;
	
	this.onreadystatechange = function() {
		console.log( "XMLHttpRequest.onreadystatechange" );
		if(typeof this.x_onreadystatechange == 'function') {
			this.x_onreadystatechange();
		}
	};

	this.onerror = function() {
		console.log( "XMLHttpRequest.onerror" );
		if(typeof this.x_onerror == 'function') {
			this.x_onerrord();
		}
	};
	
	this.onload = function() {
		//console.trace();
		console.log( "XMLHttpRequest.onload: " + this.x_url );
		if(typeof this.x_onload == 'function') {
			this.x_onload();
		}
	};

	var url = this.x_url;
 	if(document.location.protocol == 'file:') {
 		if((! url.startsWith('http://')) && (! url.startsWith('https://')) ) {
 			url = trimRightTags( url );
 			if(url.endsWith('.js')) { // .js
 				var _this = this;
 				loadJavascript( url, function(){
 					if(_this.onload != null) _this.onload();
 				}, function() {
 					if(_this.onerror != null) _this.onerror();
 				} );
 				return;
 			} else { // .json, .csv, etc.
 				var data = jsfy_res[ url ];
 				if(typeof data == 'string') {
 					console.trace();
 	 				//console.log( url, data );
 					this.response = data;
 					this.responseText = data;
 					if(this.onload != null) this.onload();
 					return;
 				}
 			}
 		}
 	}
	
	this.x_send( body );
};

// patch jQuery to access local resource

var original_getJSON = $.getJSON;
var original_getScript = $.getScript;

GetLocalFile = function(){};

GetLocalFile.prototype = {
	done_callback: null,
	fail_callback: null,
	
	done: function(callback) {
		this.done_callback = callback;
		return this;
	},
	
	fail: function(callback) {
		this.fail_callback = callback;
		return this;
	}
};

$.getJSON = function( url ) {
	if(url.startsWith('http://') || url.startsWith('https://')) return original_getJSON( url );
	if(document.location.protocol != 'file:') return original_getJSON( url );

	console.log( "$.getJSON: " + url );

	var x = new GetLocalFile();
	x.url = url;
	
	window.setTimeout(function(x){
		var data = jsfy_res[ x.url ];
		if(typeof data == 'string') {
			var func = x.done_callback;
			if(typeof func == 'function') func( JSON.parse(data) );
		} else {
			var func = x.fail_callback;
			if(typeof func == 'function') func();
		}
	}, 100, x);
	
	return x;
};

$.getScript = function( url ) {
	if(url.startsWith('http://') || url.startsWith('https://')) return original_getScript( url );
	if(document.location.protocol != 'file:') return original_getScript( url );
	
	console.log( "$.getScript: " + url );

	var x = new GetLocalFile();
	
	loadJavascript( url, function(){
		var func = x.done_callback;
		if(typeof func == 'function') func("", "success");
	}, function(){
		
	});
	
	return x;
};


