import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import axios from "axios";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const axiosClient = axios.create({
	baseURL: "https://api.mobula.de",
	headers: { "Content-Type": "application/json" },
});

export function formatEuro(value: number) {
	return new Intl.NumberFormat("de-DE", {
		style: "currency",
		currency: "EUR",
	}).format(value);
}

export function formatPercent(value: number) {
	return new Intl.NumberFormat("de-DE", {
		style: "percent",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
}
