<script lang="ts">
    import { isFulfilled, isRejected } from "$lib/type_guards";
    import { type Parameter } from "$lib/types";
    import { get_client } from "$lib/client";

    const client = get_client()    
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString)
    const param_ids = urlParams.getAll("param")
    const ref = urlParams.get("ref")
    if(!ref){
        throw Error("missing 'ref' parameter")
    }
    const parameters_promise = client.load_data().then(async data => {
        const param_promises = param_ids.map(id => {return {id: id, param: data.parameters.get(id)}}).filter(({param}) => {
            if(!param){
                console.error('Could not find parameter');
                return false;
            }
            else{
                return true;
            }
        }).map(async ({id, param}) => {
            const p = param as Parameter // since I used filter before
            const previous_param = await client.fetch_parameter(id, ref).then().catch(()=>null)
            return {current: p as Parameter, previous: previous_param}
        });
        const results = await Promise.allSettled(param_promises);
        const fulfilledValues = results.filter(isFulfilled).map(p => p.value);
        const rejectedReasons = results.filter(isRejected).map(p => p.reason);
        rejectedReasons.forEach(reason => console.log(`Promise rejected because: ${reason}`))
        return fulfilledValues
    })	
</script>

<table>
    {#await parameters_promise}
        loading
    {:then parameters}
        <tr>
            <th style="padding-right: 10px">id</th>
            <th style="padding-right: 10px">name</th>
            <th>value</th>
        </tr>
        {#each parameters as {current, previous}}
            <tr>
                <td style="padding-right: 10px">{current.id}</td>
                <td style="padding-right: 10px">{current.name}</td>
                <td>
                    {#if previous}
                        {previous.value} {previous.unit.short} ➡️ 
                    {/if}
                    {current.value} {current.unit.short} 
                </td>
            </tr>
        {/each}
    {:catch err}
        failure: {err}
    {/await}
</table>
