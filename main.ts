import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, ItemView } from 'obsidian';
import { KanLineSettings } from './src/types';
import { DEFAULT_SETTINGS, PLUGIN_NAME } from './src/utils/constants';
import { Root, createRoot } from 'react-dom/client';
import React from 'react';
import AppRoot from './src/components/AppRoot';

const VIEW_TYPE_KANLINE = 'kanline-view';

class KanLineView extends ItemView {
	private root: Root | null = null;

	constructor(leaf: WorkspaceLeaf, private plugin: KanLinePlugin) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_KANLINE;
	}

	getDisplayText(): string {
		return 'KanLine Manager';
	}

	getIcon(): string {
		return 'layout-grid';
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		
		const rootEl = container.createDiv();
		this.root = createRoot(rootEl);
		
		this.root.render(
			React.createElement(AppRoot, {
				plugin: this.plugin,
				app: this.app
			})
		);
	}

	async onClose() {
		if (this.root) {
			this.root.unmount();
			this.root = null;
		}
	}
}

export default class KanLinePlugin extends Plugin {
	settings: KanLineSettings;

	async onload() {
		await this.loadSettings();

		// Register the view
		this.registerView(VIEW_TYPE_KANLINE, (leaf) => new KanLineView(leaf, this));

		// Add ribbon icon
		this.addRibbonIcon('layout-grid', 'KanLine Manager', () => {
			this.activateView();
		});

		// Add command to open board
		this.addCommand({
			id: 'open-kanline',
			name: 'Open KanLine',
			callback: () => {
				this.activateView();
			}
		});

		// Add settings tab
		this.addSettingTab(new KanLineSettingTab(this.app, this));
	}

	onunload() {
		// Cleanup will be handled by React components and view
	}

	async activateView() {
		const { workspace } = this.app;
		
		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_KANLINE);

		if (leaves.length > 0) {
			// If a leaf with our view already exists, use it
			leaf = leaves[0];
		} else {
			// Otherwise, create a new leaf in the main workspace area
			leaf = workspace.getLeaf('tab');
			await leaf?.setViewState({ type: VIEW_TYPE_KANLINE, active: true });
		}

		// Reveal and focus the leaf
		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(settings?: Partial<KanLineSettings>) {
		if (settings) {
			this.settings = { ...this.settings, ...settings };
		}
		await this.saveData(this.settings);
	}
}

class KanLineSettingTab extends PluginSettingTab {
	plugin: KanLinePlugin;

	constructor(app: App, plugin: KanLinePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		containerEl.createEl('h2', {text: 'KanLine Settings'});

		new Setting(containerEl)
			.setName('Show tags on cards')
			.setDesc('Display tags on note cards in the board')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showTagsOnCards)
				.onChange(async (value) => {
					await this.plugin.saveSettings({ showTagsOnCards: value });
				}));

		new Setting(containerEl)
			.setName('Card height')
			.setDesc('Height of note cards in the board')
			.addDropdown(dropdown => dropdown
				.addOptions({
					'compact': 'Compact',
					'normal': 'Normal',
					'expanded': 'Expanded'
				})
				.setValue(this.plugin.settings.cardHeight)
				.onChange(async (value: 'compact' | 'normal' | 'expanded') => {
					await this.plugin.saveSettings({ cardHeight: value });
				}));

		new Setting(containerEl)
			.setName('Use Dataview queries')
			.setDesc('Use Dataview plugin for better performance (requires Dataview plugin)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useDataviewQueries)
				.onChange(async (value) => {
					await this.plugin.saveSettings({ useDataviewQueries: value });
				}));

		new Setting(containerEl)
			.setName('Dataview fallback')
			.setDesc('Fall back to normal tag search if Dataview queries fail')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.dataviewFallback)
				.onChange(async (value) => {
					await this.plugin.saveSettings({ dataviewFallback: value });
				}));

		new Setting(containerEl)
			.setName('Auto-refresh cards')
			.setDesc('Automatically refresh note cards on the board')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoRefreshEnabled)
				.onChange(async (value) => {
					await this.plugin.saveSettings({ autoRefreshEnabled: value });
				}));

		new Setting(containerEl)
			.setName('Refresh interval')
			.setDesc('How often to refresh cards (in seconds)')
			.addSlider(slider => slider
				.setLimits(1, 60, 1)
				.setValue(this.plugin.settings.autoRefreshInterval)
				.setDynamicTooltip()
				.onChange(async (value) => {
					await this.plugin.saveSettings({ autoRefreshInterval: value });
				}));
	}
}
