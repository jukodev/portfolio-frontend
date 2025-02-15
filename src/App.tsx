import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "./components/ui/popover";
import { ThemeProvider } from "./components/ui/theme-provider";

function App() {
	return (
		<ThemeProvider>
			<Popover>
				<PopoverTrigger>Open</PopoverTrigger>
				<PopoverContent>
					Place content for the popover here.
				</PopoverContent>
			</Popover>
		</ThemeProvider>
	);
}

export default App;
