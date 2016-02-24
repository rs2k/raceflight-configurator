'use strict';

var BOARD_DEFINITIONS = [
    {
        name: "VR Core F4",
        identifier: "VRCR",
        vcp: true
    }, {
        name: "REVO NANO F4",
        identifier: "REVN",
        vcp: true
    }, {
        name: "BlueJay F4",
        identifier: "BJF4",
        vcp: true
    }, {
        name: "REVO F4",
        identifier: "REVO",
        vcp: true
    }, {
        name: "SPARKY2 F4",
        identifier: "SPK2",
        vcp: true
    }, {
        name: "AlienFlight F4",
        identifier: "AFF4",
        vcp: true
    }, {
        name: "CC3D",
        identifier: "CC3D",
        vcp: true
    }, {
        name: "ChebuzzF3",
        identifier: "CHF3",
        vcp: false
    }, {
        name: "CJMCU",
        identifier: "CJM1",
        vcp: false
    }, {
        name: "EUSTM32F103RB",
        identifier: "EUF1",
        vcp: false
    }, {
        name: "Naze/Flip32+",
        identifier: "AFNA",
        vcp: false
    }, {
        name: "Naze32Pro",
        identifier: "AFF3",
        vcp: false
    }, {
        name: "Olimexino",
        identifier: "OLI1"
    }, {
        name: "Port103R",
        identifier: "103R",
        vcp: false
    }, {
        name: "Sparky",
        identifier: "SPKY",
        vcp: true
    }, {
        name: "STM32F3Discovery",
        identifier: "SDF3",
        vcp: true
    }, {
        name: "Colibri Race",
        identifier: "CLBR",
        vcp: true
    }, {
        name: "SP Racing F3",
        identifier: "SRF3",
        vcp: false
    }, {
        name: "MotoLab",
        identifier: "MOTO",
        vcp: true
    }, {
        name: "Lumenier Lux",
        identifier: "LUX\0",
        vcp: true
    }
];

var DEFAULT_BOARD_DEFINITION = {
    name: "Unknown",
    identifier: "????",
    vcp: false
};

var BOARD = {
    
};

BOARD.find_board_definition = function (identifier) {
    for (var i = 0; i < BOARD_DEFINITIONS.length; i++) {
        var candidate = BOARD_DEFINITIONS[i];
        
        if (candidate.identifier == identifier) {
            return candidate;
        }
    }
    return DEFAULT_BOARD_DEFINITION;
};
