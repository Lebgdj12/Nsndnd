Java.perform(function() {

    // 1. Dialog standard
    try {
        var Dialog = Java.use("android.app.Dialog");
        Dialog.show.implementation = function() {
            var t = ""; try { t = this.getTitle(); } catch(e) {}
            var c = ""; try { c = this.getClass().getName(); } catch(e) {}
            console.log("[NP] Dialog titre=" + t + " classe=" + c);
            this.show();
        };
    } catch(e) { console.log("[NP] err Dialog: " + e); }

    // 2. AlertDialog.Builder
    try {
        var Builder = Java.use("android.app.AlertDialog$Builder");
        Builder.show.overload().implementation = function() {
            console.log("[NP] AlertDialog.Builder");
            this.show();
        };
    } catch(e) {}

    // 3. PopupWindow
    try {
        var Popup = Java.use("android.widget.PopupWindow");
        Popup.showAtLocation.implementation = function() {
            console.log("[NP] PopupWindow.showAtLocation");
            this.showAtLocation.apply(this, arguments);
        };
        Popup.showAsDropDown.implementation = function() {
            console.log("[NP] PopupWindow.showAsDropDown");
            this.showAsDropDown.apply(this, arguments);
        };
    } catch(e) {}

    // 4. Activity en style dialog
    try {
        var Activity = Java.use("android.app.Activity");
        Activity.onResume.implementation = function() {
            var name = this.getClass().getName();
            console.log("[NP] Activity onResume: " + name);
            this.onResume();
        };
    } catch(e) {}

    // 5. WindowManager.addView (overlay)
    try {
        var WM = Java.use("android.view.WindowManagerImpl");
        WM.addView.overload("android.view.View", "android.view.ViewGroup$LayoutParams").implementation = function(view, params) {
            var type = ""; try { type = "" + params.type; } catch(e) {}
            console.log("[NP] addView type=" + type);
            this.addView(view, params);
        };
    } catch(e) {}

    // 6. Toast
    try {
        var Toast = Java.use("android.widget.Toast");
        Toast.show.implementation = function() {
            var text = ""; try { text = this.getView().findViewById(16908308).getText(); } catch(e) {}
            console.log("[NP] Toast: " + text);
            this.show();
        };
    } catch(e) {}

    // 7. Enumerer les classes NP Manager
    try {
        Java.enumerateLoadedClasses({
            onMatch: function(name) {
                if (name.startsWith("player.normal") || name.startsWith("com.wn")) {
                    var l = name.toLowerCase();
                    if (l.indexOf("update") !== -1 || l.indexOf("upgrade") !== -1 || 
                        l.indexOf("force") !== -1 || l.indexOf("version") !== -1 ||
                        l.indexOf("popup") !== -1 || l.indexOf("notice") !== -1 ||
                        l.indexOf("dialog") !== -1 || l.indexOf("alert") !== -1) {
                        console.log("[NP] CLASSE: " + name);
                    }
                }
            },
            onComplete: function() { console.log("[NP] Scan fini"); }
        });
    } catch(e) {}

});
