# WindowServer

An experiment in implementing a Win32-like API in JavaScript, from the bottom up.

## What is this?
A mistake.

## What is this really?
There's a lot of projects going around that try to emulate the look and feel of operating systems, most of them have some sort of application interface, but they're all mostly just a bunch of fancy CSS. I wanted to see if I could make something that actually worked like a "real" operating system, in the browser.

## How does it work?
Processes are implemented as Web Workers, and communicate with the main thread via `postMessage`, with messages handled by various "subsystems". As a result, most traditionally synchronous Win32 APIs are actually asynchronous here, and as a result return Promises.

Some APIs will instead use `SharedArrayBuffer`s to communicate with the main thread, which can work synchronously, but this will be limited to small amounts of regularly updated data (i.e. cursor position, keyboard state, etc.).

## What's the point?
There isn't one.

## What's the goal?
To implement enough of the Win32 API to implement a simple application, like Notepad or Calculator.

