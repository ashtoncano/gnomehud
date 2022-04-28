"use strict";

const { Gio, GLib, GObject } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Monitor = Me.imports.monitors.monitor;

const Gettext = imports.gettext;
const Domain = Gettext.domain(Me.metadata.uuid);
const _ = Domain.gettext;
const ngettext = Domain.ngettext;

const ByteArray = imports.byteArray;

const PROC_DIR = "/proc/stat";

const cpu = {
    total: 0,               // total CPU time
    used: 0,                // used CPU time
    free: 0,                // idle CPU time
    oldTotal: 0,            // prev total CPU time
    oldUsed: 0,             // prev used CPU time
    oldFree: 0              // prev idle CPU time
};

Gio._promisify(Gio.File.prototype, "load_contents_async", "load_contents_finish");

/**
 * Query current CPU data from the filesystem.
 * 
 * @returns {cpu} CPU info object
 */
var getCPU = async(cancellable = null) =>
{
    const file = Gio.File.new_for_path(PROC_DIR);
    const contents = await file.load_contents_async(cancellable);
    const data = ByteArray.toString(contents[0]);

    const dataCPU = data.match(/\d+/g);

    cpu.oldTotal = cpu.total;
    cpu.oldUsed = cpu.used;
    cpu.oldFree = cpu.free;

    cpu.total = 0;
    for (let i = 0; i < 10; i++) cpu.total += parseInt(dataCPU[i]);
    cpu.free = parseInt(dataCPU[3]);
    cpu.used = cpu.total - cpu.free;
    
    return cpu;
};

var processor = class Processor extends Monitor.monitor
{
    static name = _("Processor");

    static { GObject.registerClass(this); }

    constructor()
    {
        super();

        this.formats = {
            PERCENT_USED: "PERCENT_USED",
            PERCENT_FREE: "PERCENT_FREE",
            SPEED: "SPEED",
            TEMP: "TEMP",
        };

        /** Run-time data for this `Processor`. */
        this.stats = {
            total: 0,
            used: 0,
            free: 0,
            oldTotal: 0,
            oldUsed: 0,
            oldFree: 0,
            percent_used: 0.0,
            percent_free: 0.0,
            speed: 0.0,
            temp: 0,
        };

        /** Configuration values derived from extension settings. */
        this.config = {
            ...this.config,
            precision: 2,
            place: [ Monitor.places.OVERLAY ],
            label: "CPU",
            icon: "cpu-x",
            format: [ this.formats.PERCENT_USED ],
            file: "/proc/stat",
            type: "Processor",
        };
    }

    async query(cancellable = null)
    {
        // Gather statistics
        const file = Gio.File.new_for_path(this.config.file);
        const contents = await file.load_contents_async(cancellable).catch(logError);
        const data = ByteArray.toString(contents[0]);

        const dataCPU = data.match(/\d+/g);

        this.stats.oldTotal = this.stats.total;
        this.stats.oldUsed = this.stats.used;
        this.stats.oldFree = this.stats.free;

        this.stats.total = 0;
        for (let i = 0; i < 10; i++) this.stats.total += parseInt(dataCPU[i]);
        this.stats.free = parseInt(dataCPU[3]);
        this.stats.used = this.stats.total - this.stats.free;

        // Calculate format values
        let cpuD = this.stats.total - this.stats.oldTotal;
        let cpuUsedD = this.stats.used - this.stats.oldUsed;
        let cpuPerc = (cpuUsedD / cpuD) * 100;
        this.stats.percent_used = cpuPerc;
        this.stats.percent_free = 100 - cpuPerc;

        return { ...this.stats };
    }

    static newFromConfig(config)
    {
        if (typeof config === "string")
        {
            config = JSON.parse(config);
        }

        let newMonitor = new Processor();
        newMonitor.config = { ...newMonitor.config, ...config };
        return newMonitor;
    }
}