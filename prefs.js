"use strict";

const { Adw, Gdk, Gio, GLib, Gtk } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Gettext = imports.gettext;
const Domain = Gettext.domain(Me.metadata.uuid);
const _ = Domain.gettext;
const ngettext = Domain.ngettext;

let settings;

/**
 * Intialize objects needed for the preferences page.
 */
function init()
{
    settings = ExtensionUtils.getSettings("org.gnome.shell.extensions.gnomehud");
}

/**
 * Create the preferences window.
 * 
 * @param {Adw.PreferencesWindow} window 
 */
function fillPreferencesWindow(window)
{
    const page = new Adw.PreferencesPage();
    const group = new Adw.PreferencesGroup({ title: _("Settings") });
    page.add(group);

    // show-indicator
    const indicatorRow = new Adw.ActionRow({ title: _("Show Extension Indicator") });
    indicatorRow.set_subtitle(
        _(`Use 'gnome-extensions prefs ${Me.metadata.uuid}' to access this window manually.`)
    );
    indicatorRow.set_icon_name(`${settings.get_string("default-icon")}-symbolic`);
    group.add(indicatorRow);

    const indicatorToggle = new Gtk.Switch({
        active: settings.get_boolean("show-indicator"),
        valign: Gtk.Align.CENTER,
    });

    settings.bind(
        "show-indicator",
        indicatorToggle,
        "active",
        Gio.SettingsBindFlags.DEFAULT,
    );

    indicatorRow.add_suffix(indicatorToggle);
    indicatorRow.activatable_widget = indicatorToggle;
    addResetButton(indicatorRow, "show-indicator");

    // show-overlay
    const overlayRow = new Adw.ActionRow({ title: _("Show Overlay") });
    group.add(overlayRow);

    const overlayToggle = new Gtk.Switch({
        active: settings.get_boolean("show-overlay"),
        valign: Gtk.Align.CENTER,
    });

    settings.bind(
        "show-overlay",
        overlayToggle,
        "active",
        Gio.SettingsBindFlags.DEFAULT,
    );

    overlayRow.add_suffix(overlayToggle);
    overlayRow.activatable_widget = overlayToggle;
    addResetButton(overlayRow, "show-overlay");

    // show-osd
    const osdRow = new Adw.ActionRow({ title: _("Show Toggle Alerts") });
    group.add(osdRow);

    const osdToggle = new Gtk.Switch({
        active: settings.get_boolean("show-osd"),
        valign: Gtk.Align.CENTER,
    });

    settings.bind(
        "show-osd",
        osdToggle,
        "active",
        Gio.SettingsBindFlags.DEFAULT,
    );

    osdRow.add_suffix(osdToggle);
    osdRow.activatable_widget = osdToggle;
    addResetButton(osdRow, "show-osd");

    // update-delay
    const delayRow = new Adw.ActionRow({ title: _("Update Delay (ms)") });
    group.add(delayRow);

    const delayRange = Gtk.SpinButton.new_with_range(
        250, 5000, 250
    );

    settings.bind(
        "update-delay",
        delayRange,
        "value",
        Gio.SettingsBindFlags.DEFAULT,
    );

    delayRow.add_suffix(delayRange);
    delayRow.activatable_widget = delayRange;
    addResetButton(delayRow, "update-delay");

    // anchor-corner
    const anchorRow = new Adw.ActionRow({ title: _("Anchor Corner" )});
    group.add(anchorRow);

    const anchorSelector = Gtk.DropDown.new_from_strings([
        _("Top-Left"),
        _("Top-Right"),
        _("Bottom-Left"),
        _("Bottom-Right"),
    ]);

    settings.bind(
        "anchor-corner",
        anchorSelector,
        "selected",
        Gio.SettingsBindFlags.DEFAULT,
    );

    anchorRow.add_suffix(anchorSelector);
    anchorRow.activatable_widget = anchorSelector;
    addResetButton(anchorRow, "anchor-corner");

    // default-monitor
    const monitorRow = new Adw.ActionRow({ title: _("Default Monitor")} );
    group.add(monitorRow);

    const monitorSelector = Gtk.DropDown.new_from_strings([
        _("Primary"), "1", "2", "3", "4"
    ]);

    settings.bind(
        "default-monitor",
        monitorSelector,
        "selected",
        Gio.SettingsBindFlags.DEFAULT,
    );

    monitorRow.add_suffix(monitorSelector);
    monitorRow.activatable_widget = monitorSelector;
    addResetButton(monitorRow, "default-monitor");

    // background-color
    const backgroundRow = new Adw.ActionRow({ title: _("Background Color") });
    group.add(backgroundRow);

    const backgroundOpacityScale = Gtk.Scale.new_with_range(
        Gtk.Orientation.HORIZONTAL,
        0,
        1.0,
        0.05,
    );
    backgroundOpacityScale.set_hexpand(true);
    backgroundOpacityScale.set_draw_value(true);
    backgroundOpacityScale.set_digits(2);

    settings.bind(
        "background-opacity",
        backgroundOpacityScale.get_adjustment(),
        "value",
        Gio.SettingsBindFlags.DEFAULT,
    );

    let rgbaB = new Gdk.RGBA();
    rgbaB.parse(settings.get_string("background-color"))
    const backgroundButton = Gtk.ColorButton.new();
    backgroundButton.set_use_alpha(false);
    backgroundButton.set_rgba(rgbaB);
    backgroundButton.connect(
        "color-set", 
        () => colorUpdated("background-color", backgroundButton),
    );

    backgroundRow.add_suffix(backgroundOpacityScale);
    backgroundRow.add_suffix(backgroundButton);
    backgroundRow.activatable_widget = backgroundButton;
    addResetButton(backgroundRow, ["background-color", "background-opacity"], 
        function()
        {
            let rgba = new Gdk.RGBA();
            rgba.parse(settings.get_string("background-color"));
            backgroundButton.set_rgba(rgba);
        }
    );

    // foreground-color
    const foregroundRow = new Adw.ActionRow({ title: _("Foreground Color") });
    group.add(foregroundRow);

    const foregroundOpacityScale = Gtk.Scale.new_with_range(
        Gtk.Orientation.HORIZONTAL,
        0,
        1.0,
        0.05,
    );
    foregroundOpacityScale.set_hexpand(true);
    foregroundOpacityScale.set_draw_value(true);
    foregroundOpacityScale.set_digits(2);

    settings.bind(
        "foreground-opacity",
        foregroundOpacityScale.get_adjustment(),
        "value",
        Gio.SettingsBindFlags.DEFAULT,
    );

    let rgbaF = new Gdk.RGBA();
    rgbaF.parse(settings.get_string("foreground-color"))
    const foregroundButton = Gtk.ColorButton.new();
    foregroundButton.set_use_alpha(false);
    foregroundButton.set_rgba(rgbaF);
    foregroundButton.connect(
        "color-set", 
        () => colorUpdated("foreground-color", foregroundButton),
    );

    foregroundRow.add_suffix(foregroundOpacityScale);
    foregroundRow.add_suffix(foregroundButton);
    foregroundRow.activatable_widget = foregroundButton;
    addResetButton(foregroundRow, ["foreground-color", "foreground-opacity"], 
        function()
        {
            let rgba = new Gdk.RGBA();
            rgba.parse(settings.get_string("foreground-color"));
            foregroundButton.set_rgba(rgba);
        }
    );

    // keybinds
    const keybindGroup = new Adw.PreferencesGroup({ title: _("Keybinds") });
    page.add(keybindGroup);

    const toggleKeybindRow = new Adw.ActionRow({ title: _("Toggle Overlay") });
    keybindGroup.add(toggleKeybindRow);

    const toggleKeybindText = new Gtk.Text()

    let keybind = settings.get_strv("kb-toggle-overlay")[0];
    toggleKeybindText.set_text(keybind);
    toggleKeybindText.set_truncate_multiline(true);
    toggleKeybindText.connect("changed", () => keybindUpdate(toggleKeybindText));

    toggleKeybindRow.add_suffix(toggleKeybindText);
    toggleKeybindRow.activatable_widget = toggleKeybindText;
    addResetButton(toggleKeybindRow, "kb-toggle-overlay");

    // danger zone!
    const dangerGroup = new Adw.PreferencesGroup({ title: _("Danger Zone!") });
    page.add(dangerGroup);

    // reset
    const resetButton = Gtk.Button.new_with_label(_("Reset Settings"));
    resetButton.connect("clicked", () => resetButtonActivate());
    resetButton.set_margin_bottom(10);
    dangerGroup.add(resetButton);

    // disable
    const disableButton = Gtk.Button.new_with_label(_("Disable Extension"));
    disableButton.connect("clicked", () => disableButtonActivate());
    disableButton.set_margin_bottom(20);
    dangerGroup.add(disableButton);

    // info
    const infoLabel = Gtk.Label.new(_(`Source: ${Me.metadata.url}`));
    infoLabel.selectable = true;
    dangerGroup.add(infoLabel);

    window.add(page);
}

