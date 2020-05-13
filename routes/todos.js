const {Router} = require('express')
const router = Router()
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const multer = require('multer')
const upload = multer({dest:"uploads"})
const fs = require('fs')

router.use(cookieParser())

var users = []

var todos = "_"

const ExpiryTimeToken = 3600

router.get('/', (req, res) => {
	if (statusCheck(req) == 200) {
		if (verifyToken(req) == 200) {
			if (todos == "_") {
				fileLoaded = false
				res.status(statusCheck(req)).render('indexNew', {
					title: 'Todo list',
					isIndex: true,
					isLogin: true,
					Name: req.cookies.name,
					data: todos,
					fileLoaded: fileLoaded
				})
			} 
			else {
				fileLoaded = true
				res.status(statusCheck(req)).render('indexNew', {
					title: 'Todo list',
					isIndex: true,
					isLogin: true,
					Name: req.cookies.name,
					data: todos,
					title: todos.title,
					filename: todos.filename,
					file: todos.file,
					username: todos.username,
					fileLoaded: fileLoaded
				})
				todos = "_"
			}
		}
		else {
			res.status(statusCheck(req)).render('index', {
				title: 'Todo list',
				isIndex: true
			})
		}
	}
	else {
		redirectToError(res, statusCheck(req))
	}
})

router.get('/login', (req, res) => {
	if (statusCheck(req) == 200) {
		res.status(statusCheck(req)).render('login', {
			title: 'Login',
			isOnLogin: true
		})
	}
	else {
		redirectToError(res, statusCheck(req))
	}
})

router.get('/signup', (req, res) => {
	if (statusCheck(req) == 200) {
		res.status(statusCheck(req)).render('signup', {
			title: 'SignUp',
			isOnLogin: true
		})
	}
	else {
		redirectToError(res, statusCheck(req))
	}
})

router.get('/socket', (req, res) => {
	if (statusCheck(req) == 200) {
		res.status(statusCheck(req)).render('socket', {
			title: 'Socket'
		})
	}
	else {
		redirectToError(res, statusCheck(req))
	}
})

router.get('/test', (req, res) => {
	if (statusCheck(req) == 200) {
		res.status(statusCheck(req)).render('indexNew', {
			title: 'Test',
			isLogin: true,
			Name: req.cookies.name
		})
	}
	else {
		redirectToError(res, statusCheck(req))
	}
})

router.get('*', (req, res) => {
    redirectToError(res, 404)
})

router.post('/create', upload.single('Ufile'), async (req, res) => {
	if (statusCheck(req) == 200) {
		if (verifyToken(req) == 200) {
			if (req.body.data == "_") {
				todos = {
					title: req.body.title,
					file: req.file.path,
					filename: req.file.originalname,
					username: req.cookies.name
				}
				res.redirect('/')
			}
		}
		else {
			redirectToError(res, verifyToken(req))
		}
	}
	else {
		redirectToError(res, statusCheck(req))
	}
})

router.post('/change', async (req, res) => {
	console.log("main page change post", todos, req.body.data.title)
	if (statusCheck(req) == 200) {
		if (verifyToken(req) == 200) {
			res.redirect('/')
		}
		else {
			redirectToError(res, verifyToken(req))
		}
	}
	else {
		redirectToError(res, statusCheck(req))
	}
})

router.post('/refresh', async (req, res) => {
	if (statusCheck(req) == 200) {
		update()
		res.redirect('/')
	}
	else {
		redirectToError(res, statusCheck(req))
	}
})

router.post('/download', async (req, res) => {
	if (fileCheck(req) == 200) {
		if (verifyToken(req) == 200) {
			res.status(fileCheck(req)).download(req.body.file)
		}
		else {
			redirectToError(res, verifyToken(req))
		}
	}
	else {
		redirectToError(res, fileCheck(req))
	}
})

router.post('/login', (req, res) => {
	if (statusCheck(req) == 200) {
		if (verification(req.body.name, req.body.password)) {
			let token = jwt.sign({
				name: req.body.name,
				passHesh: req.body.password
			}, 'secretkey', { expiresIn: ExpiryTimeToken })
			res.setHeader('Set-Cookie', [`token=${token}; HttpOnly`, `name=${req.body.name}; HttpOnly`])
			res.redirect('/')
		} 
		else {
			if (statusCheck(req) == 200) {
				res.status(statusCheck(req)).render('login', {
					title: 'Login',
					isOnLogin: true,
					isReject: true
				})
			}
			else {
				res.status(statusCheck(req)).render('error', {
			    	error: statusCheck(req)
			    })
			}
		}
	}
	else {
		redirectToError(res, statusCheck(req))
	}
})

router.post('/signup', (req, res) => {
	if (statusCheck(req) == 200) {
		users.push({
			name: req.body.name,
			passHesh: req.body.password
		})
		let token = jwt.sign({
			name: req.body.name,
			passHesh: req.body.password
		}, 'secretkey', { expiresIn: ExpiryTimeToken })
		res.setHeader('Set-Cookie', [`token=${token}; HttpOnly`, `name=${req.body.name}; HttpOnly`])
		res.redirect('/')
	}
	else {
		redirectToError(res, statusCheck(req))
	}
})

router.post('/logout', (req, res) => {
	if (statusCheck(req) == 200) {
		res.cookie("token", req.cookies.token)
		res.cookie("name", req.cookies.name)
	    res.clearCookie("token")
	    res.clearCookie("name")
	    res.redirect('/')
	}
	else {
		redirectToError(res, statusCheck(req))
	}
})



function verification(name, passHesh) {
	let result = false
	users.forEach((item, i, arr) => {
		if (item.name == name && item.passHesh == passHesh) {
			result = true
			return
		}
	})
	return result
}

function verifyToken(req) {
	let answer
	jwt.verify(req.cookies.token, 'secretkey', (err, user) => {
		if(err) {
			answer = '401'
		} 
		else {
			answer = '200'
		}
	})
	return answer
}

function statusCheck(req) {
	if (!req.body) {
		return '400'
	}
	else {
		return '200'
	}
}

function fileCheck(req) {
	try {
		if (fs.existsSync(req.body.file)) {
	    	return '200'
	  	}
	  	else {
	  		return '404'
	  	}
	} catch(err) {
	  	return '500'
	}
}

function redirectToError (res, err) {
	if (err == 401) {
		res.status(err).render('error', {
		   	error: err,
		   	BadToken: true
		})
	}
	else {
		res.status(err).render('error', {
		   	error: err
		})
	}
}


module.exports = router