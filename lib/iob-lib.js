'use strict';

let adapter;

let objectStates = {};
let stateStates = {};

function init(adapterInstance) {
	adapter = adapterInstance;
}

function createOrSetState(id, setobj, setval) {
	if('undefined' !== typeof stateStates[id] && stateStates[id] === true) {
		adapter.setState(id, setval, true);
	} else {
		adapter.getObject(id, function(err, obj) {
			if(err || !obj) {
				adapter.setObject(id, setobj, function() {
					stateStates[id] = true;
					adapter.setState(id, setval, true);
				});
			} else {
				stateStates[id] = true;
				adapter.setState(id, setval, true);
			}
		});
	}
}

function setOrUpdateState(id, name, setval, setunit, settype, setrole, setstates) {
	if('undefined' !== typeof stateStates[id] && stateStates[id] === true) {
		adapter.setState(id, setval, true);
		return;
	}
	
	if(!setunit) {
		setunit = '';
	}
	if(!settype) {
		settype = 'number';
	}
	if(!setrole) {
		setrole = 'value';
	}

	let read = true;
	let write = false;
	if(setrole.substr(0, 6) === 'button') {
		read = false;
		write = true;
	} else if(setrole.substr(0, 5) === 'level' || setrole.substr(0, 6) === 'switch') {
		read = true;
		write = true;
	}

	let obj = {
			type: 'state',
			common: {
					name: name,
					type: settype,
					role: setrole,
					read: read,
					write: write,
					unit: setunit
			},
			native: {}
	};
	if(setstates) {
		obj['common']['states'] = setstates;
	}
	createOrSetState(id, obj, setval);
}

function setOrUpdateObject(id, name, settype, callback) {
	if('undefined' !== typeof objectStates[id] && objectStates[id] === true) {
		return callback && callback();
	}
	
	if(!settype) {
		settype = 'channel';
	}
	
	let setObj = {
		type: settype,
		common: {
			name: name
		},
		native: {}
	};
	
	adapter.getObject(id, function(err, obj) {
		if(!err && obj) {
			adapter.extendObject(id, setObj, function() {
				objectStates[id] = true;
				return callback && callback();
			});
		} else {
			adapter.setObject(id, setObj, function() {
				objectStates[id] = true;
				return callback && callback();
			});
		}
	});
}

function delObjectIfExists(id, callback) {
	adapter.getObject(id, function(err, obj) {
		if(!err && obj) {
			adapter.delObject(id, function(err) {
				if(!err) {
					delete objectStates[id];
				}
				callback && callback();
			});
		} else {
			callback && callback();
		}
	});
}

function decrypt(key, value) {
	var result = '';
	for(var i = 0; i < value.length; ++i) {
		result += String.fromCharCode(key[i % key.length].charCodeAt(0) ^ value.charCodeAt(i));
	}
	return result;
}

module.exports = {
	init: init,
	setOrUpdateObject: setOrUpdateObject,
	createOrSetState: createOrSetState,
	setOrUpdateState: setOrUpdateState,
	delObjectIfExists: delObjectIfExists,
	decrypt: decrypt
};