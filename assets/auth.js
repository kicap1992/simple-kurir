// check local storage
if (!localStorage.getItem('user')) {
	// redirect to login page
	window.location.href = "/";
}

const path = window.location.pathname;

const segments = path.split('/');      // ["", "kurir", "data"]
const target = segments[1];  
// console.log(target);

if (target != 'kurir' && target != 'user') {
	localStorage.removeItem('user');
	localStorage.removeItem('role');
	// redirect to login page
	window.location.href = "/";
}


fetch(target == 'kurir' ? '/kurir/check' : '/user/check', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json'
	},
	body: JSON.stringify(JSON.parse(localStorage.getItem('user')))

})
	.then(res => {
		if (res.status >= 400) {
			// remove local storage
			localStorage.removeItem('user');
			localStorage.removeItem('role');
			// redirect to login page
			window.location.href = "/";
		}

		// console.log(res);
		return res.json();
	})
	.then(data => {
		// console.log(data);
		// document.getElementById('h5-title').innerHTML = data.username;


	})
	.catch(err => {
		// console.log(err);
		// remove local storage
		localStorage.removeItem('user');
		localStorage.removeItem('role');
		// redirect to login page
		window.location.href = "/";

	});