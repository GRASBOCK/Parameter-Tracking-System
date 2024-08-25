import { base } from '$app/paths';
import { GithubAPIClient } from './github';
import type { Commit, Data, Parameter } from './types';

export interface RepositoryAPIClient{
    load_data(): Promise<Data>
    list_file_commits(path: string): Promise<Commit[]>
    fetch_parameter(id: string, commit_ref?: string): Promise<Parameter>
}

class ClientInitFailureError extends Error{
    redirect_url: string
    constructor(msg: string, redirect_url: string) {
        super(msg)
        this.redirect_url = redirect_url;
    }
}

export function target_repository(): {host: string, owner: string, name: string}{
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString)
    let repo_url = urlParams.get("repo_url")
    if(!repo_url){
        repo_url = localStorage.getItem("current_repo_url")
        if(!repo_url){
            throw new Error("Usage error: repo_url is not defined")
        }
    }
    const regex = /github\.com\/(?<repoowner>\w+)\/(?<reponame>[\w-]+)/.exec(repo_url)?.groups
    if(!regex){
        throw new Error("Fatal error: Failed to execute regex")
    }
    const {repoowner, reponame} = regex
    if(!repoowner){
        throw new Error("Usage error: was not able to parse repoowner. Ensure repo_url is correct")
    }
    if(!reponame){
        throw new Error("Usage error: was not able to parse reponame. Ensure repo_url is correct")
    }
    localStorage.setItem("current_repo_url", repo_url)
    return {host: "github", owner: repoowner, name: reponame}
}

export function repo_access_token_key(host: string, owner: string, name: string): string{
    return `access-token_${host}_${owner}_${name}`
}

export function get_client(): RepositoryAPIClient{
    
    try{
        const {host, owner, name} = target_repository()
        const access_token_key = repo_access_token_key(host, owner, name)
        const access_token = localStorage.getItem(access_token_key)
        if(access_token){
            return new GithubAPIClient(access_token, owner, name)
        }else{
            window.location.href = `${base}/github`;
            throw new ClientInitFailureError("missing access token; redirecting to access token insertion page", `${base}/github`)
        }
    }catch (error){
        if (error instanceof ClientInitFailureError) {
            window.location.href = error.redirect_url
            throw error
        } else {
            alert(error)
            window.location.href = 'https://github.com/GRASBOCK/parameter-tracking-system'
            throw error
        }
    }        
}