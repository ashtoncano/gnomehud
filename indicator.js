"use strict";

const { St, GObject, Gio, GLib, Shell, Meta } = imports.gi;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Util = imports.misc.util;

const ExtensionUtils = imports.misc.extensionUtils;
const ExtensionManager = Main.extensionManager;
const Me = ExtensionUtils.getCurrentExtension();

const Gettext = imports.gettext;
const Domain = Gettext.domain(Me.metadata.uuid);
const _ = Domain.gettext;
const ngettext = Domain.ngettext;

var indicator = class Indicator extends GObject.Object
{
    static { GObject.registerClass(this); }

    /**
     * Construct a new Indicator. `create()` must be called once other GObjects
     * are constructed.
     * 
     * @param {Object} extension 
     */
    constructor(extension)
    {
        super();

        this._extension = extension;
        this._settings = extension.settings;
    }

    /**
     * Create necessary bindings/objects for the Indicator to function.
     */
    create()
    {
        // Toolbar button
        this._button = new PanelMenu.Button(0.5, Me.metadata.uuid);
        const icon = new St.Icon({
            gicon: new Gio.ThemedIcon({ name: `${this._settings.get_string("default-icon")}-symbolic` }),
            style_class: "system-status-icon"
        });
        this._button.add_child(icon);

        this._settings.bind(
            "show-indicator",
            this._button,
            "visible",
            Gio.SettingsBindFlags.DEFAULT
        );

        Main.panel.addToStatusArea(Me.metadata.uuid, this._button);

        // Title
        const titleItem = new PopupMenu.PopupMenuItem("GNOME HUD");
        titleItem.sensitive = false;
        this._button.menu.addMenuItem(titleItem);

        this._button.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Overlay switch
        const switchItem = new PopupMenu.PopupSwitchMenuItem(
            _("Overlay"), 
            this._settings.get_boolean("show-overlay"),
        );
        switchItem.connect("toggled", () => this.toggleOverlay());
        this._button.menu.addMenuItem(switchItem);

        // Dev note: is there a better way to do this other than referencing _switch?
        this._settings.bind(
            "show-overlay",
            switchItem._switch,
            "state",
            Gio.SettingsBindFlags.DEFAULT
        );

        // Monitor button
        const systemMonitorButton = new PopupMenu.PopupMenuItem(_("Open System Monitor"));
        const app = Shell.AppSystem.get_default().lookup_app("gnome-system-monitor.desktop");
        systemMonitorButton.connect("activate", () => app.activate());
        this._button.menu.addMenuItem(systemMonitorButton);

        this._button.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Settings button
        const settingsItem = new PopupMenu.PopupMenuItem(_("Settings"));
        settingsItem.connect("activate", () => this.settingsButtonActivate());
        this._button.menu.addMenuItem(settingsItem);

        // Quit button
        const disableItem = new PopupMenu.PopupMenuItem(_("Disable Extension"));
        disableItem.connect("activate", () => this.disableButtonActivate());
        this._button.menu.addMenuItem(disableItem);
    }

    /**
     * Called when the indicator switch is flipped. Toggles the show-overlay setting.
     */
    toggleOverlay()
    {
        this._settings.set_boolean("show-overlay", this._settings.get_boolean("show-overlay"));
    }

    /**
     * Called when the setting button is pressed. Opens the extension preferences 
     * window.
     */
    settingsButtonActivate()
    {
        log(_(`${Me.metadata.uuid}: Opening settings dialog`));
        ExtensionManager.openExtensionPrefs(Me.metadata.uuid, "", null);
    }

    /**
     * Called when the disable button is pressed. Disables the extension manually.
     */
    disableButtonActivate()
    {
        log(_(`${Me.metadata.uuid}: User disabling extension`));
        ExtensionManager.disableExtension(Me.metadata.uuid)
    }

    /**
     * Destroy this object and objects it created.
     */
    destroy()
    {
        if (this._button) this._button.destroy();
        this._button = null;
    }
}