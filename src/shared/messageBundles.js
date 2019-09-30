/**
 * A component which handles the i18n of the PSP.
 *
 * Introduces a component that distributes messages to components.
 *
 * Copyright 2016 Steven Githens
 * Copyright 2016-2017 OCAD University
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */
"use strict";

var gpii = fluid.registerNamespace("gpii");

/**
 * Represents messages for a single component.
 * It simply follows the format:
 * ```
 * {
 *     <messageKey>: <message>,
 *     ...
 * }
 * ```
 *
 * For example:
 * ```
 * {
 *     keyOut: "Key out",
 *     ...
 * }
 * ```
 *
 * @typedef {Object.<String, String>} ComponentMessages
 */


/**
 * An object representing messages for all different components.
 * Keys are individual component grade names (which contain
 * _ instead of . as separators) and the values are maps of messages
 * for a component.
 * It follows the format:
 * {
 *     <full_component_name>: <ComponentMessages>,
 *     ...
 * }
 *
 * Example with multiple locales:
 * ```
 * {
 *      gpii_app_menu: {
 *          keyOut: "Key out",
 *          keyedIn: "Keyed in with %snapsetName",
 *          ...
 *      },
 *      gpii_app_psp_header: {
 *          autosaveText": "Auto-save is on",
 *          keyOut": "Key Out",
 *          ...
 *      },
 *      ...
 * }
 * ```
 *
 * @typedef {Object.<String, ComponentMessages>} GroupedMessages
 */


/**
 * Holds all messages for the various components in the application (including
 * the renderer components). The model contains the current locale and the
 * messages applicable to it. The `messageBundles` option is loaded synchronously
 * when this component is instantiated and is a map whose keys represent the
 * supported locales for the application and the values are the messages for these
 * locales. The messages in turn are also maps whose keys start with the gradeName
 * to which the message is relative (but the dots are replaced with underscores) and
 * end with the simple name of the message key which is referenced in the component.
 * For example, here is an entry from the "en" locale:
 *     en: {
 *       "gpii_psp_header_autosaveText": "Auto-save is on",
 *       ...
 *     }
 * It means that the "Auto-save is on" message should be the value of the `autosaveText`
 * property within the model's messages object of the "gpii.psp.header" component.
 *
 * This component has a `messageDistributor` subcomponent which is created
 * programmatically and it takes care of providing the necessary messages to the
 * components which need them via dynamically generated `distributeOptions` blocks.
 * Note that the messages that a component uses must to be located in the "model".
 * This approach makes use of the modelListeners in order for re-rendering to happen
 * when the locale changes.
 */
fluid.defaults("gpii.app.messageBundles", {
    gradeNames: ["fluid.modelComponent"],

    model: {
        locale: null, // the defaultLocale will be used if no locale is set
        groupedMessages: {}
    },

    defaultLocale: "en",

    messageBundlesPath: "build/gpii-app-messageBundles.json",

    messageBundles: "@expand:gpii.app.messageBundles.loadMessageBundles({that}.options.messageBundlesPath)",

    modelListeners: {
        locale: {
            func: "{that}.updateMessages"
        }
    },

    invokers: {
        updateMessages: {
            funcName: "gpii.app.messageBundles.updateMessages",
            args: [
                "{that}",
                "{that}.options.messageBundles",
                "{that}.model.locale",
                "{that}.options.defaultLocale"
            ]
        }
    }
});

/**
 * Loads synchronously and parses the messageBundles file.
 * @param {String} messageBundlesPath - The path to the messageBundles file relative
 * to the project directory.
 * @return {Object} The parsed message bundles for the different locales.
 */
gpii.app.messageBundles.loadMessageBundles = function (messageBundlesPath) {
    var messageBundles;

    if (fluid.require) {
        // Approach for loading messages in the main process
        messageBundles = fluid.require("%gpii-app/" + messageBundlesPath);
    } else {
        // Approach for loading messages in the renderer process
        var resolvedPath = require("path").join(__dirname, "../../..", messageBundlesPath);
        messageBundles = require(resolvedPath);
    }

    return messageBundles;
};

/**
 * Updates the currently used messages depending on the provided locale. In case
 * there are no messages available for this locale, the default locale messages
 * will be used.
 * @param {Component} that - The `gpii.app.messageBundles` instance.
 * @param {Object} messageBundles - A map containing the messages for all available
 * locales.
 * @param {String} locale - The new locale.
 * @param {String} defaultLocale - The default locale.
 */
