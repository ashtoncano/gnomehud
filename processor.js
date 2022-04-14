"use strict";

const { Gio, GLib } = imports.gi;

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

/**
 * Query current CPU data from the filesystem.
 * 
 * @returns {cpu} CPU info object
 */
var getCPU = () =>
{
    let file = Gio.File.new_for_path(PROC_DIR);
    let data = ByteArray.toString(file.load_contents(null)[1]);
    let dataCPU = data.match(/\d+/g)

    cpu.oldTotal = cpu.total;
    cpu.oldUsed = cpu.used;
    cpu.oldFree = cpu.free;

    cpu.total = 0;
    for (let i = 0; i < 10; i++) cpu.total += parseInt(dataCPU[i]);
    cpu.free = parseInt(dataCPU[3]);
    cpu.used = cpu.total - cpu.free;

    return cpu;
}