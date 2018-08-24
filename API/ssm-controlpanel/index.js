function lengthOf(obj) {
	var len = 0
	if (obj.constructor.name == "Array") {
		obj.forEach(function() {
			len++
		})
	}
	else {
		for (var k in obj) {
			if (obj[k] != undefined) {
				len++
			}
		}
	}
	return len
}

// Files
var fs = require("fs") // File system

// Host
var express = require("express") // Express web module

var app = express() // Initialize express

var serv = require("http").Server(app) // Website
var https = require("http") // Https (for requests)

var cookieParser = require("cookie-parser")
var cookie_parser = cookieParser(null, {decode: true})
app.use(cookie_parser)


// Communication
var io = require('socket.io')(serv,{}) // Socket io module


// HTML
var htmlparser = require("htmlparser2") // Html parser
var domutils = require("domutils") // Html DOM utilities

var domToHTML = require('htmlparser-to-html') // To convert the DOM back to HTML

var querystring = require("querystring")

// Database
var db = require('mongodb') // MongoDB module
var mcl = db.MongoClient
var url = "" // REMOVED

// Encryption
var crypto = require('crypto')

function sha256(str = "") { // A function to encrypt with sha256
	var Csha = crypto.createHash('sha256') // Create sha256 hash
	Csha.update(str, "utf8") // Give it the data
	return Csha.digest("hex") // Encrypt it
}
var sessionPassword = sha256("") // REMOVED
function encrypt(str = "") {
	var Caes = crypto.createCipher("aes128", sessionPassword)
	Caes.update(str, "utf8")
	return Caes.final("hex")
}
function decrypt(str = "") {
	var Caes = crypto.createDecipher("aes128", sessionPassword)
	Caes.update(str, "utf8")
	return Caes.final("hex")
}
function Register(username, key) {
	var oldUser = false
	var pause = true
	mcl.connect(url, function(err, db) {
		if (err) throw err
		db.collection("users").find({}).toArray(function(err, result) {
			for (var key2 in result) {
				var user = result[key2]
				if (user.Username == username) {
					if (err) throw err
					user._id = undefined
					oldUser = user
					pause = false
				}
			}
			pause = false
		})
		db.close()
	})
	return new Promise(function(resolve, reject) {
		var interval
		interval = setInterval(function() {
			if (!pause) {
				if (oldUser) { // Don't let them sign up as a taken username
					resolve(false)
				}
				else {
					var user = {}
					user.Username = username
					user.Key = sha256(key)
					user.Banned = false
					user.Moderator = false
					var number = 0
					var pause = true
					db.collection("users").find({}, function(err, res) {
						for (var key in res) {
							number++
						}
						pause = false
						db.close()
					})
					new Promise(function(resolve, reject) {
						var interval
						interval = setInterval(function() {
							if (!pause) {
								resolve(number)
								clearInterval(interval)
							}
						}, 1)
					}).then(function(number) {
						user._id = number
						mcl.connect(url, function(err, db) {
							if (err) throw err
							db.collection("users").insertOne(user, function(err, res) {
								if (err) throw err
								console.log("Registration: "+user.Username)
							})
							db.close()
						})
					})
					resolve(user)
				}
				clearInterval(interval)
			}
		}, 1)
	})
}

function Login(username, key) { // Gets a user from the database with a username and password. Returns false if it did not login succesfully
	var user = false
	var pause = true
	mcl.connect(url, function(err, db) {
		if (err) throw err
		db.collection("users").find({}).toArray(function(err, result) {
			for (var key2 in result) {
				var u = result[key2]
				if (u.Username == username && u.Key == sha256(key)) {
					if (err) throw err
					user = u
				}
			}
			pause = false
		})
		db.close()
	})
	return new Promise(function(resolve, reject) {
		var interval
		interval = setInterval(function() {
			if (!pause) {
				resolve(user)
				clearInterval(interval)
			}
		}, 1)
	})
}

