import { describe, it, expect } from 'vitest';
import { calculate_value, type Data } from "$lib/types";
import { fetch_parameter, load_data, fetch_parameter_ids } from '$lib/github';
import { Octokit } from 'octokit';
import { ACCESS_TOKEN } from '$env/static/private';
import {
	PUBLIC_TEST_REPO_OWNER,
	PUBLIC_TEST_REPO_NAME
} from '$env/static/public';

const octokit = new Octokit({
	auth: ACCESS_TOKEN
})

describe('function evaluation', () => {
	it('(a + b)/2', () => {
		const data = { parameters: new Map([["a", { value: 10 }], ["b", { value: 30 }]]) } as Data
		expect(calculate_value(data, "(a + b)/2")).toBe(20);
	});
	it('(apple + pear)/2', () => {
		const data = { parameters: new Map([["apple", { value: 10 }], ["pear", { value: 30 }]]) } as Data
		expect(calculate_value(data, "(apple + pear)/2")).toBe(20);
	});
	it('some/2 + test_123_awd + 14Parameter4*2', () => {
		const data = { parameters: new Map([["some", { value: 20 }], ["test_123_awd", { value: 30 }], ["14Parameter4", { value: 10 }]]) } as Data
		expect(calculate_value(data, "some/2 + test_123_awd + 14Parameter4*2")).toBe(60);
	});
});

it('load data', async () => {
	console.log(await load_data(octokit, PUBLIC_TEST_REPO_OWNER, PUBLIC_TEST_REPO_NAME))
});

it('fetch parameter ids', async () => {
	console.log(await fetch_parameter_ids(octokit, PUBLIC_TEST_REPO_OWNER, PUBLIC_TEST_REPO_NAME))
});

it('fetch parameter', async () => {
	console.log(await fetch_parameter(octokit, PUBLIC_TEST_REPO_OWNER, PUBLIC_TEST_REPO_NAME, "apple_calories"))
});

