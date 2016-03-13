/*jslint node:true, vars:true, bitwise:true, unparam:true */
/*jshint unused:true */

var servoModule = require("jsupm_servo");
var request = require('ajax-request');
var mraa = require('mraa'); //require mraa
var servo = new servoModule.ES08A(5);
var localDoorStatus = null;
var lcd = require('jsupm_i2clcd');
var display = new lcd.Jhd1313m1(0, 0x3E, 0x62);
var myDigitalPin2 = new mraa.Gpio(2); //setup digital read on Digital pin #6 (D6)
myDigitalPin2.dir(mraa.DIR_IN); //set the gpio direction to input


function loop() {
    if (myDigitalPin2.read() === 1) {
        toggleDoor();
    } else {
        request('http://keyless-iot-roadshow.herokuapp.com/events/status_door.json?requester=edison&event[requester]=edison', function(err, res, body) {
            var status = JSON.parse(body).status;
            if (localDoorStatus != status){
                if (status === 'opened'){
                    open();
                } else {
                    close();   
                }
                localDoorStatus = status;
            }
            loop();
        });
    }
}

function open() {
    servo.setAngle(0);
    display.setCursor(0, 0);
    display.write('OPENED');
    display.setColor(0,255,0);    
}

function close() {
    servo.setAngle(90);
    display.setCursor(0, 0);
    display.write('CLOSED');
    display.setColor(255,0,0);   
}

function toggleDoor() {
    request('http://keyless-iot-roadshow.herokuapp.com/events/toggle_door.json?requester=edison&event[requester]=edison', function(err, res, body) {
        var status = JSON.parse(body).status;
        if (status === 'opened'){
            open();
        } else {
            close();   
        }
        setTimeout(function(){loop();}, 200);
    });
}

close();
loop();
