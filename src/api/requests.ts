import { Stock } from "@/types/stock";

export async function getUsers(): Promise<User[]> {
	await fetch("https://jsonplaceholder.typicode.com/users");

	return [
		{
			name: "Julian",
			avatar: "https://avatars.githubusercontent.com/u/75746485?v=4",
		},
		{
			name: "René",
			avatar: "https://avatars.githubusercontent.com/u/75746485?v=4",
		},
		{
			name: "Sabrina",
			avatar: "https://avatars.githubusercontent.com/u/75746485?v=4",
		},
	];
}

export async function getStocks(): Promise<Stock[]> {
	await fetch("https://jsonplaceholder.typicode.com/posts");

	return [
		{
			name: "Apple",
			invest: 1000,
			value: 1200,
			netValue: 1100,
			yield: 100,
			yieldPercent: 10,
			netYield: 100,
			netYieldPercent: 10,
			tax: 0,
		},
		{
			name: "Tesla",
			invest: 1000,
			value: 1200,
			netValue: 1100,
			yield: 100,
			yieldPercent: 10,
			netYield: 100,
			netYieldPercent: 10,
			tax: 0,
		},
		{
			name: "Amazon",
			invest: 1000,
			value: 1200,
			netValue: 1100,
			yield: 100,
			yieldPercent: 10,
			netYield: 100,
			netYieldPercent: 10,
			tax: 0,
		},
	];
}
