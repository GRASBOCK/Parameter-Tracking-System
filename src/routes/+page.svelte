<script lang="ts">
    import {
        type Data,
        type Parameter,
    } from "$lib/types";
    import MiniSearch from "minisearch";
    import { get_client, type RepositoryAPIClient } from "$lib/client";
    
    const client = get_client()
    const data_promise = client.load_data();
    data_promise.then(data => {
        all_params = Array.from(data.parameters.values());
        search.addAll(all_params);
        search_result = on_search(data, "");
    });
    
    let search: MiniSearch = new MiniSearch({
        fields: ["name"], // fields to index for full-text search
        storeFields: [
            "id",
            "name",
            "description",
            "unit_key",
            "unit",
            "records",
        ], // fields to return with search results
        searchOptions: {
            fuzzy: 1
        }
    });
    let search_query = "";
    let all_params: Parameter[] = [];
    let search_result: Parameter[] = [];
    const on_search = (data: Data, search_query: string) => {
        if (search_query == "") return all_params;
        if (search) {
            return search.search(search_query) as unknown as Parameter[];
        } else return all_params;
    };
</script>

<table>
    {#await data_promise}
        loading
    {:then data}
        Search: <input
            bind:value={search_query}
            on:input={() => {
                search_result = on_search(data, search_query);
            }}
        />
        <tr>
            <th style="padding-right: 10px">id</th>
            <th style="padding-right: 10px">name</th>
            <th>current value</th>
        </tr>
        {#each search_result as p}
            <tr class="parameter_row">
                <td style="padding-right: 10px"><a href="parameter?id={p.id}">{p.id}</a></td>
                <td style="padding-right: 10px"><a href="parameter?id={p.id}">{p.name}</a></td>
                <td
                    ><a href="parameter?id={p.id}">
                        {p.value}
                        {p.unit.short}
                    </a></td
                >
            </tr>
        {/each}
    {:catch err}
        failure: {err}
    {/await}
</table>

<style>
    .parameter_row:hover{
        background: red;
    }
    td a {
        display: block;
        color: black; 
        text-decoration: none !important;
    }
</style>
