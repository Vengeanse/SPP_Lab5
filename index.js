const express = require('express')
const path = require('path')
const fs = require('fs')
const exphbs = require('express-handlebars')
const todoRoutes = require('./routes/todos')
const socket = require('socket.io')
const express_graphql = require('express-graphql')
const {buildSchema} = require('graphql')

const PORT =  3000
const ExpiryTimeFile = 300 * 1000

const app = express()
const hbs = exphbs.create({
	defaultLayout: 'main',
	extname: 'hbs'
})

var todos = []

const schema = buildSchema(`
	type Query {
		alltodos: [mtodos]
	}
	type mtodos {
		completed: Boolean
		title: String
		Date: String
		nfile: String
	}
`)

var gettodos = () => {
	return todos
}

const root = {
	alltodos: gettodos
}

app.use('/graphql', express_graphql({
	schema: schema, 
	rootValue: root,
	graphiql: true 
}))


app.engine('hbs', hbs.engine)
app.set('view engine', 'hbs')
app.set('views', 'views')

app.use(express.urlencoded({extended: true}))
app.use(express.static(path.join(__dirname, 'public')))

app.use(todoRoutes)

async function start() {
	try {
		const server = app.listen(PORT, () => {
			console.log(`Server has been started on port ${PORT}...`)
		})
		const connection = socket(server)
		connection.on('connection', (socket) => {
			console.log('connection set ', socket.id)

			socket.on('file_send', (data) => {
				todos.push({
					title: data.title,
					file: data.file,
					nfile: "_",
					filename: data.filename,
					username: data.username,
					completed: false,
					CreateDate: new Date(),
					Date: String(new Date().getHours() + ":" + new Date().getMinutes())
				})
				update(socket)
			})
		})
	} catch (e) {
		console.log(e)
	}
}

start()

async function update(socket) {
	//console.log('Refresh call')
	let old_todos = []
	socket.emit('refresh')
	todos.forEach((item, i, arr) => {
	//console.log('Sugesting element ', i)
		if (item.completed){
			if (dateCheck(item.CreateDate)) {
				old_todos.push({
					i: i
				})
			}
			else {
				//console.log('insert...', i)
				socket.emit('file_get', {
					completed: item.completed,
					title: item.title,
					Date: item.Date,
					filename: item.filename,
					file: item.nfile
				})
			}
		} 
		else {
			//console.log('insert...', i)
			socket.emit('file_get', {
				completed: item.completed,
				title: item.title,
				Date: item.Date,
				filename: item.filename,
				file: item.nfile
			})
			fs.readFile(item.file, "utf8", (err, data) => {
                if (err) console.log(err) 
	            fs.writeFile(item.file + '.txt', data.toUpperCase(), (err) => {
				    if (err) console.log(err) 
				    else {
						item.nfile = item.file + '.txt'
						item.completed = true
						setTimeout(update, 1000, socket)
						setTimeout(update, ExpiryTimeFile, socket)
					}
				})
			})
		}
	})
	old_todos.forEach((item, i, arr) => {
		//console.log('deleting...', item.i)
		todos.splice(item.i, 1)
	})
}

function dateCheck(CreateDate) {
	CreateDate = String(CreateDate)
	CreateDate = CreateDate.split(" ")[4]
	let hour = parseInt(CreateDate.split(":")[0], 10)
	let minute = parseInt(CreateDate.split(":")[1], 10)
	let second = parseInt(CreateDate.split(":")[2], 10)
	second = hour *60 *60 + minute *60 + second
	let delay = ExpiryTimeFile / 1000
	let new_second = new Date().getHours() * 60 * 60 + new Date().getMinutes() * 60 + new Date().getSeconds()
	if (second + delay > new_second) {
		return false
	} 
	else {
		return true
	}
}
