Java.perform(function() {
    var L = Java.use("android.util.Log");
    L.e("NP", "Script actif");

    // Cacher frida dans les strings
    try {
        var String = Java.use("java.lang.String");
        String.contains.overload("java.lang.CharSequence").implementation = function(s) {
            var check = s.toString();
            if (check.indexOf("frida") >= 0 || check.indexOf("gadget") >= 0 || 
                check.indexOf("xposed") >= 0 || check.indexOf("jshook") >= 0) {
                return false;
            }
            return this.contains(s);
        };
    } catch(e) {}

    // Cacher fichiers frida/jshook
    try {
        var File = Java.use("java.io.File");
        File.exists.implementation = function() {
            var p = this.getAbsolutePath();
            if (p.indexOf("frida") !== -1 || p.indexOf("jshook") !== -1 || 
                p.indexOf("jsonet") !== -1 || p.indexOf("re.zyg") !== -1) {
                return false;
            }
            return this.exists();
        };
    } catch(e) {}

    // Hook Dialog
    try {
        var D = Java.use("android.app.Dialog");
        D.show.implementation = function() {
            var t = ""; try { t = this.getTitle(); } catch(e) {}
            var c = ""; try { c = this.getClass().getName(); } catch(e) {}
            L.e("NP", "Dialog titre=" + t + " classe=" + c);
            this.show();
        };
    } catch(e) {}

    // Hook Activity
    try {
        var A = Java.use("android.app.Activity");
        A.onResume.implementation = function() {
            L.e("NP", "Activity=" + this.getClass().getName());
            this.onResume();
        };
    } catch(e) {}

    // Scanner classes
    try {
        Java.enumerateLoadedClasses({
            onMatch: function(n) {
                if (n.startsWith("player.normal") || n.startsWith("com.wn")) {
                    var l = n.toLowerCase();
                    if (l.indexOf("update") !== -1 || l.indexOf("force") !== -1 || 
                        l.indexOf("version") !== -1 || l.indexOf("dialog") !== -1 ||
                        l.indexOf("popup") !== -1 || l.indexOf("notice") !== -1 ||
                        l.indexOf("advert") !== -1) {
                        L.e("NP", "CLASSE=" + n);
                    }
                }
            },
            onComplete: function() { L.e("NP", "ScanFini"); }
        });
    } catch(e) {}
});