function ValidateUser(username, encrypted_key) { // Exactly the same as login but with an already encrypted key (it will usually be from the client)
	var user = false
	var pause = true
	mcl.connect(url, function(err, db) {
		if (err) throw err
		db.collection("users").find({}).toArray(function(err, result) {
			for (var key2 in result) {
				var u = result[key2]
				if (u.Username == username && u.Key == encrypted_key) {
					if (err) throw err
					user = u
				}
			}
			pause = false
		})
		db.close()
	})
	return new Promise(function(resolve, reject) {
		var interval
		interval = setInterval(function() {
			if (!pause) {
				resolve(user)
				clearInterval(interval)
			}
		}, 1)
	})
}

function GetUserId(username="", key="") { // Gets a user's id from their username and encrypted key
	var id = false
	var pause = true
	mcl.connect(url, function(err, db) {
		if (err) throw err
		db.collection("users").find({}).toArray(function(err, result) {
			for (var key2 in result) {
				var u = result[key2]
				if (u.Username == username && u.Key == key) {
					if (err) throw err
					id = u._id
				}
			}
			pause = false
		})
		db.close()
	})
	return new Promise(function(resolve, reject) {
		var interval
		interval = setInterval(function() {
			if (!pause) {
				resolve(id)
				clearInterval(interval)
			}
		}, 1)
	})
}

function GetUserFromId(id=0) { // Opposite of above (Note: will return the user object, not the username and key)
	var user = false
	var pause = true
	mcl.connect(url, function(err, db) {
		if (err) throw err
		db.collection("users").find({}).toArray(function(err, result) {
			for (var key2 in result) {
				var u = result[key2]
				if (u._id == id) {
					if (err) throw err
					user = u
				}
			}
			pause = false
		})
		db.close()
	})
	return new Promise(function(resolve, reject) {
		var interval
		interval = setInterval(function() {
			if (!pause) {
				resolve(user)
				clearInterval(interval)
			}
		}, 1)
	})
}

function SetSessionKey(user, key) {
	
}

function Check(username, key, sid) {
	return true
}

class User {
	constructor(session, noAppend) { // Socket usage is deprecated
		this.Username = ""
		this.Registered = false
		this.Banned = false
		this.Interface = {}
		this.Interface.SendData = function() {
			return false
		}
		this.Interface.SendInfo = function() {
			return false
		}
		this.SocketId = session
		this.Ip = "N/A"
		this.Key = ""
		this.Login = function(username, key) {
			var user = false
			var pause = true
			Login(username, key).then(function(login) { // Get login data
				if (key && login) {
					this.Username = login.Username // Their username
					this.Banned = login.Banned // Are they banned?
					this.Key = sha1(key) // Use the argument in case they somehow login with the wrong key (for later checking)
					this.Registered = true
					this.Id = login._id
					user = login
				}
				pause = false
			})
			return new Promise(function(resolve, reject) {
				var interval
				interval = setInterval(function() {
					if (!pause) {
						resolve(user)
						clearInterval(interval)
					}
				}, 1)
			})
		}
		this.Login_Encrypted = function(username, key) {
			var user = false
			var pause = true
			var self = this
			ValidateUser(username, key).then(function(login) { // Get login data
				if (key && login) {
					self.Username = login.Username // Their username
					self.Banned = login.Banned // Are they banned?
					self.Key = key // Use the argument in case they somehow login with the wrong key (for later checking)
					self.Registered = true
					self.Id = login._id
					user = login
				}
				pause = false
			})
			return new Promise(function(resolve, reject) {
				var interval
				interval = setInterval(function() {
					if (!pause) {
						resolve(user)
						clearInterval(interval)
					}
				}, 1)
			})
		}
		this.Destroy = function() {
			if (this.SessionId && Sessions[this.SessionId]) {
				delete Sessions[this.SessionId]
			}
		}
		this.Data = function() {
			var dat = {}
			dat.Username = this.Username
			dat.Registered = this.Registered
			dat.Banned = this.Banned
			dat.Key = sha1(this.Key)
			dat.Id = this.Id
			return dat
		}
		this.ClientData = function() {
			var dat = {}
			dat.Username = this.Username
			dat.Registered = this.Registered
			dat.Banned = this.Banned
			dat.Key = sha1(this.Key)
			dat.Id = this.Id
			return dat
		}
		this.PublicData = function() {
			var dat = {}
			dat.Username = this.Username
			dat.Banned = this.Banned
			dat.Registered = this.Registered
			dat.Id = this.Id
			return dat
		}
		return this
	}
}

