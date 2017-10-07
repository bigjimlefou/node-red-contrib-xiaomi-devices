module.exports = function(RED) {
    "use strict";
    var mustache = require("mustache");
    var udpInputPortsInUse = {};
    var dgram = require('dgram');

    function XiaomiHtpNode(config) {
        RED.nodes.createNode(this, config);
        this.gateway = RED.nodes.getNode(config.gateway);
        this.sid = config.sid;
        this.output = config.output;
        this.temperature = config.temperature;
        this.humidity = config.humidity;
        this.pressure = config.pressure;

        var node = this;

        node.status({fill:"grey",shape:"ring",text:"battery"});

        if (this.gateway) {
            node.on('input', function(msg) {
                // var payload = JSON.parse(msg);
                var payload = msg.payload;
                node.log("Received message from: " + payload.model + " sid: " + payload.sid + " payload: " + payload.data);

                if (payload.sid == node.sid && payload.model == "weather\.v1") {
                    var data = JSON.parse(payload.data)

                    if (data.voltage) {
                        if (data.voltage < 2500) {
                            node.status({fill:"red",shape:"dot",text:"battery"});
                        } else if (data.voltage < 2900) {
                            node.status({fill:"yellow",shape:"dot",text:"battery"});
                        } else {
                            node.status({fill:"green",shape:"dot",text:"battery"});
                        }
                    }

                    if (node.output == "0") {
                        msg.payload = payload;
                        node.send([msg]);
                    } else if (node.output == "1") {
                        var temp = null;
                        var humidity = null;
                        var pressure = null;

                        if (data.temperature) {
                            temp = {"payload": data.temperature};
                        }

                        if (data.humidity) {
                            humidity = {"payload": data.humidity};
                        }

                        if (data.pressure) {
                            pressure = {"payload": data.pressure};
                        }
                        node.send([temp, humidity, pressure]);
                    } else if (node.output == "2") {
                        var temp = null;
                        var humidity = null;
                        var pressure = null;

                        if (data.temperature) {
                            temp = {"payload": mustache.render(node.temperature, data)}
                        }

                        if (data.humidity) {
                            humidity = {"payload": mustache.render(node.humidity, data)}
                        }

                        if (data.pressure) {
                            humidity = {"payload": mustache.render(node.pressure, data)}
                        }
                        node.send([temp, humidity, pressure]);
                    }
                }
            });

            node.on("close", function() {
            });

        } else {
            // no gateway configured
        }

    }

    RED.nodes.registerType("xiaomi-htp", XiaomiHtpNode);

}
