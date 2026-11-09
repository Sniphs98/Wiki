import type { Component } from 'svelte';
import BookOpen from '@lucide/svelte/icons/book-open';
import Notebook from '@lucide/svelte/icons/notebook';
import ClipboardList from '@lucide/svelte/icons/clipboard-list';
import ListChecks from '@lucide/svelte/icons/list-checks';
import FileText from '@lucide/svelte/icons/file-text';
import ScrollText from '@lucide/svelte/icons/scroll-text';
import Newspaper from '@lucide/svelte/icons/newspaper';
import Lightbulb from '@lucide/svelte/icons/lightbulb';
import Info from '@lucide/svelte/icons/info';
import CircleHelp from '@lucide/svelte/icons/circle-help';
import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
import Star from '@lucide/svelte/icons/star';
import Heart from '@lucide/svelte/icons/heart';
import Flag from '@lucide/svelte/icons/flag';
import Bookmark from '@lucide/svelte/icons/bookmark';
import Rocket from '@lucide/svelte/icons/rocket';
import Target from '@lucide/svelte/icons/target';
import Trophy from '@lucide/svelte/icons/trophy';
import Sparkles from '@lucide/svelte/icons/sparkles';
import Zap from '@lucide/svelte/icons/zap';
import House from '@lucide/svelte/icons/house';
import Building2 from '@lucide/svelte/icons/building-2';
import Briefcase from '@lucide/svelte/icons/briefcase';
import Users from '@lucide/svelte/icons/users';
import User from '@lucide/svelte/icons/user';
import UserPlus from '@lucide/svelte/icons/user-plus';
import GraduationCap from '@lucide/svelte/icons/graduation-cap';
import Handshake from '@lucide/svelte/icons/handshake';
import Calendar from '@lucide/svelte/icons/calendar';
import Clock from '@lucide/svelte/icons/clock';
import Mail from '@lucide/svelte/icons/mail';
import MessageSquare from '@lucide/svelte/icons/message-square';
import Phone from '@lucide/svelte/icons/phone';
import Megaphone from '@lucide/svelte/icons/megaphone';
import Euro from '@lucide/svelte/icons/euro';
import Wallet from '@lucide/svelte/icons/wallet';
import ShoppingCart from '@lucide/svelte/icons/shopping-cart';
import Truck from '@lucide/svelte/icons/truck';
import Package from '@lucide/svelte/icons/package';
import ChartColumn from '@lucide/svelte/icons/chart-column';
import Scale from '@lucide/svelte/icons/scale';
import ShieldCheck from '@lucide/svelte/icons/shield-check';
import Lock from '@lucide/svelte/icons/lock';
import KeyRound from '@lucide/svelte/icons/key-round';
import Settings from '@lucide/svelte/icons/settings';
import Wrench from '@lucide/svelte/icons/wrench';
import Hammer from '@lucide/svelte/icons/hammer';
import Code from '@lucide/svelte/icons/code';
import Terminal from '@lucide/svelte/icons/terminal';
import Bug from '@lucide/svelte/icons/bug';
import GitBranch from '@lucide/svelte/icons/git-branch';
import Database from '@lucide/svelte/icons/database';
import Server from '@lucide/svelte/icons/server';
import Cloud from '@lucide/svelte/icons/cloud';
import Globe from '@lucide/svelte/icons/globe';
import Wifi from '@lucide/svelte/icons/wifi';
import Monitor from '@lucide/svelte/icons/monitor';
import Laptop from '@lucide/svelte/icons/laptop';
import Smartphone from '@lucide/svelte/icons/smartphone';
import Printer from '@lucide/svelte/icons/printer';
import Cpu from '@lucide/svelte/icons/cpu';
import Image from '@lucide/svelte/icons/image';
import Camera from '@lucide/svelte/icons/camera';
import Palette from '@lucide/svelte/icons/palette';
import Music from '@lucide/svelte/icons/music';
import Video from '@lucide/svelte/icons/video';
import MapPin from '@lucide/svelte/icons/map-pin';
import Car from '@lucide/svelte/icons/car';
import Plane from '@lucide/svelte/icons/plane';
import Leaf from '@lucide/svelte/icons/leaf';
import Sun from '@lucide/svelte/icons/sun';
import Coffee from '@lucide/svelte/icons/coffee';
import Utensils from '@lucide/svelte/icons/utensils';
import HeartPulse from '@lucide/svelte/icons/heart-pulse';
import Archive from '@lucide/svelte/icons/archive';
import Trash2 from '@lucide/svelte/icons/trash-2';

export interface PageIcon {
	/** Stored in page.icon. */
	name: string;
	/** Shown as the tooltip, and searched together with the keywords. */
	label: string;
	keywords: string;
	component: Component;
}

