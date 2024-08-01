<script lang="ts">
    import { repo_access_token_key, target_repository } from "$lib/client";

    let access_token = ""
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString)
    const redirect_url = urlParams.get("redirect_url")
    function on_submit(){
        const {host, owner, name} = target_repository()
        const access_token_key = repo_access_token_key(host, owner, name)
        localStorage.setItem(access_token_key, access_token)
        window.location.href = redirect_url ? redirect_url : "/";
    }
</script>


<form on:submit|preventDefault={on_submit}>
	<input bind:value={access_token}>
	<button type="submit">
		Use access token
	</button>
</form>