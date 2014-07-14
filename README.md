# ajax-local #
==============

Quite funny, the most popular HTML5 game engine phaser cannot work on local file system.

It's a big impact, since it cannot run in cordova-based games.

Is it possble to find some workaround to allow AJAX to load resources from local file system?

# How ? #
=============
Here are some experiments to:

* convert data file (.json, .csv, etc.) to js file;
* patch XMLHttpRequest;
* patch jQuery;
* patch phaser;
* etc.

