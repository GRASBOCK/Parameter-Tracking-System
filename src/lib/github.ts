import { Octokit, App } from "octokit";
import type { Commit, Data, Parameter, Unit } from "./types";
import { isFulfilled, isRejected } from "./type_guards";

async function fetch_ids(octokit: Octokit, owner: string, repo: string, path: string): Promise<string[]> {
    return octokit.request(`GET /repos/${owner}/${repo}/contents/${path}`, {
        path: "parameters",
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    })
        .then(({ data }) => {
            if (Array.isArray(data)) {
                return data.map((e) => e.name.replace(".json", ""))
            }
            throw new Error("I don't know the datatype of the data")
        })
}

export async function fetch_parameter_ids(octokit: Octokit, owner: string, repo: string): Promise<string[]> {
    return fetch_ids(octokit, owner, repo, "parameters")
}

export async function fetch_unit_ids(octokit: Octokit, owner: string, repo: string): Promise<string[]> {
    return fetch_ids(octokit, owner, repo, "units")
}

async function fetch_json(octokit: Octokit, owner: string, repo: string, path: string, commit_ref?: string): Promise<any> {
    return octokit.rest.repos.getContent({
        owner: owner,
        repo: repo,
        path: path,
        ref: commit_ref,
        headers: {
            "Accept": "application/vnd.github.v3.raw"
        },
    })
        .then(({ data }) => {
            return JSON.parse(data as any)
        })
}

export async function fetch_unit(octokit: Octokit, owner: string, repo: string, id: string, commit_ref?: string): Promise<Unit> {
    return fetch_json(octokit, owner, repo, `units/${id}.json`, commit_ref).then(obj => { obj["id"] = id; return obj })
}

export async function fetch_parameter(octokit: Octokit, owner: string, repo: string, id: string, commit_ref?: string): Promise<Parameter> {
    return fetch_json(octokit, owner, repo, `parameters/${id}.json`, commit_ref).then(async obj => {
        obj["id"] = id;
        const param = obj as Parameter
        param.unit = await fetch_unit(octokit, owner, repo, param.unit_id, commit_ref)
        return param
    })
}

export async function load_data(octokit: Octokit, owner: string, repo: string): Promise<Data> {
    const parameters_promise = fetch_parameter_ids(octokit, owner, repo).then(async (ids) => {
        const parameter_promises = ids.map(async (id) => fetch_parameter(octokit, owner, repo, id))
        const results = await Promise.allSettled(parameter_promises);
        const fulfilledValues = results.filter(isFulfilled).map(p => p.value);
        const rejectedReasons = results.filter(isRejected).map(p => p.reason);
        if (rejectedReasons.length > 0) {
            throw new Error(`failed to get file: ${rejectedReasons[0]}`)
        }
        return fulfilledValues
    })
    const units = new Map<string, Unit>()
    await fetch_unit_ids(octokit, owner, repo).then(async (ids) => {
        const parameter_promises = ids.map(async (id) => fetch_unit(octokit, owner, repo, id))
        const results = await Promise.allSettled(parameter_promises);
        const fulfilledValues = results.filter(isFulfilled).map(p => p.value);
        const rejectedReasons = results.filter(isRejected).map(p => p.reason);
        if (rejectedReasons.length > 0) {
            throw new Error(`failed to get file: ${rejectedReasons[0]}`)
        }
        return fulfilledValues
    }).then((fetched_units) => {
        fetched_units.map(u => {
            units.set(u.id, u)
        })
    })
    const parameters = new Map<string, Parameter>()
    await parameters_promise.then((fetched_parameters) => {
        fetched_parameters.map(p => {
            const unit = units.get(p.unit_id)
            if (!unit) {
                throw new Error('Unit with id ' + p.unit_id + ' does not exist');
            }
            p.unit = unit
            parameters.set(p.id, p)
        })
    })
    return { parameters: parameters, units: units }
}

export async function list_file_commits(octokit: Octokit, owner: string, repo: string, path: string): Promise<Commit[]> {
    return octokit.rest.repos.listCommits({ owner, repo, path })
        .then(({ data }) => data.map(c => {
            return {date: c.commit.author?.date, sha: c.sha}
        }))
}

export class GithubAPIClient{
    octokit: Octokit
    repo_owner: string
    repo_name: string
    constructor(access_token: string, repo_owner: string, repo_name: string){
        this.octokit = new Octokit({
            auth: access_token
        })
        this.repo_owner = repo_owner
        this.repo_name = repo_name
    }
    
    load_data(): Promise<Data>{
        return load_data(this.octokit, this.repo_owner, this.repo_name)
    }

    list_file_commits(path: string): Promise<Commit[]>{
        return list_file_commits(this.octokit, this.repo_owner, this.repo_name, path)
    }

    fetch_parameter(id: string, commit_ref?: string): Promise<Parameter>{
        return fetch_parameter(this.octokit, this.repo_owner, this.repo_name, id, commit_ref)
    }
}

