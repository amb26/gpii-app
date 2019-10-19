/**
 * Repeater for markup elements
 *
 * Simple component for visual representation of a list of items with a
 * common markup.
 * Copyright 2017 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */

/* global fluid */

"use strict";
(function (fluid) {
    var gpii = fluid.registerNamespace("gpii");

    /**
     * Mixin grade for the "element" dynamicComponent of a "gpii.psp.repeater". It receives the source "item"
     * into its model and its list index into the option "index".
     * Specialised grades will override the "markup.body" option with the markup to be rendered into the
     * generic "elementContainer" container of the containing repeater.
     */
    fluid.defaults("gpii.psp.repeater.element", {
        gradeNames: "fluid.containerRenderingView",

        index: null,
        model: {
            item: undefined
        },
        markup: {
            body: ""
        },
        workflows: {
            global: {
                evaluateContainers: {
                    funcName: "gpii.psp.repeater.element.evaluateContainers",
                    priority: "after:resolveResourceModel"
                }
            }
        },

        invokers: {
            renderMarkup: { // Override for method in containerRenderingView
                funcName: "gpii.psp.repeater.generateElementMarkup",
                args: [
                    "{gpii.psp.repeater}.options.markup.elementContainer",
                    "{element}.options.markup.body"
                ]
            }
        },
        listeners: {
            "onDestroy.clearInjectedMarkup": {
                "this": "{that}.container",
                method: "remove"
            }
        }
    });

    gpii.psp.repeater.element.evaluateContainers = function (shadows) {
        shadows.forEach(function (shadow) {
            fluid.getForComponent(shadow.that, "container");
        });
    };

    /**
     * A component for visualizing multiple "similar" objects (such as settings,
     * setting groups or image dropdown menu items). The component expects:
     * - an `items` array in its model describing each of the items to be visualized.
     * - a `defaultElementGrade` option which contains the default grade name of a component which
     * will be in charge of visually representing a single item.
     * - a `elementContainer` markup entry which holds the markup of the `container` with a %children string
     * indicating the position where the element markup will be inserted
     */
    fluid.defaults("gpii.psp.repeater", {
        gradeNames: "fluid.viewComponent",

        model: {
            items: []
        },

        defaultElementGrade: null,

        invokers: {
            getElementGrade: { // Will be invoked with the "item" which is the source of the dynamic component
                funcName: "fluid.identity",
                args: ["{that}.options.defaultElementGrade"]
            }
        },

        markup: {
            // Essentially dummy markup we expect to be overridden
            elementContainer: "<div class=\"flc-dynamicElement\">%children</div>"
        },

        dynamicComponents: {
            element: {
                type: "gpii.psp.repeater.element",
                sources: "{repeater}.model.items",
                options: {
                    parentContainer: "{gpii.psp.repeater}.container",
                    gradeNames: "{that}.getElementGrade",
                    source: "{source}",
                    invokers: {
                        getElementGrade: "{gpii.psp.repeater}.getElementGrade({that}.options.source)"
                    },
                    model: {
                        item: "{source}"
                    },
                    index: "{sourcePath}"
                }
            }
        }
    });


    /**
     * Constructs the markup for the indexed container - sets proper index.
     * @param {String} template - The overall container template sourced from "{repeater}.options.elementContainer"
     * @param {String} children - The markup which is to be interpolated into the container under term %childern
     * @return {String} The markup with children interpolated into the container markup
     */
    gpii.psp.repeater.generateElementMarkup = function (template, children) {
        return fluid.stringTemplate(template, { children: children });
    };

})(fluid);