/**
 * The icons a page can have, from Lucide like the rest of the app's icons:
 * in one line weight, and in the text's color in light and dark mode.
 * A handful picked for wiki topics, so the bundle stays small.
 */
export const PAGE_ICONS: PageIcon[] = [
	{
		name: 'book-open',
		label: 'Buch',
		keywords: 'anleitung handbuch doku lesen',
		component: BookOpen
	},
	{ name: 'notebook', label: 'Notizbuch', keywords: 'notizen', component: Notebook },
	{
		name: 'clipboard-list',
		label: 'Klemmbrett',
		keywords: 'liste aufgaben prozess',
		component: ClipboardList
	},
	{
		name: 'list-checks',
		label: 'Checkliste',
		keywords: 'aufgaben todo erledigt',
		component: ListChecks
	},
	{ name: 'file-text', label: 'Dokument', keywords: 'seite datei text', component: FileText },
	{
		name: 'scroll-text',
		label: 'Richtlinie',
		keywords: 'regeln vertrag policy',
		component: ScrollText
	},
	{ name: 'newspaper', label: 'Neuigkeiten', keywords: 'news zeitung blog', component: Newspaper },
	{ name: 'lightbulb', label: 'Idee', keywords: 'tipp glühbirne', component: Lightbulb },
	{ name: 'info', label: 'Info', keywords: 'hinweis information', component: Info },
	{ name: 'circle-help', label: 'Hilfe', keywords: 'frage faq support', component: CircleHelp },
	{
		name: 'triangle-alert',
		label: 'Warnung',
		keywords: 'achtung gefahr wichtig',
		component: TriangleAlert
	},
	{ name: 'star', label: 'Stern', keywords: 'favorit wichtig', component: Star },
	{ name: 'heart', label: 'Herz', keywords: 'liebe favorit', component: Heart },
	{ name: 'flag', label: 'Flagge', keywords: 'ziel meilenstein', component: Flag },
	{ name: 'bookmark', label: 'Lesezeichen', keywords: 'merken', component: Bookmark },
	{ name: 'rocket', label: 'Rakete', keywords: 'start launch onboarding', component: Rocket },
	{ name: 'target', label: 'Ziel', keywords: 'okr strategie', component: Target },
	{ name: 'trophy', label: 'Pokal', keywords: 'erfolg gewinn', component: Trophy },
	{ name: 'sparkles', label: 'Neu', keywords: 'funkeln ki magie', component: Sparkles },
	{ name: 'zap', label: 'Blitz', keywords: 'schnell strom energie', component: Zap },
	{ name: 'house', label: 'Haus', keywords: 'start home übersicht', component: House },
	{
		name: 'building-2',
		label: 'Firma',
		keywords: 'gebäude büro unternehmen',
		component: Building2
	},
	{ name: 'briefcase', label: 'Arbeit', keywords: 'job koffer geschäft', component: Briefcase },
	{ name: 'users', label: 'Team', keywords: 'personal leute gruppe', component: Users },
	{ name: 'user', label: 'Person', keywords: 'profil mitarbeiter', component: User },
	{
		name: 'user-plus',
		label: 'Neuer Mitarbeiter',
		keywords: 'neuanstellung einstellung onboarding',
		component: UserPlus
	},
	{
		name: 'graduation-cap',
		label: 'Schulung',
		keywords: 'lernen ausbildung training',
		component: GraduationCap
	},
	{
		name: 'handshake',
		label: 'Partner',
		keywords: 'kunde vertrag vereinbarung',
		component: Handshake
	},
	{ name: 'calendar', label: 'Kalender', keywords: 'termin datum urlaub', component: Calendar },
	{ name: 'clock', label: 'Uhr', keywords: 'zeit arbeitszeit', component: Clock },
	{ name: 'mail', label: 'E-Mail', keywords: 'post nachricht', component: Mail },
	{
		name: 'message-square',
		label: 'Nachricht',
		keywords: 'chat kommunikation',
		component: MessageSquare
	},
	{ name: 'phone', label: 'Telefon', keywords: 'anruf kontakt', component: Phone },
	{ name: 'megaphone', label: 'Ankündigung', keywords: 'marketing werbung', component: Megaphone },
	{ name: 'euro', label: 'Geld', keywords: 'finanzen kosten preis euro', component: Euro },
	{ name: 'wallet', label: 'Geldbörse', keywords: 'finanzen budget', component: Wallet },
	{ name: 'shopping-cart', label: 'Einkauf', keywords: 'bestellung shop', component: ShoppingCart },
	{ name: 'truck', label: 'Versand', keywords: 'lieferung logistik', component: Truck },
	{ name: 'package', label: 'Paket', keywords: 'produkt lager', component: Package },
	{
		name: 'chart-column',
		label: 'Statistik',
		keywords: 'diagramm auswertung bericht',
		component: ChartColumn
	},
	{ name: 'scale', label: 'Recht', keywords: 'gesetz waage', component: Scale },
	{
		name: 'shield-check',
		label: 'Sicherheit',
		keywords: 'schutz datenschutz',
		component: ShieldCheck
	},
	{ name: 'lock', label: 'Schloss', keywords: 'privat zugang', component: Lock },
	{ name: 'key-round', label: 'Schlüssel', keywords: 'passwort zugang', component: KeyRound },
	{
		name: 'settings',
		label: 'Einstellungen',
		keywords: 'konfiguration zahnrad',
		component: Settings
	},
	{ name: 'wrench', label: 'Werkzeug', keywords: 'wartung reparatur', component: Wrench },
	{ name: 'hammer', label: 'Hammer', keywords: 'bauen werkzeug', component: Hammer },
	{ name: 'code', label: 'Code', keywords: 'programmieren entwicklung', component: Code },
	{ name: 'terminal', label: 'Terminal', keywords: 'konsole befehle shell', component: Terminal },
	{ name: 'bug', label: 'Fehler', keywords: 'bug problem', component: Bug },
	{ name: 'git-branch', label: 'Git', keywords: 'versionierung branch', component: GitBranch },
	{ name: 'database', label: 'Datenbank', keywords: 'daten sql', component: Database },
	{ name: 'server', label: 'Server', keywords: 'hosting infrastruktur', component: Server },
	{ name: 'cloud', label: 'Cloud', keywords: 'wolke hosting', component: Cloud },
	{ name: 'globe', label: 'Web', keywords: 'internet welt website', component: Globe },
	{ name: 'wifi', label: 'WLAN', keywords: 'netzwerk internet', component: Wifi },
	{ name: 'monitor', label: 'Bildschirm', keywords: 'pc computer', component: Monitor },
	{ name: 'laptop', label: 'Laptop', keywords: 'computer notebook hardware', component: Laptop },
	{ name: 'smartphone', label: 'Handy', keywords: 'smartphone mobil app', component: Smartphone },
	{ name: 'printer', label: 'Drucker', keywords: 'drucken', component: Printer },
	{ name: 'cpu', label: 'Hardware', keywords: 'prozessor chip', component: Cpu },
	{ name: 'image', label: 'Bild', keywords: 'foto grafik', component: Image },
	{ name: 'camera', label: 'Kamera', keywords: 'foto', component: Camera },
	{ name: 'palette', label: 'Design', keywords: 'farbe gestaltung', component: Palette },
	{ name: 'music', label: 'Musik', keywords: 'audio ton', component: Music },
	{ name: 'video', label: 'Video', keywords: 'film aufnahme', component: Video },
	{ name: 'map-pin', label: 'Ort', keywords: 'standort adresse karte', component: MapPin },
	{ name: 'car', label: 'Auto', keywords: 'fahrzeug fuhrpark', component: Car },
	{ name: 'plane', label: 'Reise', keywords: 'flug dienstreise', component: Plane },
	{ name: 'leaf', label: 'Umwelt', keywords: 'natur blatt nachhaltigkeit', component: Leaf },
	{ name: 'sun', label: 'Sonne', keywords: 'urlaub sommer', component: Sun },
	{ name: 'coffee', label: 'Kaffee', keywords: 'pause küche', component: Coffee },
	{ name: 'utensils', label: 'Essen', keywords: 'kantine besteck', component: Utensils },
	{ name: 'heart-pulse', label: 'Gesundheit', keywords: 'krank arzt', component: HeartPulse },
	{ name: 'archive', label: 'Archiv', keywords: 'alt ablage', component: Archive },
	{ name: 'trash-2', label: 'Papierkorb', keywords: 'löschen müll', component: Trash2 }
];

const byName = new Map(PAGE_ICONS.map((icon) => [icon.name, icon]));

/** The icon by its stored name; undefined for null or a name that's no longer offered. */
export function pageIcon(name: string | null | undefined): PageIcon | undefined {
	return name ? byName.get(name) : undefined;
}

/** Whether `name` may be stored as a page's icon. */
export function isPageIcon(name: unknown): name is string {
	return typeof name === 'string' && byName.has(name);
}

/** The icons whose name, label or keywords contain every word of `query`. */
export function searchPageIcons(query: string): PageIcon[] {
	const words = query.toLowerCase().split(/\s+/).filter(Boolean);
	if (words.length === 0) return PAGE_ICONS;
	return PAGE_ICONS.filter((icon) => {
		const text = `${icon.name} ${icon.label} ${icon.keywords}`.toLowerCase();
		return words.every((word) => text.includes(word));
	});
}
