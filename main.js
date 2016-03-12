/*jslint node:true, vars:true, bitwise:true, unparam:true */
/*jshint unused:true */

var servoModule = require("jsupm_servo");
var request = require('ajax-request');
var servo = new servoModule.ES08A(5);
var mraa = require('mraa'); //require mraa
var localDoorStatus = null;
var lcd = require('jsupm_i2clcd');
var display = new lcd.Jhd1313m1(0, 0x3E, 0x62);
var myDigitalPin2 = new mraa.Gpio(2); //setup digital read on Digital pin #6 (D6)
myDigitalPin2.dir(mraa.DIR_IN); //set the gpio direction to input



/**
 * Rotate through a color pallette and display the
 * color of the background as text
 */
function rotateColors(display) {
    var red = 0;
    var green = 0;
    var blue = 0;
    display.setColor(red, green, blue);
    setInterval(function() {
        blue += 64;
        if (blue > 255) {
            blue = 0;
            green += 64;
            if (green > 255) {
                green = 0;
                red += 64;
                if (red > 255) {
                    red = 0;
                }
            }
        }
        display.setColor(red, green, blue);
        display.setCursor(0,0);
        display.write('red=' + red + ' grn=' + green + '  ');
        display.setCursor(1,0);
        display.write('blue=' + blue + '   ');  // extra padding clears out previous text
    }, 1000);
}

/**
 * Use the upm library to drive the two line display
 *
 * Note that this does not use the "lcd.js" code at all
 */
function useUpm() {
    var lcd = require('jsupm_i2clcd');
    var display = new lcd.Jhd1313m1(0, 0x3E, 0x62);
    display.setCursor(1, 1);
    display.write('hi there');
    display.setCursor(0,0);
    display.write('more text');
    //rotateColors(display);
}



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
}

function close() {
    servo.setAngle(90);
    display.setCursor(0, 0);
    display.write('CLOSED');
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
