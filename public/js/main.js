const userList = document.querySelector('#user-list');
const userForm = document.querySelector('#user-form');

const escapeHtml = (value) => String(value)
	.replaceAll('&', '&amp;')
	.replaceAll('<', '&lt;')
	.replaceAll('>', '&gt;')
	.replaceAll('"', '&quot;')
	.replaceAll("'", '&#039;');

const renderUsers = (users) => {
	if (!users.length) {
		userList.innerHTML = '<p class="alert alert-light border mt-3">Todavía no hay usuarios. Agrega el primero desde el formulario.</p>';
		return;
	}

	userList.innerHTML = users.map((user) => {
		const firstName = escapeHtml(user.nombre);
		const lastName = escapeHtml(user.apellido);
		return `<article class="d-flex align-items-center gap-3 py-3 border-bottom">
			<div class="avatar">${firstName.charAt(0)}${lastName.charAt(0)}</div>
			<div class="flex-grow-1"><h3 class="h6 mb-1">${firstName} ${lastName}</h3><p class="small mb-0">${escapeHtml(user.lugar)} · $${escapeHtml(user.salario)} · ID: ${escapeHtml(user.id)}</p></div>
			<div class="d-flex gap-2"><a class="btn btn-sm btn-outline-secondary" href="/usuarios?editar=${user.id}">Editar</a><form method="POST" data-user-id="${user.id}"><button class="btn btn-sm btn-outline-danger" type="submit">Eliminar</button></form></div>
		</article>`;
	}).join('');
};

const loadUsers = async () => {
	const response = await fetch('/api/usuarios', { headers: { Accept: 'application/json' } });
	if (!response.ok) throw new Error('No fue posible cargar los usuarios.');
	const data = await response.json();
	renderUsers(data.usuarios);
};

if (userList && userForm) {
	loadUsers().catch((error) => {
		userList.innerHTML = `<p class="alert alert-warning mt-3">${escapeHtml(error.message)}</p>`;
	});

	userForm.addEventListener('submit', async (event) => {
		event.preventDefault();
		const formData = new FormData(userForm);
		const userId = userForm.dataset.userId;
		const response = await fetch(userId ? `/api/usuarios/${userId}` : '/api/usuarios', {
			method: userId ? 'PUT' : 'POST',
			headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
			body: JSON.stringify(Object.fromEntries(formData))
		});
		if (response.ok) window.location.href = '/usuarios';
		else userList.insertAdjacentHTML('beforebegin', `<p class="alert alert-warning">${escapeHtml((await response.json()).error)}</p>`);
	});

	userList.addEventListener('submit', async (event) => {
		const form = event.target;
		if (!form.dataset.userId) return;
		event.preventDefault();
		const response = await fetch(`/api/usuarios/${form.dataset.userId}`, { method: 'DELETE', headers: { Accept: 'application/json' } });
		if (response.ok) await loadUsers();
	});
}
