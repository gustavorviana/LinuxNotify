import { LinuxNotify } from "./LinuxNotify";
import path from 'path';

//Creates the notification manager with the name of your application
const not = new LinuxNotify("LinuxNotify", true);

//Sets the default notification duration to 10 seconds
not.duration = 10000;

not.on('action', (e) => {

    console.log(`The '${e.notification ? e.notification.summary : e.id}' notification had the '${e.button.text || e.button.id}' button pressed.`);
});


not.on('closed', (e) => {
    console.log(`The notification '${e.notification ? e.notification.summary : e.id}' ended for reason '${e.reason}'.`);
});


// //Send simple notify
// not.sendNotification("Hi", "Hello World");

//Create a notification object
let full = not.createNotification("Full");

//Defines the notification body (accepts html, see more at https://specifications.freedesktop.org/notification-spec/latest/ar01s04.html)
full.body = "Click on one of my buttons. <br> Or if you prefer you can click the <b>x</b> to close!";

//Defines the notification image.
full.imagePath = path.resolve('../images/system-file-manager.png');

//Add buttons to notification (there is no button limit)
full.addButton('btn1', "Button 1");
full.addButton('btn2', "Button 2");
full.addButton('btn3', 'Button 3');

//Leave the notification icon with the Firefox icon
full.setHint('desktop-entry', 'firefox');

//You can listen to notifications
full.on('closed', (e) => {
    console.log("Closed");
    not.destroy();
});

//You can define the duration of the notification when you send it
full.send(5000)