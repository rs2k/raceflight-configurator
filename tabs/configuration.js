'use strict';

TABS.configuration = {};

TABS.configuration.initialize = function (callback, scrollPosition) {
    var self = this;

    if (GUI.active_tab != 'configuration') {
        GUI.active_tab = 'configuration';
        googleAnalytics.sendAppView('Configuration');
    }

    var F4Targets = [
        "VRCR",
        "REVN",
        "BJF4",
        "REVO",
        "SPK2",
        "AFF4",
        "VRCO"
    ]
    var F3Targets = [
        "CHF3",
        "SDF3",
        "CLBR",
        "SRF3",
        "MOTO",
        "SPKY"
    ]

    if (F4Targets.indexOf(CONFIG.boardIdentifier) >= 0) {
        CONFIG.boardMCU = "F4";
    } else if (F3Targets.indexOf(CONFIG.boardIdentifier) >= 0) {
        CONFIG.boardMCU = "F3";    
    } else    {
        CONFIG.boardMCU = "F1";    
    }

    function load_config() {
        MSP.send_message(MSP_codes.MSP_BF_CONFIG, false, false, load_serial_config);
    }

    function load_serial_config() {
        var next_callback = load_rc_map;
        if (semver.lt(CONFIG.apiVersion, "1.6.0")) {
            MSP.send_message(MSP_codes.MSP_CF_SERIAL_CONFIG, false, false, next_callback);
        } else {
            next_callback();
        }
    }

    function load_rc_map() {
        MSP.send_message(MSP_codes.MSP_RX_MAP, false, false, load_misc);
    }

    function load_misc() {
        MSP.send_message(MSP_codes.MSP_MISC, false, false, load_acc_trim);
    }
    
    function load_acc_trim() {
        MSP.send_message(MSP_codes.MSP_ACC_TRIM, false, false, load_arming_config);
    }

    function load_arming_config() {
        var next_callback = load_loop_time;
        if (semver.gte(CONFIG.apiVersion, "1.8.0")) {
            MSP.send_message(MSP_codes.MSP_ARMING_CONFIG, false, false, next_callback);
        } else {
            next_callback();
        }
    }
    
    function load_loop_time() {
        var next_callback = load_3d;
        if (semver.gte(CONFIG.apiVersion, "1.8.0")) {
            MSP.send_message(MSP_codes.MSP_LOOP_TIME, false, false, next_callback);
        } else {
            next_callback();
        }
    }

    function load_3d() {
        var next_callback = load_html;
        if (semver.lt(CONFIG.apiVersion, "1.14.0")) {
            MSP.send_message(MSP_codes.MSP_3D, false, false, next_callback);
        } else {
            next_callback();
        }
    }

    function load_html() {
        $('#content').load("./tabs/configuration.html", process_html);
    }

    MSP.send_message(MSP_codes.MSP_IDENT, false, false, load_config);

    function recalculate_cycles_sec() {
        var looptime = $('input[name="looptime"]').val();

        var message = 'Max';
        if (looptime > 0) {
            message = parseFloat((1 / looptime) * 1000 * 1000).toFixed(0);
        }
        
        $('input[name="looptimehz"]').val(message);
    }
    
    function process_html() {
        // translate to user-selected language
        localize();

        var mixer_list_e = $('select.mixerList');
        for (var i = 0; i < mixerList.length; i++) {
            mixer_list_e.append('<option value="' + (i + 1) + '">' + mixerList[i].name + '</option>');
        }

        mixer_list_e.change(function () {
            var val = parseInt($(this).val());

            BF_CONFIG.mixerConfiguration = val;

            $('.mixerPreview img').attr('src', './resources/motor_order/' + mixerList[val - 1].image + '.svg');
        });

        // select current mixer configuration
        mixer_list_e.val(BF_CONFIG.mixerConfiguration).change();

        // generate features
        var features = [
            {bit: 0, group: 'rxMode', mode: 'group', name: 'RX_PPM', description: 'PPM RX input'},
            {bit: 1, group: 'batteryVoltage', name: 'VBAT', description: 'Battery voltage monitoring'},
            {bit: 2, group: 'other', name: 'INFLIGHT_ACC_CAL', description: 'In-flight level calibration'},
            {bit: 3, group: 'rxMode', mode: 'group', name: 'RX_SERIAL', description: 'Serial-based receiver (SPEKSAT, SBUS, SUMD)'},
            {bit: 4, group: 'esc', name: 'MOTOR_STOP', description: 'Don\'t spin the motors when armed'},
            {bit: 5, group: 'other', name: 'SERVO_TILT', description: 'Servo gimbal'},
            {bit: 6, group: 'other', name: 'SOFTSERIAL', description: 'Enable CPU based serial ports'},
            {bit: 7, group: 'gps', name: 'GPS', description: 'Configure port scenario first'},
            {bit: 8, group: 'rxFailsafe', name: 'FAILSAFE', description: 'Failsafe settings on RX signal loss'},
            {bit: 9, group: 'other', name: 'SONAR', description: 'Sonar'},
            {bit: 10, group: 'other', name: 'TELEMETRY', description: 'Telemetry output'},
            {bit: 11, group: 'batteryCurrent', name: 'CURRENT_METER', description: 'Battery current monitoring'},
            {bit: 12, group: 'other', name: '3D', description: '3D mode (for use with reversible ESCs)'},
            {bit: 13, group: 'rxMode', mode: 'group', name: 'RX_PARALLEL_PWM', description: 'PWM RX input'},
            {bit: 14, group: 'rxMode', mode: 'group', name: 'RX_MSP', description: 'MSP RX input'},
            {bit: 15, group: 'rssi', name: 'RSSI_ADC', description: 'Analog RSSI input'},
            {bit: 16, group: 'other', name: 'LED_STRIP', description: 'Addressable RGB LED strip support'},
            {bit: 17, group: 'other', name: 'DISPLAY', description: 'OLED Screen Display'},
            {bit: 18, group: 'esc', name: 'ONESHOT125', description: 'ONESHOT ESC support (disconnect ESCs, remove props)'},
            {bit: 19, group: 'other', name: 'BLACKBOX', description: 'Blackbox flight data recorder'},
            {bit: 21, group: 'raceflight', name: 'MULTISHOT', description: 'MULTISHOT ESC support'},            
            {bit: 22, group: 'raceflight', name: 'USE_PWM_RATE', description: 'no gyro sync'},            
            // {bit: 23, group: 'raceflight', name: 'RESERVED', description: ''},
            {bit: 24, group: 'raceflight', name: 'TX_STYLE_EXPO', description: 'TX Style expo'},
            {bit: 25, group: 'raceflight', name: 'SBUS_INVERTER', description: 'Control SBus hardware inverter'}
        ];
        
        if (semver.gte(CONFIG.apiVersion, "1.12.0")) {
            features.push(
                {bit: 20, group: 'other', name: 'CHANNEL_FORWARDING', description: 'Forward aux channels to servo outputs'}
            );
        }

        var radioGroups = [];
        
        var features_e = $('.features');
        for (var i = 0; i < features.length; i++) {
            var row_e;
            
            if (features[i].mode === 'group') {
                row_e = $('<tr><td style="width: 15px;"><input style="width: 13px;" class="feature" id="feature-'
                        + i
                        + '" value="'
                        + features[i].bit
                        + '" title="'
                        + features[i].name
                        + '" type="radio" name="'
                        + features[i].group
                        + '" /></td><td><label for="feature-'
                        + i
                        + '">'
                        + features[i].name
                        + '</label></td><td><span>'
                        + features[i].description
                        + '</td><span>');
                radioGroups.push(features[i].group);
            } else {
                row_e = $('<tr><td><input class="feature toggle"'
                        + i
                        + '" name="'
                        + features[i].name
                        + '" title="'
                        + features[i].name
                        + '" type="checkbox"/></td><td><label for="feature-'
                        + i
                        + '">'
                        + features[i].name
                        + '</label></td><td><span>'
                        + features[i].description
                        + '</span></td>');
                
                var feature_e = row_e.find('input.feature');

                feature_e.prop('checked', bit_check(BF_CONFIG.features, features[i].bit));
                feature_e.data('bit', features[i].bit);
            }

            features_e.each(function () {
                if ($(this).hasClass(features[i].group)) {
                    $(this).append(row_e);
                }
            });
        }

        for (var i = 0; i < radioGroups.length; i++) {
            var group = radioGroups[i];
            var controls_e = $('input[name="' + group + '"].feature');
            
            
            controls_e.each(function() {
                var bit = parseInt($(this).attr('value'));
                var state = bit_check(BF_CONFIG.features, bit);
                
                $(this).prop('checked', state);
            });
        }
        
// START OF RF_LOOP_CTRL
        var RFLoopCtrl_e = $('select.rf_loop_ctrl');
      
        var RFLoopCtrlList;
        var RFLoopCtrlLookup = ["H1","H2","H4","H8","L1","M1","M2","M4","M8"]
        
        /*
        { id: 0, name: "H1"},
        { id: 1, name: "H2"},
        { id: 2, name: "H4"},
        { id: 3, name: "H8"},
        { id: 4, name: "L1"},
        { id: 5, name: "M1"},
        { id: 6, name: "M2"},
        { id: 7, name: "M4"},
        { id: 8, name: "M8"}
        */
        
        switch (CONFIG.boardMCU) {
            case "F4":
                RFLoopCtrlList = [0,1,2,3,4,5,6,7,8]
                break;
            case "F3":
                RFLoopCtrlList = [0,1,2,3,4,5,6,7,8]
                break;
            default: // F1 Targets
                RFLoopCtrlList = [4,6]
            }
      var inCompatibleLoopCtrlValues = [3,8]

        //not show M8 and H8 is OneShot125 (18) is enabled and use_pwm_rate (22) is not enabled?
        if(bit_check(BF_CONFIG.features, 18) && !bit_check(BF_CONFIG.features, 22) ) {
            for(var i = 0; i < inCompatibleLoopCtrlValues.length; i++) {
                var index = RFLoopCtrlList.indexOf(inCompatibleLoopCtrlValues[i]);
                if(index >= 0) {
                    RFLoopCtrlList.splice(index,1);
                }
            }
        }
            
        for (var i = 0; i < RFLoopCtrlList.length; i++) {
            RFLoopCtrl_e.append('<option value="' + (RFLoopCtrlList[i]) + '">' + RFLoopCtrlLookup[RFLoopCtrlList[i]] + '</option>');
        }
        // Load current stored value
        RFLoopCtrl_e.val(MISC.rf_loop_ctrl);

        RFLoopCtrl_e.change(function () {
            MISC.rf_loop_ctrl = parseInt($(this).val());
        });
        
// END OF RF_LOOP_CTRL                

        // generate MOTOR_PWM_RATE
        var rfMotorPWMRate = [
            '50',
            '400',
            '500',
            '1000',
            '2000',
            '2666',
            '4000',
            '8000',
            '16000',
            '16666',
            '24000',
            '32000',
            '64000'
        ];

        // generate ACC_HARDWARE
        var rfAccHardware = [
            'Auto-detect',
            'Gyro-only',
            'ADXL345',
            'MPU6050 integrated',
            'MMA8452',
            'BMA280',
            'LSM303DLHC',
            'MPU6000',
            'MPU6500'
        ];

        // generate GPS
        var gpsProtocols = [
            'NMEA',
            'UBLOX'
        ];

        var gpsBaudRates = [
            '115200',
            '57600',
            '38400',
            '19200',
            '9600'
        ];

        var gpsSbas = [
            'Disabled',
            'Auto-detect',
            'European EGNOS',
            'North American WAAS',
            'Japanese MSAS',
            'Indian GAGAN'
        ];

        // Generate ACC_HARDWARE dropdown menu
        var acc_hardware_e = $('select.acc_hardware');
        for (var i = 0; i < rfAccHardware.length; i++) {
            acc_hardware_e.append('<option value="' + i + '">' + i + " - " + rfAccHardware[i] + '</option>');
        }

        var motor_pwm_rate_e = $('select.motor_pwm_rate');
        for (var i = 0; i < rfMotorPWMRate.length; i++) {
            motor_pwm_rate_e.append('<option value="' + rfMotorPWMRate[i] + '">' + rfMotorPWMRate[i] + '</option>');
        }        
        var gps_protocol_e = $('select.gps_protocol');
        for (var i = 0; i < gpsProtocols.length; i++) {
            gps_protocol_e.append('<option value="' + i + '">' + gpsProtocols[i] + '</option>');
        }

        gps_protocol_e.change(function () {
            MISC.gps_type = parseInt($(this).val());
        });

        gps_protocol_e.val(MISC.gps_type);
        
        var gps_baudrate_e = $('select.gps_baudrate');
        for (var i = 0; i < gpsBaudRates.length; i++) {
            gps_baudrate_e.append('<option value="' + gpsBaudRates[i] + '">' + gpsBaudRates[i] + '</option>');
        }
    
        if (semver.lt(CONFIG.apiVersion, "1.6.0")) {
            gps_baudrate_e.change(function () {
                SERIAL_CONFIG.gpsBaudRate = parseInt($(this).val());
            });
            gps_baudrate_e.val(SERIAL_CONFIG.gpsBaudRate);
        } else {
            gps_baudrate_e.prop("disabled", true);
            gps_baudrate_e.parent().hide();
        }
        
        
        var gps_ubx_sbas_e = $('select.gps_ubx_sbas');
        for (var i = 0; i < gpsSbas.length; i++) {
            gps_ubx_sbas_e.append('<option value="' + (i - 1) + '">' + gpsSbas[i] + '</option>');
        }

        gps_ubx_sbas_e.change(function () {
            MISC.gps_ubx_sbas = parseInt($(this).val());
        });

        gps_ubx_sbas_e.val(MISC.gps_ubx_sbas);


        // generate serial RX
        var serialRXtypes = [
            'SPEKTRUM1024',
            'SPEKTRUM2048',
            'SBUS',
            'SUMD',
            'SUMH',
            'XBUS_MODE_B',
            'XBUS_MODE_B_RJ01'
        ];

        var serialRX_e = $('select.serialRX');
        for (var i = 0; i < serialRXtypes.length; i++) {
            serialRX_e.append('<option value="' + i + '">' + serialRXtypes[i] + '</option>');
        }

        serialRX_e.change(function () {
            BF_CONFIG.serialrx_type = parseInt($(this).val());
        });

        // select current serial RX type
        serialRX_e.val(BF_CONFIG.serialrx_type);

        // for some odd reason chrome 38+ changes scroll according to the touched select element
        // i am guessing this is a bug, since this wasn't happening on 37
        // code below is a temporary fix, which we will be able to remove in the future (hopefully)
        $('#content').scrollTop((scrollPosition) ? scrollPosition : 0);

        // fill board alignment
        $('input[name="board_align_roll"]').val(BF_CONFIG.board_align_roll);
        $('input[name="board_align_pitch"]').val(BF_CONFIG.board_align_pitch);
        $('input[name="board_align_yaw"]').val(BF_CONFIG.board_align_yaw);

        // fill accel trims
        $('input[name="roll"]').val(CONFIG.accelerometerTrims[1]);
        $('input[name="pitch"]').val(CONFIG.accelerometerTrims[0]);

        // fill magnetometer
        $('input[name="mag_declination"]').val(MISC.mag_declination);

        //fill motor disarm params and FC loop time        
        if(semver.gte(CONFIG.apiVersion, "1.8.0")) {
            $('input[name="autodisarmdelay"]').val(ARMING_CONFIG.auto_disarm_delay);
            $('input[name="disarmkillswitch"]').prop('checked', ARMING_CONFIG.disarm_kill_switch);
            $('div.disarm').show();
            if(bit_check(BF_CONFIG.features, 4))//MOTOR_STOP
                $('div.disarmdelay').show();
            else
                $('div.disarmdelay').hide();

            // fill FC loop time
            $('input[name="looptime"]').val(FC_CONFIG.loopTime);

            recalculate_cycles_sec();
            
            $('div.cycles').show();
        }
        if(semver.gte(CONFIG.apiVersion, "1.14.0")) {
            if(bit_check(BF_CONFIG.features, 22))//USE_PWM_RATE
                $('div.motor_pwm_rate').show();
            else
                $('div.motor_pwm_rate').hide();
        }
        
        // hide notes by default
        $('div.rfLoopCtrlNote').hide();
        $('div.rfWrongFirmwareNote').hide();
        
        // fill throttle
        $('input[name="minthrottle"]').val(MISC.minthrottle);
        $('input[name="midthrottle"]').val(MISC.midrc);
        $('input[name="maxthrottle"]').val(MISC.maxthrottle);
        $('input[name="failsafe_throttle"]').val(MISC.failsafe_throttle);
        $('input[name="mincommand"]').val(MISC.mincommand);

        // fill battery
        $('input[name="mincellvoltage"]').val(MISC.vbatmincellvoltage);
        $('input[name="maxcellvoltage"]').val(MISC.vbatmaxcellvoltage);
        $('input[name="warningcellvoltage"]').val(MISC.vbatwarningcellvoltage);
        $('input[name="voltagescale"]').val(MISC.vbatscale);

        // fill current
        $('input[name="currentscale"]').val(BF_CONFIG.currentscale);
        $('input[name="currentoffset"]').val(BF_CONFIG.currentoffset);
        $('input[name="multiwiicurrentoutput"]').prop('checked', MISC.multiwiicurrentoutput);

        if (semver.gte(CONFIG.apiVersion, "1.14.0")) {
            //fill motor_pwm_rate
            $('select.motor_pwm_rate').val(MISC.motor_pwm_rate);

            //fill rf_loop_ctrl        
            $('select.rf_loop_ctrl').val(MISC.rf_loop_ctrl);

            //fill acc_hardware
            $('select.acc_hardware').val(MISC.acc_hardware);
        } else {
            $('div.motor_pwm_rate').show();
            $('select.motor_pwm_rate').prop('disabled', 'disabled');
            $('select.rf_loop_ctrl').prop('disabled', 'disabled');
            $('div.rfWrongFirmwareNote').show();
            $('.raceflight').addClass("cursorNotAllowed");
            $('.raceflight div').addClass("pointerDisabled");
        }
        
        //fill 3D
        if (semver.lt(CONFIG.apiVersion, "1.14.0")) {
            $('.tab-configuration .3d').hide();
        } else {
            $('input[name="3ddeadbandlow"]').val(_3D.deadband3d_low);
            $('input[name="3ddeadbandhigh"]').val(_3D.deadband3d_high);
            $('input[name="3dneutral"]').val(_3D.neutral3d);
            $('input[name="3ddeadbandthrottle"]').val(_3D.deadband3d_throttle);
        }
        
        // UI hooks
        $('input[name="looptime"]').change(function() {
            recalculate_cycles_sec();
        });

        $('input[type="checkbox"].feature', features_e).change(function () {
            var element = $(this),
                index = element.data('bit'),
                state = element.is(':checked');

            if (state) {    // If feature is turned on 
                BF_CONFIG.features = bit_set(BF_CONFIG.features, index);
                if(element.attr('name') === 'MOTOR_STOP')                    
                    $('div.disarmdelay').show();
                // Show motor pwm rate box if feature is enabled
                if(element.attr('name') === 'USE_PWM_RATE') {
                    $('div.motor_pwm_rate').show();
                    if(bit_check(BF_CONFIG.features, 18))
                        $('div.rfLoopCtrlNote').show();
                }
                // Disable MULTISHOT if ONESHOT is enabled
                if(element.attr('name') === 'ONESHOT125') {
                    if ($('input[name="MULTISHOT"]').prop('checked'))
                        $('input[name="MULTISHOT"]').click();
                }
                // Disable ONESHOT if MULTISHOT is enabled
                if(element.attr('name') === 'MULTISHOT') {
                    if ($('input[name="ONESHOT125"]').prop('checked'))
                        $('input[name="ONESHOT125"]').click();
                }
            } else {        // If feature is turned off
                BF_CONFIG.features = bit_clear(BF_CONFIG.features, index);
                if(element.attr('name') === 'MOTOR_STOP')
                    $('div.disarmdelay').hide();
                // Hide motor pwm rate box if feature is disabled
                if(element.attr('name') === 'USE_PWM_RATE') {
                    $('div.rfLoopCtrlNote').hide();
                    $('div.motor_pwm_rate').hide();
                }
            }
        });
        
        // UI hooks
        $('input[type="radio"].feature', features_e).change(function () {
            var element = $(this),
                group = element.attr('name');

            var controls_e = $('input[name="' + group + '"]');
            var selected_bit = controls_e.filter(':checked').val();
            
            controls_e.each(function() {
                var bit = $(this).attr('value');
                
                var selected = (selected_bit == bit);
                if (selected) {
                    BF_CONFIG.features = bit_set(BF_CONFIG.features, bit);
                } else {
                    BF_CONFIG.features = bit_clear(BF_CONFIG.features, bit);
                }

            });
        });
        
    
        $('a.save').click(function () {
            // gather data that doesn't have automatic change event bound
            BF_CONFIG.board_align_roll = parseInt($('input[name="board_align_roll"]').val());
            BF_CONFIG.board_align_pitch = parseInt($('input[name="board_align_pitch"]').val());
            BF_CONFIG.board_align_yaw = parseInt($('input[name="board_align_yaw"]').val());

            CONFIG.accelerometerTrims[1] = parseInt($('input[name="roll"]').val());
            CONFIG.accelerometerTrims[0] = parseInt($('input[name="pitch"]').val());
            MISC.mag_declination = parseFloat($('input[name="mag_declination"]').val());
            
            // motor disarm
            if(semver.gte(CONFIG.apiVersion, "1.8.0")) {
                ARMING_CONFIG.auto_disarm_delay = parseInt($('input[name="autodisarmdelay"]').val());
                ARMING_CONFIG.disarm_kill_switch = ~~$('input[name="disarmkillswitch"]').is(':checked'); // ~~ boolean to decimal conversion
                FC_CONFIG.loopTime = parseInt($('input[name="looptime"]').val());
            }
            
            MISC.minthrottle = parseInt($('input[name="minthrottle"]').val());
            MISC.midrc = parseInt($('input[name="midthrottle"]').val());
            MISC.maxthrottle = parseInt($('input[name="maxthrottle"]').val());
            MISC.failsafe_throttle = parseInt($('input[name="failsafe_throttle"]').val());
            MISC.mincommand = parseInt($('input[name="mincommand"]').val());

            MISC.vbatmincellvoltage = parseFloat($('input[name="mincellvoltage"]').val());
            MISC.vbatmaxcellvoltage = parseFloat($('input[name="maxcellvoltage"]').val());
            MISC.vbatwarningcellvoltage = parseFloat($('input[name="warningcellvoltage"]').val());
            MISC.vbatscale = parseInt($('input[name="voltagescale"]').val());

            BF_CONFIG.currentscale = parseInt($('input[name="currentscale"]').val());
            BF_CONFIG.currentoffset = parseInt($('input[name="currentoffset"]').val());
            MISC.multiwiicurrentoutput = ~~$('input[name="multiwiicurrentoutput"]').is(':checked'); // ~~ boolean to decimal conversion

            // Check for incompatible feature & loop_ctrl value
            if(bit_check(BF_CONFIG.features, 18) && !bit_check(BF_CONFIG.features, 22) ) {
                for(var i = 0; i < inCompatibleLoopCtrlValues.length; i++) {
                    if(inCompatibleLoopCtrlValues[i] == $('select.rf_loop_ctrl').val()) {
                        $('select.rf_loop_ctrl').val(4);
                        console.log("Incompatible rf_loop_ctrl value, reverting to L1");
                        GUI.log("Incompatible rf_loop_ctrl value, reverting to L1");
                    } else {
                        console.log("rf_loop_ctrl is compatible with desired features!");
                    }
                }
            }
               
            MISC.motor_pwm_rate = parseInt($('select.motor_pwm_rate').val());
            MISC.rf_loop_ctrl = parseInt($('select.rf_loop_ctrl').val());
            MISC.acc_hardware = parseInt($('select.acc_hardware').val());
            _3D.deadband3d_low = parseInt($('input[name="3ddeadbandlow"]').val());
            _3D.deadband3d_high = parseInt($('input[name="3ddeadbandhigh"]').val());
            _3D.neutral3d = parseInt($('input[name="3dneutral"]').val());
            _3D.deadband3d_throttle = ($('input[name="3ddeadbandthrottle"]').val());

            function save_serial_config() {
                if (semver.lt(CONFIG.apiVersion, "1.6.0")) {
                    MSP.send_message(MSP_codes.MSP_SET_CF_SERIAL_CONFIG, MSP.crunch(MSP_codes.MSP_SET_CF_SERIAL_CONFIG), false, save_misc);
                } else {
                    save_misc();
                }
            }

            function save_misc() {
                MSP.send_message(MSP_codes.MSP_SET_MISC, MSP.crunch(MSP_codes.MSP_SET_MISC), false, save_3d);
            }
            
            function save_3d() {
                MSP.send_message(MSP_codes.MSP_SET_3D, MSP.crunch(MSP_codes.MSP_SET_3D), false, save_acc_trim);
            }

            function save_acc_trim() {
                MSP.send_message(MSP_codes.MSP_SET_ACC_TRIM, MSP.crunch(MSP_codes.MSP_SET_ACC_TRIM), false
                                , semver.gte(CONFIG.apiVersion, "1.8.0") ? save_arming_config : save_to_eeprom);
            }

            function save_arming_config() {
                MSP.send_message(MSP_codes.MSP_SET_ARMING_CONFIG, MSP.crunch(MSP_codes.MSP_SET_ARMING_CONFIG), false, save_looptime_config);
            }

            function save_looptime_config() {
                MSP.send_message(MSP_codes.MSP_SET_LOOP_TIME, MSP.crunch(MSP_codes.MSP_SET_LOOP_TIME), false, save_to_eeprom);
            }

            function save_to_eeprom() {
                MSP.send_message(MSP_codes.MSP_EEPROM_WRITE, false, false, reboot);
            }

            function reboot() {
                GUI.log(chrome.i18n.getMessage('configurationEepromSaved'));

                GUI.tab_switch_cleanup(function() {
                    MSP.send_message(MSP_codes.MSP_SET_REBOOT, false, false, reinitialize);
                });
            }

            function reinitialize() {
                GUI.log(chrome.i18n.getMessage('deviceRebooting'));

                if (BOARD.find_board_definition(CONFIG.boardIdentifier).vcp) { // VCP-based flight controls may crash old drivers, we catch and reconnect
                    $('a.connect').click();
                    GUI.timeout_add('start_connection',function start_connection() {
                        $('a.connect').click();
                    },2000);
                } else {

                    GUI.timeout_add('waiting_for_bootup', function waiting_for_bootup() {
                        MSP.send_message(MSP_codes.MSP_IDENT, false, false, function () {
                            GUI.log(chrome.i18n.getMessage('deviceReady'));
                            TABS.configuration.initialize(false, $('#content').scrollTop());
                        });
                    },1500); // 1500 ms seems to be just the right amount of delay to prevent data request timeouts
                }
            }

            MSP.send_message(MSP_codes.MSP_SET_BF_CONFIG, MSP.crunch(MSP_codes.MSP_SET_BF_CONFIG), false, save_serial_config);
        });

        // status data pulled via separate timer with static speed
        GUI.interval_add('status_pull', function status_pull() {
            MSP.send_message(MSP_codes.MSP_STATUS);
        }, 250, true);

        GUI.content_ready(callback);
    }
};

TABS.configuration.cleanup = function (callback) {
    if (callback) callback();
};
