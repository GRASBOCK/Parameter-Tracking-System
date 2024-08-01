<script lang="ts">
    import { get_client, type RepositoryAPIClient } from "$lib/client";
    import { isFulfilled, isRejected } from "$lib/type_guards";

    let client = get_client()
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString)
    const id = urlParams.get("id")
    if(!id){
        const msg = "Usage error: missing 'id' parameter"
        alert(msg)
        window.location.href = 'https://github.com/GRASBOCK/parameter-tracking-system';
        throw new Error(msg)
    }
    
    const parameter_history = client.list_file_commits(`parameters/${id}.json`).then(async commits => {
        const parameter_promises = commits.map(async c => {
            return await client.fetch_parameter(id, c.sha)
        })
        const results = await Promise.allSettled(parameter_promises);
        const fulfilledValues = results.filter(isFulfilled).map(p => p.value);
        const rejectedReasons = results.filter(isRejected).map(p => p.reason);
        if (rejectedReasons.length > 0) {
            throw new Error(`failed to get file: ${rejectedReasons[0]}`)
        }
        return fulfilledValues
    })
</script>

<p>
    <a href="/">Return</a>
</p>
{#await parameter_history}
    loading
{:then parameters}
<h1>{parameters[0].name}</h1>
<p>
    {parameters[0].description}
</p>
<table>
    {#each parameters.slice(0) as p}
        <tr>
            <td>{p.date}</td>
            <td>{p.value} </td>
            <td>{p.unit.short}</td>
            <td>{p.source}</td>
        </tr>
    {/each}
</table>
{:catch err}
    failure: {err}
{/await}

<style>
    td {
        padding-right: 10px;
    }
</style>