function MakeHttpRequest(url, method, args, res) {
	res = res
	var u = URL.parse(url)
	var options = {
		href: u.href,
		protocol: u.protocol,
		hostname: u.hostname,
		port: u.port,
		path: (u.pathname || "")+(u.search || ""),
	}
	if (method != undefined && args != undefined && method != null && args != null) {
		var bodyString = querystring.stringify(args)
		options.headers = {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': Buffer.byteLength(bodyString)
		}
		options.method = method
		res.setHeader('Content-Type', 'application/text')
		var req2 = https.request(options, function(res2) {
			for (key in res2.headers) {
				var val = res2.headers[key]
				res.set(key, val)
			}
			res2.setEncoding('utf8');
			var str = ""
			res2.on('data', function(ch) {
				str += ch
			})
			res2.on('end', function() {
				res.send(str)
			})
		})
		req2.on('error', e => {
			
		})
		req2.write(bodyString)
		req2.end()
	}
}
function MakeHttpRequest2(url, method, args, func=function(){}) {
	var u = URL.parse(url)
	var options = {
		href: u.href,
		protocol: u.protocol,
		hostname: u.hostname,
		port: u.port,
		path: (u.pathname || "")+(u.search || ""),
	}
	if (method != undefined && args != undefined && method != null && args != null) {
		var bodyString = querystring.stringify(args)
		options.headers = {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': Buffer.byteLength(bodyString)
		}
		options.method = method
		var req2 = https.request(options, function(res2) {
			for (key in res2.headers) {
				var val = res2.headers[key]
			}
			res2.setEncoding('utf8');
			var str = ""
			res2.on('data', function(ch) {
				str += ch
			})
			res2.on('end', function() {
				func(str)
			})
		})
		req2.on('error', e => {
			
		})
		req2.write(bodyString)
		req2.end()
	}
}

var Sessions = {} // Session list

function GenerateSessionID(id) {
	var key = sha256(encrypt(id.toString()))
	return key
}

function CreateUser(req, res) {
	var session = GenerateSessionID(lengthOf(Sessions))
	var user = new User(session)
	if (res) {
		res.append("Set-Cookie", ["sessionid="+session+"; Path=/; HostOnly"])
	}
	else {
		user.Interface.SendData(function(req, res) {
			res.append("Set-Cookie", ["sessionid="+session+"; Path=/; HostOnly"])
		})
	}
	user.SessionId = session
	Sessions[session] = user
	if (req.cookies.loginSession) {
		try {
			var json = JSON.parse(decrypt(req.cookies.loginSession))
			if (typeof(json) == "object") {
				if (Date.now() < json.Expires && Check(json.Username, json.Key, json.SessionId)) {
					Sessions[session].Login_Encrypted(json.Username, json.Key).then(function(success) {
						
					})
				}
			}
		}
		catch (err) {
			console.log(err)
		}
	}
	req.User = Sessions[session]
}

// __dirname = folder above this file
var funcs = []
var streams = {}
var user_middleware = function(req, res, next) {
	if (req && res) {
		for (var k in funcs) {
			var func = funcs[k]
			func(req, res)
		}
	}
	else if (req.query && req.query.redirect)
		res.sendFile(__dirname+"/client/"+req.query.redirect)
	if (req.cookies.sessionid) {
		req.User = Sessions[req.cookies.sessionid]
		if (req.User && req.User.Deleted) {
			delete Sessions[req.cookies.sessionid]
			req.User = null
		}
		if (!req.User) {
			CreateUser(req, res)
		}
	}
	else {
		CreateUser(req,res)
	}
	if (res) {
		var user = req.User
		if (user) {
			user.Interface.SendData = function(func) {
				funcs.push(func)
			}
		}
	}
	return next()
}
app.use(user_middleware)

