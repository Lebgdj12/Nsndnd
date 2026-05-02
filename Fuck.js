Java.perform(function() {

    // 1. Cacher Frida dans /proc/self/maps
    try {
        var fopen = Module.findExportByName(null, "fopen");
        Interceptor.attach(fopen, {
            onEnter: function(args) {
                var path = args[0].readCString();
                if (path && (path.indexOf("/proc/") !== -1 && path.indexOf("/maps") !== -1)) {
                    this.isMaps = true;
                }
            },
            onLeave: function(retval) {
                if (this.isMaps) {
                    var fgets = Module.findExportByName(null, "fgets");
                    if (fgets) {
                        Interceptor.attach(fgets, {
                            onEnter: function(args) {},
                            onLeave: function(retval) {
                                try {
                                    var line = args[1].readCString();
                                    if (line && (line.indexOf("frida") !== -1 || line.indexOf("gadget") !== -1 || line.indexOf("linjector") !== -1)) {
                                        args[1].writeCString("");
                                    }
                                } catch(e) {}
                            }
                        });
                    }
                }
            }
        });
    } catch(e) {}

    // 2. Bloquer connexion au port Frida
    try {
        var connect = Module.findExportByName(null, "connect");
        Interceptor.attach(connect, {
            onEnter: function(args) {
                try {
                    var addr = args[1].readByteArray(8);
                    var port = (new Uint8Array(addr)[2] << 8) | new Uint8Array(addr)[3];
                    if (port === 27042 || port === 27043) {
                        args[2] = ptr(0);
                    }
                } catch(e) {}
            }
        });
    } catch(e) {}

    // 3. Cacher les threads Frida
    try {
        var opendir = Module.findExportByName(null, "opendir");
        Interceptor.attach(opendir, {
            onEnter: function(args) {
                try {
                    var path = args[0].readCString();
                    if (path && path.indexOf("/proc/") !== -1 && path.indexOf("/task") !== -1) {
                        this.isTask = true;
                    }
                } catch(e) {}
            }
        });
    } catch(e) {}

    // 4. Hook Dialog.show APRES un délai
    setTimeout(function() {
        Java.perform(function() {
            try {
                var Dialog = Java.use("android.app.Dialog");
                Dialog.show.implementation = function() {
                    var title = "";
                    try { title = this.getTitle(); } catch(e) {}
                    var cls = "";
                    try { cls = this.getClass().getName(); } catch(e) {}
                    console.log("[NP] Dialog titre=" + title + " classe=" + cls);
                    this.show();
                };
            } catch(e) {}

            try {
                Java.enumerateLoadedClasses({
                    onMatch: function(name) {
                        if (name.startsWith("player.normal") || name.startsWith("com.wn")) {
                            var lower = name.toLowerCase();
                            if (lower.indexOf("update") !== -1 || lower.indexOf("upgrade") !== -1 || lower.indexOf("force") !== -1 || lower.indexOf("version") !== -1) {
                                console.log("[NP] CLASSE: " + name);
                            }
                        }
                    },
                    onComplete: function() {}
                });
            } catch(e) {}
        });
    }, 3000);

});