gpii.app.messageBundles.updateMessages = function (that, messageBundles, locale, defaultLocale) {
    locale = locale || "";

    var genericLocale = locale.split("-")[0];
    var messages = messageBundles[locale.toLowerCase()] || messageBundles[genericLocale];

    if (!messages) {
        fluid.log(fluid.logLevel.WARN, "Bundles for locale - " + locale + " - are missing. Using default locale of: " + defaultLocale);
        messages = messageBundles[defaultLocale];
    }

    var groupedMessages = gpii.app.messageBundles.groupMessagesByComponent(messages);
    that.applier.change("groupedMessages", groupedMessages);
};

/**
 * Given a message key from the `messages` model object, this function returns the
 * portion of the key which pertains to the name of the component. For example, for
 * the "gpii_psp_header_autosaveText" key, this function would return "gpii_psp_header".
 * @param {String} messageKey - a key from the `messages` object.
 * @return {String} The grade name to which this key is related to (except that it will
 * contain _ insteаd of . as separators).
 */
gpii.app.messageBundles.getComponentKey = function (messageKey) {
    var keyDelimiterIndex = messageKey.lastIndexOf("_");
    return messageKey.slice(0, keyDelimiterIndex);
};

/**
 * Given a message key from the `messages` model object, this function returns the
 * portion of the key which is the simple message key referenced within the corresponding
 * component. For example, for the "gpii_psp_header_autosaveText" key, this function would
 * return "autosaveText".
 * @param {String} messageKey - a key from the `messages` object.
 * @return {String} The simple message key referenced within the component.
 */
gpii.app.messageBundles.getSimpleMessageKey = function (messageKey) {
    var keyDelimiterIndex = messageKey.lastIndexOf("_");
    return messageKey.slice(keyDelimiterIndex + 1);
};

// TODO: Note that this also compiles messages that do not correspond to grades resolved by gpii.app.localisedMessagesReceiver, 
// i.e. gpii_app_qss_settings resolved in gpii.app.qssWrapper.applySettingTranslations 
// and gpii_userErrors in gpii.app.userErrorsHandler.getErrorDetails
/**
 * Given a map which contains all messages for a given locale, this function groups the
 * messages by component grades.
 * @param {Object} messages - A map with all the messages for a given locale.
 * @return {GroupedMessages} An object representing the messages grouped by component.
 */
gpii.app.messageBundles.groupMessagesByComponent = function (messages) {
    var groupedMessages = {};

    fluid.each(messages, function (message, key) {
        var componentKey = gpii.app.messageBundles.getComponentKey(key),
            simpleMessageKey = gpii.app.messageBundles.getSimpleMessageKey(key);

        var messageObj = {};
        messageObj[simpleMessageKey] = message;

        groupedMessages[componentKey] = fluid.extend(true, {}, groupedMessages[componentKey], messageObj);
    });
    return groupedMessages;
};

/** A grade used to opt into to distribution of dynamically updated localised messages composed per grade **/

fluid.defaults("gpii.app.localisedMessagesReceiver", {
    gradeNames: "fluid.modelComponent",
    modelRelay: {
        composeGradeMessages: {
            source: "{gpii.app.messageBundles}.model.groupedMessages",
            target: "{that}.model.messages",
            singleTransform: {
                type: "gpii.app.composeGradeMessages",
                gradeNames: "{that}.options.gradeNames"
            }
        }
    }
});

/**
 * A model transformation function which compiles and sets the messages for a given component.
 * This is done by examining all grade
 * names for the component and adding their messages to the resulting set of messages. In
 * case there are messages with the same key for different grade names, the rightmost grade
 * name's messages will have priority.
 * @param {Object} groupedMessages - A hash keyed by the grade name for which the message is destined, compiled into
 *     {gpii.app.messageBundles}.model.groupedMessages by the action groupMessagesByComponent
 * @param {TransformSpec} transformSpec - The `transformSpec` structure supplied by the model transformation machinery
 * @return {Object} The messages appropriate for the targetted components grade
 */
gpii.app.composeGradeMessages = function (groupedMessages, transformSpec) {
    var gradeNames = transformSpec.gradeNames;
    var componentMessages = gradeNames.reduce(function (messages, grade) {
        var messageKey = grade.replace(/\./g, "_");
        return Object.assign(messages, groupedMessages[messageKey]);
    }, {});
    return componentMessages;
};