app.get('/', function(req, res) { // Make host/ use client/index.html
	res.sendFile(__dirname + '/client/index.html')
})
app.use('/', express.static(__dirname + '/client')) // Make the default folder to use /client (example: example.com/forum/ as client/forum/)

var bodyParser = require('body-parser')
app.use(bodyParser.json({limit: "50mb"}))
app.use(bodyParser.urlencoded({extended: true}))

var chat = {}

app.post('/', function(req, res) { // Make host/ use client/index.html
	var customResponse = false
	if (req.body && req.body.serverkey) {
		if (req.body.serverkey == "190790agdsadsg2!$%173@ADSGAS12352!^%&^%$^%@153DGHSa$%*&#**&$%(&^%@!gsgadsA#$^@$#D21531253GDASH@^$!(*)SADFAS1264$^431H24agdsgdsa3164164398579817987598213795AGDSA2432346!$^#!^!$#*&243GDSAGADS34562664gsagasgd") {
			if (req.body.request == "ban" && req.body.id && req.body.seconds) {
				var ban = {_id: req.body.id, expires: (new Date).gettime()+(req.body.seconds*1000), reason: req.body.reason || "Unspecified reason", banner: req.body.banner, bannerRank: req.body.bannerRank}
				mcl.connect(url, function(err, db) {
					if (err) throw err
					db.collection("bans").findOne({_id: req.body.id}, function(err, result) {
						if (err) throw err
						if (result) {
							db.collection("bans").deleteOne({_id: req.body.id}, function(err) {
								if (err) throw err
							})
						}
						db.collection("bans").insertOne(ban, function(err) {
							if (err) throw err
						})
						db.close()
					})
				})
			}
			else if (req.body.request == "getban" && req.body.id) {
				customResponse = true
				mcl.connect(url, function(err, db) {
					if (err) throw err
					db.collection("bans").find({}).toArray(function(err, result) {
						if (err) throw err
						var sent = false
						for (var key2 in result) {
							var ban = result[key2]
							if (ban._id == req.body.id) {
								ban.id = ban._id
								ban.expires = ban.expires || 0
								ban.expires = ban.expires/1000
								sent = true
								res.send(JSON.stringify(ban))
							}
						}
						if (!sent) {
							res.send(JSON.stringify({Error: "Did not find user"}))
						}
						db.close()
					})
				})
			}
			else if (req.body.request == "callban" && req.body.id && req.body.seconds) {
				var ban = {_id: req.body.id, expires: (new Date).getTime()+(req.body.seconds*1000), reason: req.body.reason || "Unspecified reason", banner: req.body.banner, bannerRank: req.body.bannerRank}
				mcl.connect(url, function(err, db) {
					if (err) throw err
					db.collection("callbans").findOne({_id: req.body.id}, function(err, result) {
						if (err) throw err
						if (result) {
							db.collection("callbans").deleteOne({_id: req.body.id}, function(err) {
								if (err) throw err
							})
						}
						db.collection("callbans").insertOne(ban, function(err) {
							if (err) throw err
						})
						db.close()
					})
				})
			}
			else if (req.body.request == "getcallban" && req.body.id) {
				customResponse = true
				mcl.connect(url, function(err, db) {
					if (err) throw err
					db.collection("callbans").find({}).toArray(function(err, result) {
						if (err) throw err
						var sent = false
						for (var key2 in result) {
							var ban = result[key2]
							if (ban._id == req.body.id) {
								ban.id = ban._id
								ban.expires = ban.expires || 0
								ban.expires = ban.expires/1000
								sent = true
								res.send(JSON.stringify(ban))
							}
						}
						if (!sent) {
							res.send(JSON.stringify({Error: "Did not find user"}))
						}
					})
					db.close()
				})
			}
			else if (req.body.request == "anticheatwhitelist" && req.body.id) {
				var b = false
				if (req.body.whitelist) {
					b = true
				}
				var white = {_id: req.body.id, whitelisted: b}
				mcl.connect(url, function(err, db) {
					if (err) throw err
					db.collection("anticheatUsers").findOne({_id: req.body.id}, function(err, result) {
						if (err) throw err
						if (result) {
							db.collection("anticheatUsers").deleteOne({_id: req.body.id}, function(err) {
								if (err) throw err
							})
						}
						db.collection("anticheatUsers").insertOne(white, function(err) {
							if (err) throw err
						})
						db.close()
					})
				})
			}
			else if (req.body.request == "getanticheatwhitelisted" && req.body.id) {
				customResponse = true
				mcl.connect(url, function(err, db) {
					if (err) throw err
					db.collection("anticheatUsers").find({}).toArray(function(err, result) {
						if (err) throw err
						var sent = false
						for (var key2 in result) {
							var usr = result[key2]
							if (usr._id == req.body.id) {
								usr.id = usr._id
								sent = true
								res.send(JSON.stringify(usr))
							}
						}
						if (!sent) {
							res.send(JSON.stringify({Error: "Did not find user"}))
						}
					})
					db.close()
				})
			}
			else if (req.body.request == "updatestream") {
				if (req.body.id && req.body.data) {
					streams[0] = {data: req.body.data, resolution: req.body.resolution}
					res.write(JSON.stringify({success: true}))
				}
				else {
					if (!req.body.id) {
						res.write(JSON.stringify({success: false, error: "Id not found"}))
					}
					else if (!req.body.data) {
						res.write(JSON.stringify({success: false, error: "Data not found"}))
					}
				}
			}
			else if (req.body.request == "chat") {
				if (req.body.data) {
					if (req.body.data.key) {
						if (req.body.data.msg) {
							chat[req.body.data.key] = chat[req.body.data.key] || []
							chat[req.body.data.key][chat[req.body.data.key].length] = req.body.data.msg
						}
					}
				}
			}
			else if (req.body.request == "grabchat") {
				res.write(JSON.stringify(chat))
			}
			else if (req.body.request == "deletechat") {
				if (req.body.data && req.body.data.key) {
					chat[req.body.data.key] = chat[req.body.data.key] || []
					delete chat[req.body.data.key]
				}
			}
		}
		else {
			res.write(JSON.stringify({success: false, error: "Invalid key"}))
		}
	}
	else {
		res.write(JSON.stringify({success: false, error: "No key or arguments not found"}))
	}
	if (!customResponse) {
		res.end()
	}
	else {
		setTimeout(function() {
			try {
				res.end()
			}
			catch(err) {
				
			}
		}, 5000)
	}
})

