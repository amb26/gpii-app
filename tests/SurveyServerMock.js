/**
 * Mock implementation of a survey server
 *
 * The mocked survey server allows testing of various survey related scenarios (e.g.
 * sending/parsing survey trigger messages, showing surveys, etc).
 * Copyright 2017 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */
"use strict";
var fluid = require("infusion"),
    gpii = fluid.registerNamespace("gpii"),
    WebSocket = require("ws");

fluid.registerNamespace("gpii.tests.mocks");

fluid.defaults("gpii.tests.mocks.surveyServer", {
    gradeNames: "fluid.component",
    config: {
        port: null // passed by the wrapper
    },
    members: {
        server: {
            expander: {
                funcName: "gpii.tests.mocks.surveyServer.create",
                args: ["{that}.options.config.port"]
            }
        },
        webSocket: null
    },
    events: {
        onTriggersRequested: null,
        onTriggerOccurred: null,
        onServerClosed: null
    },
    listeners: {
        onCreate: {
            funcName: "gpii.tests.mocks.surveyServer.registerHandlers",
            args: ["{that}", "{that}.server"]
        }
    },
    invokers: {
        sendPayload: {
            funcName: "gpii.tests.mocks.surveyServer.sendPayload",
            args: ["{that}.webSocket", "{arguments}.0"]
        },
        close: {
            funcName: "gpii.tests.mocks.surveyServer.close",
            args: ["{that}", "{that}.server"]
        }
    }
});

gpii.tests.mocks.surveyServer.create = function (port) {
    return new WebSocket.Server({port: port});
};

gpii.tests.mocks.surveyServer.registerHandlers = function (that, server) {
    server.on("connection", function connection(webSocket) {
        that.webSocket = webSocket;

        webSocket.on("message", function (message) {
            message = JSON.parse(message);
            var type = message.type,
                value = message.value;

            switch (type) {
            case "triggersRequest":
                that.events.onTriggersRequested.fire(value);
                break;
            case "triggerOccurred":
                that.events.onTriggerOccurred.fire(value);
                break;
            }
        });
    });
};

gpii.tests.mocks.surveyServer.sendPayload = function (webSocket, payload) {
    if (webSocket) {
        webSocket.send(JSON.stringify(payload));
    }
};

gpii.tests.mocks.surveyServer.close = function (that, server) {
    server.close(function () {
        that.events.onServerClosed.fire();
    });
};

fluid.defaults("gpii.tests.mocks.surveyServerWrapper", {
    gradeNames: "fluid.component",
    config: {
        hostname: "localhost",
        port: 33345
    },
    components: {
        surveyServer: {
            type: "gpii.tests.mocks.surveyServer",
            options: {
                config: {
                    hostname: "{surveyServerWrapper}.options.config.hostname",
                    port: "{surveyServerWrapper}.options.config.port"
                }
            }
        },
        surveyConnector: {
            priority: "after:surveyServer",
            options: {
                config: {
                    hostname: "{surveyServerWrapper}.options.config.hostname",
                    port: "{surveyServerWrapper}.options.config.port"
                }
            }
        }
    }
});
