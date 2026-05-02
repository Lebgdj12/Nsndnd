Java.perform(function() {

    // 1. Hook Dialog.show() pour logger et bloquer
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
    } catch(e) { console.log("[NP] Dialog err: " + e); }

    // 2. Hook AlertDialog.Builder
    try {
        var Builder = Java.use("android.app.AlertDialog$Builder");
        Builder.show.overload().implementation = function() {
            console.log("[NP] AlertDialog.Builder.show()");
            this.show();
        };
    } catch(e) {}

    // 3. Chercher les classes update/force dans l'app
    try {
        Java.enumerateLoadedClasses({
            onMatch: function(name) {
                if (name.toLowerCase().indexOf("update") !== -1 ||
                    name.toLowerCase().indexOf("upgrade") !== -1 ||
                    name.toLowerCase().indexOf("force") !== -1 ||
                    name.toLowerCase().indexOf("versioncheck") !== -1) {
                    if (name.startsWith("com.wn") || name.startsWith("player")) {
                        console.log("[NP] CLASSE TROUVEE: " + name);
                    }
                }
            },
            onComplete: function() {}
        });
    } catch(e) {}

    // 4. Hook setContentView pour detecter le dialog layout
    try {
        var Activity = Java.use("android.app.Activity");
        Activity.setContentView.overload("int").implementation = function(id) {
            console.log("[NP] setContentView id=" + id);
            this.setContentView(id);
        };
    } catch(e) {}

});
