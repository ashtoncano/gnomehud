"use strict";

const { Adw, Gio, Gtk } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Gettext = imports.gettext;
const Domain = Gettext.domain(Me.metadata.uuid);
const _ = Domain.gettext;
const ngettext = Domain.ngettext;

function init()
{

}

function fillPreferencesWindow(window)
{
    const settings = ExtensionUtils.getSettings("org.gnome.shell.extensions.gnomehud");

    const page = new Adw.PreferencesPage();
    const group = new Adw.PreferencesGroup({ title: _("Settings") });
    page.add(group);

    // show-indicator
    const indicatorRow = new Adw.ActionRow({ title: _("Show Extension Indicator") });
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

    window.add(page);
}