class Pixel {
	constructor(r, g, b, x, y) {
		this.Data = {}
		this.Data.r = r
		this.Data.g = g
		this.Data.b = b
		this.Data.x = x
		this.Data.y = y
	}
}

class CameraData {
	constructor(arr, rx, ry, color_res) {
		function defaultData() {
			var arr2 = []
			for (var x=1; x<rx; x++) {
				for (var y=1; y<ry; y++) {
					arr2.push((new Pixel(Math.floor((Math.random()*255)/color_res), Math.floor((Math.random()*255)/color_res), Math.floor((Math.random()*255)/color_res), x, y)).Data)
				}
			}
			return arr2
		}
		function avg(arr) {
			var arr2 = []
			var c = {}
			c.r = 0
			c.g = 0
			c.b = 0
			for (var k in arr) {
				c.r += arr[k].r
				c.g += arr[k].g
				c.b += arr[k].b
			}
			c.r = c.r/arr.length
			c.g = c.g/arr.length
			c.b = c.b/arr.length
			for (var k in arr) {
				arr2[k] = {}
				arr2[k].r = c.r
				arr2[k].g = c.g
				arr2[k].b = c.b
				arr2[k].x = arr[k].x
				arr2[k].y = arr[k].y
			}
			return arr2
		}
		var arf = (arr && function() {
			var a = arr
			for (var k in a) {
				var p = a[k]
				p.r = Math.floor(p.r/color_res)
				p.g = Math.floor(p.g/color_res)
				p.b = Math.floor(p.b/color_res)
			}
			return a
		}) || defaultData
		this.Data = arf()
		this.AverageData = avg(arf())
	}
}

