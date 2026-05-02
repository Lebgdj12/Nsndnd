Java.perform(function() {
    send("[NP] Script actif");

    try {
        var Dialog = Java.use("android.app.Dialog");
        Dialog.show.implementation = function() {
            var t = ""; try { t = this.getTitle(); } catch(e) {}
            var c = ""; try { c = this.getClass().getName(); } catch(e) {}
            send("[NP] Dialog titre=" + t + " classe=" + c);
            this.show();
        };
    } catch(e) { send("[NP] err Dialog: " + e); }

    try {
        Java.enumerateLoadedClasses({
            onMatch: function(name) {
                if (name.startsWith("player.normal") || name.startsWith("com.wn")) {
                    var l = name.toLowerCase();
                    if (l.indexOf("update") !== -1 || l.indexOf("upgrade") !== -1 || 
                        l.indexOf("force") !== -1 || l.indexOf("version") !== -1 ||
                        l.indexOf("popup") !== -1 || l.indexOf("notice") !== -1 ||
                        l.indexOf("dialog") !== -1) {
                        send("[NP] CLASSE: " + name);
                    }
                }
            },
            onComplete: function() { send("[NP] Scan fini"); }
        });
    } catch(e) { send("[NP] err scan: " + e); }
});