/**
 * Called when the kb-toggle-overlay field is changed. Updates the actual extension
 * setting.
 * 
 * @param {Gtk.Text} text
 */
function keybindUpdate(text)
{
    settings.set_strv("kb-toggle-overlay", [text.get_text()]);
}

/**
 * 
 * @param {string} key 
 * @param {Gtk.ColorButton} button 
 */
function colorUpdated(key, button)
{
    settings.set_string(key, button.get_rgba().to_string());
}

/**
 * Called when the reset button is pressed. Resets all extension settings.
 */
function resetButtonActivate()
{
    settings.set_boolean("show-overlay", false);
    settings.settings_schema.list_keys().forEach(x => settings.reset(x));
}

/**
 * Called when the disable button is pressed. Disables the extension manually.
 */
function disableButtonActivate()
{
    log(_(`${Me.metadata.uuid}: User disabling extension`));
    GLib.spawn_command_line_async(`gnome-extensions disable ${Me.metadata.uuid}`);
}

/**
 * Adds a new Gtk.Button to the given row for resetting the given key.
 * 
 * @param {Adw.ActionRow} row the Adw.ActionRow to append to
 * @param {string|string[]} key the settings key to reset when pressed
 * @param {function} callback
 * @returns {Gtk.Button} the Gtk.Button created
 */
function addResetButton(row, key, callback = null)
{
    if (!Array.isArray(key)) key = [key];

    const button = Gtk.Button.new_from_icon_name("edit-undo-symbolic");
    row.add_suffix(button);

    key.forEach(x => button.connect("clicked", () => settings.reset(x)));
    key.forEach(x => settings.connect(`changed::${x}`, () => updateResetButton(button, x)));
    updateResetButton(button, key);
    if (callback) button.connect("clicked", () => callback());

    return button;
}

/**
 * Update the sensitivty of the given button based if the given key's value
 * is different from its default value.
 * 
 * @param {Gtk.Button} button the Gtk.Button to update
 * @param {string|string[]} key the settings key to check against
 */
function updateResetButton(button, key)
{
    if (!Array.isArray(key)) key = [key];

    button.set_sensitive(
        key.some((x) => !settings.get_default_value(x).equal(settings.get_value(x)))
    );
}