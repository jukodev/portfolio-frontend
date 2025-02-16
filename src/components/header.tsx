import {
	Popover,
	PopoverTrigger,
	PopoverContent,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { getUsers } from "@/api/requests";
import { Separator } from "./ui/separator";

export const Header = () => {
	const users = useQuery({
		queryKey: ["users"],
		queryFn: getUsers,
	});
	return (
		<header className="bg-zinc-800 p-4 flex justify-between items-center">
			<div className="flex items-center space-x-4">
				<img
					src="/favicon.svg"
					alt="Portfolio"
					className="w-10 h-10 rounded-full"
				/>
				<h1 className="text-2xl">Portfolio</h1>
			</div>
			<Popover>
				<PopoverTrigger>
					<Avatar>
						<AvatarImage src="https://avatars.githubusercontent.com/u/75746485?v=4" />
						<AvatarFallback>Julian</AvatarFallback>
					</Avatar>
				</PopoverTrigger>
				<PopoverContent>
					{users.isLoading && <div>Loading...</div>}
					{users.isSuccess &&
						users.data.map((user, key) => (
							<>
								<div
									key={key}
									className="my-2 flex items-center space-x-5">
									<Avatar>
										<AvatarImage src={user.avatar} />
										<AvatarFallback>
											{user.name}
										</AvatarFallback>
									</Avatar>
									<span>{user.name}</span>
								</div>
								{key !== users.data.length - 1 && <Separator />}
							</>
						))}
				</PopoverContent>
			</Popover>
		</header>
	);
};
