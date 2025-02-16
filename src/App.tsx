import { Header } from "@/components/header";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { useQuery } from "@tanstack/react-query";
import { getStocks } from "./api/requests";
import { DataTable } from "./components/DataTable";
import { stockColumns } from "./types/stock";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

function App() {
	const stocks = useQuery({
		queryKey: ["stocks"],
		queryFn: getStocks,
	});
	return (
		<ThemeProvider>
			<Header />

			<Card className="mt-8 w-1/2 mx-auto">
				<CardHeader>
					<CardTitle>Wertpapiere</CardTitle>
					<CardDescription>
						Auflistung aller Wertpapiere und Brutto/Netto Werten
					</CardDescription>
				</CardHeader>
				<CardContent>
					{stocks.isSuccess && (
						<DataTable columns={stockColumns} data={stocks.data} />
					)}
				</CardContent>
			</Card>
		</ThemeProvider>
	);
}

export default App;