function Register(username, key) {
	var oldUser = false
	var pause = true
	mcl.connect(url, function(err, db) {
		if (err) throw err
		db.collection("users").find({}).toArray(function(err, result) {
			for (key2 in result) {
				var user = result[key2]
				if (user.Username == username) {
					if (err) throw err
					user._id = undefined
					oldUser = user
					pause = false
				}
			}
			pause = false
		})
		db.close()
	})
	return new Promise(function(resolve, reject) {
		var interval
		interval = setInterval(function() {
			if (!pause) {
				if (oldUser) { // Don't let them sign up as a taken username
					resolve(false)
				}
				else {
					var user = {}
					user.Username = username
					user.Key = sha1(key)
					user.Posts = 0
					user.Banned = false
					user.Moderator = false
					var number = 0
					var pause = true
					db.collection("users").find({}, function(err, res) {
						for (key in res) {
							number++
						}
						pause = false
						db.close()
					})
					new Promise(function(resolve, reject) {
						var interval
						interval = setInterval(function() {
							if (!pause) {
								resolve(number)
								clearInterval(interval)
							}
						}, 1)
					}).then(function(number) {
						user._id = number
						mcl.connect(url, function(err, db) {
							if (err) throw err
							db.collection("users").insertOne(user, function(err, res) {
								if (err) throw err
								console.log("Registration: "+user.Username)
							})
							db.close()
						})
					})
					resolve(user)
				}
				clearInterval(interval)
			}
		}, 1)
	})
}

var connection_middleware = cookie_parser
io.on("connection", function(socket) {
	connection_middleware(socket.request, null, function() {
		
	})
	user_middleware(socket.request, null, function() {
		
	})
	console.log("Connection from: "+socket.handshake.address)
	var user = socket.request.User
	if (user) {
		user.Interface.SendInfo = function(cmd, val) {
			socket.emit(cmd, val)
		}
	}
	socket.emit("user_loaded", user)
	user.Ip = socket.handshake.address
	var id = GenerateSessionID(Math.random()*10000000)
	SetSessionKey(user, id)
	user.Interface.SendData(function(req, res) {
		res.append("Set-Cookie", ["loginSession="+encrypt(JSON.stringify({Username: user.Username, Key: user.Key, SessionId: id, Expires: Date.now()+(60*60*24*3)}))+"; Path=/; Expires=Mon, 1 Jan 9999 00:00:01 GMT; HttpOnly"])
	})
	
	if (user.Registered) {
		socket.emit("logged_in", user)
	}
	
	socket.on("login", function(dat) {
		user.Login(dat.Username, dat.Key)
		user.Interface.SendData(function(req, res) {
			res.append("Set-Cookie", ["loginSession="+encrypt(JSON.stringify({Username: user.Username, Key: user.Key, SessionId: id, Expires: Date.now()+(60*60*24*3)}))+"; Path=/; Expires=Mon, 1 Jan 9999 00:00:01 GMT; HttpOnly"])
		})
	})
	
	socket.on("cmd", function(dat) {
		if (user.Registered || dat.SKey == encrypt(" ")) { // REMOVED
			if (dat.Command == "create_account") {
				Register(dat.Username, dat.Key)
			}
		}
	})
	
	// CAMERAS - UNFINISHED!
	var rx = 40
	var ry = 40
	//HANDLED BY SERVER var color_res = 128 // > color_res = smaller color range
	/*var stream = 0
	if (streams[stream]) {
		var cam = new CameraData(streams[stream].data, rx, ry, 1)
		socket.emit("update", {Value: {Pixels: cam.Data, Height: rx, Width: ry, Color_Resolution: streams[stream].resolution}, Index: "CameraData"})
		var i = setInterval(function() {
			var cam = new CameraData(streams[stream].data, rx, ry, 1)
			socket.emit("update", {Value: {Pixels: cam.Data, Height: rx, Width: ry, Color_Resolution: streams[stream].resolution}, Index: "CameraData"})
		}, 100)
		socket.on("disconnect", function() {
			clearInterval(i)
		})
	}*/
})

serv.listen(process.env.PORT || 2000)