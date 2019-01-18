/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2019, Joyent, Inc.
 */
'use strict';

const tap = require('tap');
const data = require('./testdata.json');
const netconf = require('../../lib/index');
const jsprim = require('jsprim');

const VMS = data['vms'];
const NETS = data['nets'];
const POOLS = data['pools'];
const SYSINFO = data['sysinfo'];
const NICS = data['nics'];

tap.test('nets', function (tt) {
    tt.test('main', function (t) {
        const admin_net = NETS['admin_mainnet'];
        const external_net = NETS['external_mainnet'];
        t.ok(netconf.isNetAdmin(admin_net));
        t.notOk(netconf.isNetExternal(admin_net));
        t.ok(netconf.isNetExternal(external_net));
        t.notOk(netconf.isNetAdmin(external_net));
        t.end();
    });

    tt.test('rack', function (t) {
        const admin_net = NETS['admin_racknet'];
        const external_net = NETS['external_racknet'];
        t.ok(netconf.isNetAdmin(admin_net));
        t.notOk(netconf.isNetExternal(admin_net));
        t.ok(netconf.isNetExternal(external_net));
        t.notOk(netconf.isNetAdmin(external_net));
        t.end();
    });
    tt.end();
});

tap.test('pools', function (tt) {
    tt.test('isNet', function (t) {
        const basic = POOLS['basic_external'];
        const rack_reg_external = POOLS['rack_with_reg_pool'];
        const tags_present = POOLS['tags_present_external'];
        const rack_tags_present = POOLS['tags_present_rack_external'];
        const not_external = POOLS['not_external'];
        const admin_rack = POOLS['admin_rack'];

        t.ok(netconf.isNetExternal(basic));
        t.ok(netconf.isNetExternal(rack_reg_external));
        t.ok(netconf.isNetExternal(tags_present));
        t.ok(netconf.isNetExternal(rack_tags_present));
        t.notOk(netconf.isNetExternal(admin_rack));

        t.ok(netconf.isNetAdmin(admin_rack));
        t.notOk(netconf.isNetAdmin(basic));
        t.notOk(netconf.isNetAdmin(rack_reg_external));
        t.notOk(netconf.isNetAdmin(tags_present));
        t.notOk(netconf.isNetAdmin(rack_tags_present));

        t.notOk(netconf.isNetExternal(not_external));
        t.notOk(netconf.isNetInternal(basic));

        t.end();
    });

    tt.end();
});

tap.test('vms', function (tt) {
    tt.test('main', function (t) {
        const main_vm = VMS['main'];
        const external_ip = main_vm['nics'][0]['ip'];
        const manta_ip = main_vm['nics'][1]['ip'];
        const admin_ip = main_vm['nics'][2]['ip'];
        const admin_mac = main_vm['nics'][2]['mac'];

        t.equal(netconf.externalIpFromVmMetadata(main_vm), external_ip);
        t.equal(netconf.mantaIpFromVmMetadata(main_vm), manta_ip);
        t.equal(netconf.adminIpFromVmMetadata(main_vm), admin_ip);
        t.equal(netconf.adminMacFromVmMetadata(main_vm), admin_mac);

        t.end();
    });

    tt.test('rack', function (t) {
        const rack_vm = VMS['rack'];
        const external_ip = rack_vm['nics'][0]['ip'];
        const manta_ip = rack_vm['nics'][1]['ip'];
        const admin_ip = rack_vm['nics'][2]['ip'];
        const admin_mac = rack_vm['nics'][2]['mac'];

        t.equal(netconf.externalIpFromVmMetadata(rack_vm), external_ip);
        t.equal(netconf.mantaIpFromVmMetadata(rack_vm), manta_ip);
        t.equal(netconf.adminIpFromVmMetadata(rack_vm), admin_ip);
        t.equal(netconf.adminMacFromVmMetadata(rack_vm), admin_mac);

        t.end();
    });
    tt.end();
});

