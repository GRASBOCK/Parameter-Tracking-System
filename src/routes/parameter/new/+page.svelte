<script lang="ts">
    import { get_client, type RepositoryAPIClient } from "$lib/client";
    import Select from "$lib/Select.svelte";
    import { calculate_value, type Data } from "$lib/types";

    const client = get_client()
    let data_promise = client.load_data()
    data_promise.then(data => {
        unit_options = Array.from( data.units ).map(([key, value]) => ({ value: key, text: value.short}));
    })
    let unit_options: {text: string, value: string}[]= []

	let fn = ""
    let value = 0
    let unit = ""
</script>

<p>
    <a href="/">Return</a>
</p>
{#await data_promise}
    loading
{:then data}

<input type="text" bind:value={fn} on:input={() => value = calculate_value(data, fn) }/>

<p>
    {value} <Select options={unit_options} display_func={o => o.text} bind:value={unit}/>

</p>
{:catch err}
    failure: {err}
{/await}