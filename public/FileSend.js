const socket = io.connect('http://localhost:3000')

const title = document.getElementById('title')
const filename = document.getElementById('filename')
const file = document.getElementById('file')
const username = document.getElementById('username')
const send = document.getElementById('send')
const todos = document.getElementById('todos')

send.addEventListener('click', () => {
	socket.emit('file_send', {
		title: title.value,
		filename: filename.value,
		file: file.value,
		username: username.value
	})
})

socket.on('refresh', (data) => {
	todos.innerHTML = ""
})

socket.on('file_get', (item) => {
	if (item.completed) {
		todos.innerHTML += '<li class = "todo"><label><input type="checkbox" checked disabled><span>Name: "' + 
		item.title + '"   Creation time: ' + item.Date + 
		'</span><form action="/download" method = "POST"><button class="btn">Save</button><input type="hidden" name="file" value=' +
		item.file + '></form></label></li>'
	}
	else {
		todos.innerHTML += '<li class = "todo"><label><input type="checkbox" disabled><span>Name: "' + 
		item.title + '", File: ' + item.filename + '   Creation time: ' + item.Date + 
		'</span><button class="btn" disabled>Save</button></label></li>'
	}
})