tap.test('nics', function (tt) {
    tt.test('main', function (t) {
        const main_vm = VMS['rack'];
        const external_nic = main_vm['nics'][0];
        const manta_nic = main_vm['nics'][1];
        const admin_nic = main_vm['nics'][2];

        t.ok(netconf.isNicAdmin(admin_nic));
        t.ok(netconf.isNicExternal(external_nic));

        t.notOk(netconf.isNicExternal(manta_nic));
        t.notOk(netconf.isNicAdmin(external_nic));

        t.end();
    });
    tt.test('rack',function (t) {
        const rack_vm = VMS['rack'];
        const external_nic = rack_vm['nics'][0];
        const manta_nic = rack_vm['nics'][1];
        const admin_nic = rack_vm['nics'][2];

        t.ok(netconf.isNicAdmin(admin_nic));
        t.ok(netconf.isNicExternal(external_nic));

        t.notOk(netconf.isNicExternal(manta_nic));
        t.notOk(netconf.isNicAdmin(external_nic));

        t.end();
    });
    tt.end();
});

tap.test('sysinfo', function (tt) {
    tt.test('main', function (t) {
        const sysinfo = SYSINFO['main'];
        const admin_if = sysinfo['Network Interfaces']['vioif0'];
        const admin_ip = admin_if['ip4addr'];
        const admin_mac = admin_if['MAC Address'];
        const admin_tags = admin_if['NIC Names'];

        var no_admin_ip = jsprim.deepCopy(sysinfo);
        delete no_admin_ip['Admin IP'];

        var no_admin_tag = jsprim.deepCopy(sysinfo);
        delete no_admin_tag['Admin NIC Tag'];

        var dhcp_admin_ip = jsprim.deepCopy(sysinfo);
        dhcp_admin_ip['Admin IP'] = 'dhcp';

        t.equal(sysinfo['Admin IP'], admin_ip);
        t.ok(admin_tags.indexOf(sysinfo['Admin NIC Tag']) !== -1);

        t.equal(netconf.adminIpFromSysinfo(sysinfo), admin_ip);
        t.equal(netconf.adminIpFromSysinfo(no_admin_ip), admin_ip);
        t.equal(netconf.adminIpFromSysinfo(dhcp_admin_ip), admin_ip);
        t.equal(netconf.adminIpFromSysinfo(no_admin_tag), admin_ip);

        t.end();
    });
    tt.test('rack',function (t) {
        const sysinfo = SYSINFO['rack'];
        const admin_if = sysinfo['Network Interfaces']['vioif0'];
        const admin_ip = admin_if['ip4addr'];
        const admin_mac = admin_if['MAC Address'];
        const admin_tags = admin_if['NIC Names'];

        var no_admin_ip = jsprim.deepCopy(sysinfo);
        delete no_admin_ip['Admin IP'];

        var no_admin_tag = jsprim.deepCopy(sysinfo);
        delete no_admin_tag['Admin NIC Tag'];

        var dhcp_admin_ip = jsprim.deepCopy(sysinfo);
        dhcp_admin_ip['Admin IP'] = 'dhcp';

        t.equal(sysinfo['Admin IP'], admin_ip);
        t.ok(admin_tags.indexOf(sysinfo['Admin NIC Tag']) !== -1);

        t.equal(netconf.adminIpFromSysinfo(sysinfo), admin_ip);
        t.equal(netconf.adminIpFromSysinfo(no_admin_ip), admin_ip);
        t.equal(netconf.adminIpFromSysinfo(dhcp_admin_ip), admin_ip);
        t.equal(netconf.adminIpFromSysinfo(no_admin_tag), admin_ip);

        t.end();
    });

    tt.end();
});

tap.test('nics', function (tt) {
    tt.test('main', function (t) {
        const nics = NICS['main'];
        const admin_ip = nics[0].ip;

        t.equal(netconf.adminIpFromNicsArray(nics), admin_ip);
        t.end();
    });

    tt.test('rack', function (t) {
        const nics = NICS['rack'];
        const admin_ip = nics[2].ip;

        t.equal(netconf.adminIpFromNicsArray(nics), admin_ip);
        t.end();
    });

    tt.end();
});
