import { formatEuro, formatPercent } from "@/lib/utils";
import { Column, ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export type Stock = {
	name: string;
	invest: number;
	value: number;
	netValue: number;
	yield: number;
	yieldPercent: number;
	netYield: number;
	netYieldPercent: number;
	tax: number;
};

const sortButton = (column: Column<Stock, unknown>, title: string) => {
	return (
		<Button
			variant="ghost"
			onClick={() =>
				column.toggleSorting(column.getIsSorted() === "asc")
			}>
			{title}
			<ArrowUpDown className="ml-2 h-4 w-4" />
		</Button>
	);
};

export const stockColumns: ColumnDef<Stock>[] = [
	{
		accessorKey: "name",
		header: ({ column }) => sortButton(column, "Wertpapier"),
	},
	{
		accessorKey: "invest",
		header: ({ column }) => sortButton(column, "Investition (€)"),
		cell: ({ row }) => formatEuro(row.original.invest),
	},
	{
		accessorKey: "value",
		header: "Wert (€)",
		cell: ({ row }) => formatEuro(row.original.value),
	},
	{
		accessorKey: "netValue",
		header: "Netto-Wert (€)",
		cell: ({ row }) => formatEuro(row.original.netValue),
	},
	{
		accessorKey: "yield",
		header: "Rendite (€)",
		cell: ({ row }) => formatEuro(row.original.yield),
	},
	{
		accessorKey: "yieldPercent",
		header: "Rendite (%)",
		cell: ({ row }) => formatPercent(row.original.yieldPercent),
	},
	{
		accessorKey: "netYield",
		header: "Netto-Rendite (€)",
		cell: ({ row }) => formatEuro(row.original.netYield),
	},
	{
		accessorKey: "netYieldPercent",
		header: "Netto-Rendite (%)",
		cell: ({ row }) => formatPercent(row.original.netYieldPercent),
	},
	{
		accessorKey: "tax",
		header: "Steuer (€)",
		cell: ({ row }) => formatEuro(row.original.tax),
	},
];
