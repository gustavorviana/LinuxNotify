# Linux Notify

This module provides an api for [freedesktop.org Notifications](https://specifications.freedesktop.org/notification-spec/latest/), working completely asynchronously.

The module works with all operating systems that work with "org.freedesktop.Notifications", that is, there is no dependency on libnotify.


Using D-Bus to send notifications, you can customize it however you want. See the examples below:

![Full example](https://raw.githubusercontent.com/gustavorviana/LinuxNotify/master/images/Full.png)

![Simple example](https://raw.githubusercontent.com/gustavorviana/LinuxNotify/master/images/Simple.png)

# Writing

## Simple notification

```typescript
import { LinuxNotify } from "./LinuxNotify";

//Creates the notification manager with the name of your application
const not = new LinuxNotify("LinuxNotify");

//Sets the default notification duration to 10 seconds
not.duration = 10000;

//Send simple notification
not.sendNotification("Hi", "Hello World");
```

## Full notification

```typescript
import { LinuxNotify } from "./LinuxNotify";

//Creates the notification manager with the name of your application
const not = new LinuxNotify("LinuxNotify");

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
});

//You can define the duration of the notification when you send it
full.send(5000)
```

# APi

* [LinuxNotify](#LinuxNotify-Class)

  * [program](#program)

  * [duration](#duration)

  * [desktopEntry](#desktopEntry)

  * [init()](#init())

  * [destroy()](#destroy()])

  * [freedesktop](#freedesktop)

  * [needInit](#needInit)

  * [createNotification()](#createNotification())

  * [sendNotification()](#sendNotification())

  * [getSended()](#getSended())

  * [destroyed](#destroyed)

  * [removeSended()](#removeSended())

  * [clearSended()](#clearSended())

* [Notification](#Notification)

  * [summary](#summary)

  * [body](#body)

  * [buttons](#buttons)

  * [hasButton](#hasButton)

  * [addButton](#addButton)

  * [removeButton](#removeButton)

  * [getButton](#getButton)

  * [hints](#hints)

  * [hasHint](#hasHint)

  * [setHint](#setHint)

  * [removeHint](#removeHint)

  * [getHint](#getHint)

  * [imagePath](#imagePath)

  * [isSended](#isSended)

  * [id](#id)

  * [send()](#send())

  * [close()](#close())

* [Events](#Events)
  * [sended](#sended)
  * [closed](#closed)
  * [action](#action)
  * [init](#init)
  * [destroy](#destroy)

## **LinuxNotify Class**

This class is responsible for managing communication with notifications.

When starting the class, there are two parameters: program, listenSystem.

* program: Must have a valid string.

* listenSystem: This field is not mandatory, but if the value is 'true', all system notifications will be heard.

### Notification management

If the 'listenSystem' option is active, system notifications will also be heard, but with the difference that only the notification id, button id (if any) and reason (in the case of the close event) will be available.

In the case of notifications sent in the current process, in addition to the event notification structure, the "notification" object will also be sent and in the case of the action event, the clicked button must also be returned.

But for this to happen, notifications must be on the "sent list", otherwise the notifications will be treated as a system notification.

## Variables and Methods

### **program**

Name of the program that should appear in the notification.

### **duration**

Default duration that notifications should be. By default the value is **5000**.

### **desktopEntry**

This field represents the path of the program's executable.

### **init()**

Initializes connections to the dbus to send notifications, this method is called automatically when sending a notification, but it must be called before working with the [freedesktop](#freedesktop) variable.

### **destroy()**

Terminate all dbus connections used by the class, if this field is called, a new object must be instantiated.

### **freedesktop**

Returns the object that represents the 'org.freedesktop.Notifications' service.

### **needInit**

Signals whether the connection to the 'org.freedesktop.Notifications' service should be started.

### **createNotification()**

**Parameters**

* summary: Notification summary

Creates and configures an [Notification](#Notification) object.
When using this method a string must be passed with the summary of the notification.

### **sendNotification()**

**Parameters**

* Summary: Notification summary

* body: Notification body

Creates a notification with the inserted table of contents and body and sends, this function returns an [Notification](#Notification) object.

### **getSended()**

**Parameters**

* id: Notification Id

Returns notifications that were sent by the process (if it has not been removed from the sent list)

### **destroyed**

Signals whether the connection to the notification service has been destroyed.

### **removeSended()**

**Parameters**

* id: Notification Id

Removes notification from the sent list.

### **clearSended()**

Removes all notifications from the sent list of the current process.

## **Notification**

Asynchronously, this object is responsible for sending notifications to the system.

### **summary**

Notification summary, must be a string

### **body**

Summary of notification, must be a string and accepts some html elements. See the table below or [click here](https://specifications.freedesktop.org/notification-spec/latest/ar01s04.html).

Tag | Type
-------------------------------- | -------------
```<b> ... </b>```               | Bold
```<i> ... </i>```               | Italic
```<u> ... </u>```               | Underline
```<a> ... </a>```               | Hyperlink
```<img src="..." alt="..."/>``` | Image

<br>

### **buttons**

This field returns a list of buttons in the { id, name } format.

### **hasButton**

**Parameters**

* id: Button Id

Checks whether the button has been added.

### **addButton**

**Parameters**

* id: Button Id
* text: Button text

Adds a new button to the notification.

Should throw an error if there is already a button with the same id.

### **getButton**

**Parameters**

* id: Button Id

Retrieves a button with the entered id or null if the button is not found.

### **removeButton**

**Parameters**

* id: Button Id

Removes the button if it exists.

If the button exists, the value true is returned, otherwise false must be returned.

### **hints**

This field returns a list of hints in the { type, name, value} format.

### **hasHint**

**Parameters**

* name: Hint name

Checks whether the tip has been set.

### **setHint**

**Parameters**

* name: Hint name
* value: Hint value (required)
* type: Hint type (In most cases not required)

Defines a new tip or replaces the previous one

[Click here](https://specifications.freedesktop.org/notification-spec/latest/ar01s08.html) to learn more about the hints.

### **removeHint**

**Parameters**

* name: Hint name

If it exists, remove the indicated hint.

If the hint exists, the value true is returned, otherwise false must be returned.

### **getHint**

**Parameters**

* name: Hint name

If it exists, remove the indicated hint.

### **imagePath**

This field defines or returns the image that should appear on the left side of the notification. The value must be a string, but null is also allowed.

### **isSended**

Signals if the notification was sent to the system.

### **id**

Retrieves the notification id (this id is generated when the notification is first sent).

### **send()**

**Parameters**

* duration: This field defines the customized duration of the notification.

This field defines the customized duration of the notification.

It will send an error if the notification is resent with the previous content, so I recommend changing the content of the notification if you want to reuse it (changing the summary or the body).

### **close()**

Closes the notification, no error is thrown if the notification does not exist.

# **Events**

The LinuxNotify and Notifications objects implement the EventEmitter object, which makes it easier to hear the events of each class, but some events are applied only to one or the other object.

## **Base structure**

All notification events must have the  below:

```typescript
  {
    id: number;
    notification: Notification;
  }
```

* id: Notification Id
* notification: Event owner (must return null if it is a notification from another process)

### **sended**

Signals when a notification was sent by the notification manager.

This event has only the [base structure](#Base-structure).

**Can be called by**

* [x] Notification
* [x] LinuxNotify

### **closed**

Signals when notification is closed.

The event structure is composed of the [base structure](#Base-structure) and the parameters:

* reason: Reason for closing, returns a string.
* code: Closure code, returns a number.

**Can be called by**

* [x] Notification
* [x] LinuxNotify

### **action**

This event signals when a button is pressed.

The event structure is composed of the [base structure](#Base-structure) and the parameters:

* button: Button that was pressed.

The button parameter returns an object that looks like:

```typescript
  {
    id: string;
    text: string;
  }
```

The "text" parameter must return null if the notification was sent by another process.

**Can be called by**

* [x] Notification
* [x] LinuxNotify

### **init**

**Can be called by**

Signals when the notification manager has been started.

It returns no arguments.

* [] Notification
* [x] LinuxNotify

### **destroy**

**Can be called by**

Signals when the notification manager is destroyed.

It returns no arguments.

* [] Notification
* [x] LinuxNotify
