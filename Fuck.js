Java.perform(function() {
    var Log = Java.use("android.util.Log");
    Log.e("NP-HOOK", "Script actif");

    try {
        var Dialog = Java.use("android.app.Dialog");
        Dialog.show.implementation = function() {
            var t = ""; try { t = this.getTitle(); } catch(e) {}
            var c = ""; try { c = this.getClass().getName(); } catch(e) {}
            Log.e("NP-HOOK", "Dialog titre=" + t + " classe=" + c);
            this.show();
        };
    } catch(e) { Log.e("NP-HOOK", "err Dialog: " + e); }

    try {
        Java.enumerateLoadedClasses({
            onMatch: function(name) {
                if (name.startsWith("player.normal") || name.startsWith("com.wn")) {
                    var l = name.toLowerCase();
                    if (l.indexOf("update") !== -1 || l.indexOf("upgrade") !== -1 || 
                        l.indexOf("force") !== -1 || l.indexOf("version") !== -1 ||
                        l.indexOf("popup") !== -1 || l.indexOf("notice") !== -1 ||
                        l.indexOf("dialog") !== -1) {
                        Log.e("NP-HOOK", "CLASSE: " + name);
                    }
                }
            },
            onComplete: function() { Log.e("NP-HOOK", "Scan fini"); }
        });
    } catch(e) { Log.e("NP-HOOK", "err scan: " + e); }
});
