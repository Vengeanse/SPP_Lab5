const test = document.getElementById('graph')

//test.addEventListener('click', () => {
//
//})


fetch ('http://localhost:3000/', {
method: 'POST',
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
	query: `
		query {
			message
		}
		`
	})	
})
.then(res => res.json())
.then(data => {
	console.log(data.data)
})

