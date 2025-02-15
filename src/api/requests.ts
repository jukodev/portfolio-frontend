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
