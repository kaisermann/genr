<script>
	import { onMount } from 'svelte';

	async function authorize() {
		// 1. Check we didn't get called back by Spotify with an error...
		const callbackParams = new URLSearchParams(location.search);
		if (callbackParams.has('error')) {
			alert(callbackParams.get('error'));
			return;
		}

		// 3. Start the OAuth implicit grant flow
		const state = Math.random().toString().slice(2);
		localStorage.setItem('spotify:state', state);

		const search = {
			client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
			response_type: 'token',
			redirect_uri: `${location.origin}/spotify`,
			state,
			scope: 'user-read-playback-state'
		};
		const searchParams = new URLSearchParams(search).toString();

		console.log(`${location.origin}/spotify`);
		console.log(`https://accounts.spotify.com/authorize?${searchParams}`);
		// location.assign(`https://accounts.spotify.com/authorize?${searchParams}`);
	}
	// https://accounts.spotify.com/authorize?client_id=4c6bb45fef9b41458ea9935f52e98939
	// &response_type=token
	// &redirect_uri=http%3A%2F%2F127.0.0.1%3A5173%2F
	// &state=5640791094027946
	// &scope=user-read-playback-state

	function handleClick() {
		authorize();
	}

	onMount(() => {
		const callbackData = new URLSearchParams(location.hash.replace('#', '?'));
        console.log(location.hash.replace('#', '?'))
		console.log(callbackData, callbackData.has('access_token'));
		if (callbackData.has('access_token')) {
			const state = callbackData.get('state');
			const storedState = localStorage.getItem('spotify:state');
			if (state !== storedState) {
				alert("You're not you!");
			}

			const token = callbackData.get('access_token');
			console.log(token);
			localStorage.removeItem('spotify:state');
		}
	});
</script>

<button on:click={handleClick}> Do the thing</button>
