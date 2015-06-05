//  Copyright (c) 2014 Readium Foundation and/or its licensees. All rights reserved.
//
//  Redistribution and use in source and binary forms, with or without modification,
//  are permitted provided that the following conditions are met:
//  1. Redistributions of source code must retain the above copyright notice, this
//  list of conditions and the following disclaimer.
//  2. Redistributions in binary form must reproduce the above copyright notice,
//  this list of conditions and the following disclaimer in the documentation and/or
//  other materials provided with the distribution.
//  3. Neither the name of the organization nor the names of its contributors may be
//  used to endorse or promote products derived from this software without specific
//  prior written permission.

require.config({

    modules:
    [
        {
            name: "readium-plugin-example",
            create: true,
            include: ["readium_plugin_example"],
            exclude: ["readium-external-libs", "readium-cfi-js", "readium-shared-js"],
            insertRequire: ["readium_plugin_example"]
        },

        {
            name: "readium-plugin-annotations",
            create: true,
            include: ["readium_plugin_annotations"],
            exclude: ["readium-external-libs", "readium-cfi-js", "readium-shared-js"],
            insertRequire: ["readium_plugin_annotations"]
        }
    ]
});
