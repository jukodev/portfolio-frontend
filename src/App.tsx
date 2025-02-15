import { Header } from "@/components/header";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient();
function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider>
				<Header />
			</ThemeProvider>
		</QueryClientProvider>
	);
}

export default App;
