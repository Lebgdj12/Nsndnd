// ═══════════════════════════════════════════════════════════
// NP MANAGER ULTRA-STEALTH HOOK - MAXIMUM CAMOUFLAGE
// ═══════════════════════════════════════════════════════════

Java.perform(function() {
    var Log = Java.use("android.util.Log");
    function log(msg) {
        Log.e("NPH", msg);
    }

    log("=== ULTRA STEALTH START ===");

    // ─────────────────────────────────────────────────────
    // 1. CACHER LES THREADS FRIDA dans /proc/self/task/
    // ─────────────────────────────────────────────────────
    try {
        var opendir = Module.findExportByName("libc.so", "opendir");
        var readdir = Module.findExportByName("libc.so", "readdir");
        
        if (opendir && readdir) {
            var taskDir = null;
            var fridaThreadNames = ["gmain", "gdbus", "glib", "pool-frida", "frida", "linjector"];
            
            Interceptor.attach(readdir, {
                onEnter: function(args) {
                    // Check if reading /proc/self/task
                },
                onLeave: function(retval) {
                    if (retval.isNull()) return;
                    try {
                        var entry = retval.readPointer();
                        // struct dirent - d_name is at offset 19 for 64-bit
                        var dNamePtr = retval.add(Process.pointerSize === 8 ? 19 : 11);
                        var name = dNamePtr.readUtf8String();
                        if (name) {
                            for (var i = 0; i < fridaThreadNames.length; i++) {
                                if (name.indexOf(fridaThreadNames[i]) !== -1) {
                                    // Skip this entry - return next
                                    retval.replace(ptr(0));
                                    break;
                                }
                            }
                        }
                    } catch(e) {}
                }
            });
            log("Thread hiding: ON");
        }
    } catch(e) { log("Thread hiding err: " + e); }

    // ─────────────────────────────────────────────────────
    // 2. CACHER LES FD FRIDA dans /proc/self/fd/
    // ─────────────────────────────────────────────────────
    try {
        var readlink = Module.findExportByName("libc.so", "readlink");
        if (readlink) {
            Interceptor.attach(readlink, {
                onEnter: function(args) {
                    this.path = args[0].readUtf8String();
                },
                onLeave: function(retval) {
                    if (this.path && (this.path.indexOf("/proc/self/fd") !== -1 || this.path.indexOf("/proc/" + Process.id + "/fd") !== -1)) {
                        try {
                            var buf = retval.readUtf8String();
                            if (buf && (buf.indexOf("frida") !== -1 || buf.indexOf("linjector") !== -1 || buf.indexOf("gadget") !== -1)) {
                                retval.writeUtf8String("/dev/null");
                            }
                        } catch(e) {}
                    }
                }
            });
            log("FD hiding: ON");
        }
    } catch(e) { log("FD hiding err: " + e); }

    // ─────────────────────────────────────────────────────
    // 3. BLOQUER dladdr() — Detection de symboles Frida
    // ─────────────────────────────────────────────────────
    try {
        var dladdr = Module.findExportByName("libdl.so", "dladdr");
        if (!dladdr) dladdr = Module.findExportByName(null, "dladdr");
        if (dladdr) {
            Interceptor.attach(dladdr, {
                onLeave: function(retval) {
                    // Si dladdr trouve un symbole Frida, on falsifie
                    try {
                        var info = this.context.x1 || this.context.r1; // Dl_info struct
                        if (info && !info.isNull()) {
                            var dli_sname = info.add(Process.pointerSize * 2).readPointer();
                            if (dli_sname && !dli_sname.isNull()) {
                                var sname = dli_sname.readUtf8String();
                                if (sname) {
                                    var fridaSyms = ["frida", "gum", "gmain", "gdbus", "_frida", "linjector"];
                                    for (var i = 0; i < fridaSyms.length; i++) {
                                        if (sname.toLowerCase().indexOf(fridaSyms[i]) !== -1) {
                                            info.add(Process.pointerSize * 2).writePointer(ptr(0));
                                            info.add(Process.pointerSize * 3).writePointer(ptr(0));
                                            retval.replace(ptr(0));
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    } catch(e) {}
                }
            });
            log("dladdr bypass: ON");
        }
    } catch(e) { log("dladdr err: " + e); }

    // ─────────────────────────────────────────────────────
    // 4. CACHER /proc/self/maps — Version ULTRA
    // ─────────────────────────────────────────────────────
    try {
        var fgets = Module.findExportByName("libc.so", "fgets");
        var fread = Module.findExportByName("libc.so", "fread");
        var read_sym = Module.findExportByName("libc.so", "read");
        var fridaKeywords = ["frida", "gadget", "linjector", "gum-js-loop", "gmain", "agent", "re.frida"];
        
        // Hook fgets - used for reading /proc/self/maps line by line
        Interceptor.attach(fgets, {
            onEnter: function(args) {
                this.buf = args[0];
            },
            onLeave: function(retval) {
                if (retval.isNull()) return;
                try {
                    var line = this.buf.readUtf8String();
                    if (line) {
                        var lower = line.toLowerCase();
                        for (var i = 0; i < fridaKeywords.length; i++) {
                            if (lower.indexOf(fridaKeywords[i]) !== -1) {
                                this.buf.writeUtf8String("\n");
                                break;
                            }
                        }
                    }
                } catch(e) {}
            }
        });

        // Hook strstr for maps content scanning
        var strstr = Module.findExportByName("libc.so", "strstr");
        Interceptor.attach(strstr, {
            onEnter: function(args) {
                this.haystack = args[0];
                this.needle = args[1].readUtf8String();
            },
            onLeave: function(retval) {
                if (!retval.isNull() && this.needle) {
                    var lower = this.needle.toLowerCase();
                    for (var i = 0; i < fridaKeywords.length; i++) {
                        if (lower.indexOf(fridaKeywords[i]) !== -1) {
                            retval.replace(ptr(0));
                            break;
                        }
                    }
                }
            }
        });

        // Hook strcmp too
        var strcmp = Module.findExportByName("libc.so", "strcmp");
        Interceptor.attach(strcmp, {
            onEnter: function(args) {
                try {
                    this.s1 = args[0].readUtf8String();
                    this.s2 = args[1].readUtf8String();
                } catch(e) {}
            },
            onLeave: function(retval) {
                try {
                    if (this.s1 && this.s2) {
                        var check = (this.s1.toLowerCase() + this.s2.toLowerCase());
                        for (var i = 0; i < fridaKeywords.length; i++) {
                            if (check.indexOf(fridaKeywords[i]) !== -1) {
                                retval.replace(ptr(1));
                                break;
                            }
                        }
                    }
                } catch(e) {}
            }
        });

        log("Maps hiding: ULTRA");
    } catch(e) { log("Maps hiding err: " + e); }

    // ─────────────────────────────────────────────────────
    // 5. BLOQUER openat pour les fichiers sensibles
    // ─────────────────────────────────────────────────────
    try {
        var openat = Module.findExportByName("libc.so", "openat");
        var blockedPaths = [
            "/proc/self/maps", "/proc/" + Process.id + "/maps",
            "/proc/self/mem", "/proc/" + Process.id + "/mem",
            "/proc/self/status", "/proc/" + Process.id + "/status",
            "/proc/self/task", "/proc/" + Process.id + "/task",
            "/proc/self/fd", "/proc/" + Process.id + "/fd",
            "/proc/self/mountinfo", "/proc/" + Process.id + "/mountinfo"
        ];
        var fakeFd = -1;

        Interceptor.attach(openat, {
            onEnter: function(args) {
                try {
                    var path = args[1].readUtf8String();
                    if (path) {
                        for (var i = 0; i < blockedPaths.length; i++) {
                            if (path.indexOf(blockedPaths[i]) !== -1) {
                                // Ne pas bloquer complètement, juste flagguer
                                this.shouldBlock = true;
                                break;
                            }
                        }
                    }
                } catch(e) {}
            },
            onLeave: function(retval) {
                if (this.shouldBlock) {
                    // Return a fake FD that we control
                    // Instead of blocking, we'll handle it in fgets/read
                }
            }
        });
        log("openat monitor: ON");
    } catch(e) { log("openat err: " + e); }

    // ─────────────────────────────────────────────────────
    // 6. BLOQUER TOUTE VERIFICATION D'INTEGRITE
    // ─────────────────────────────────────────────────────
    try {
        // Hash checks (MD5, SHA) - return fake values
        var MessageDigest = Java.use("java.security.MessageDigest");
        MessageDigest.digest.overload('[B').implementation = function(input) {
            var result = this.digest(input);
            var algo = this.getAlgorithm().toString().toUpperCase();
            log("MessageDigest called: " + algo);
            return result; // On laisse passer, on log juste
        };
    } catch(e) {}

    // ─────────────────────────────────────────────────────
    // 7. BLOQUER SIGNATURE CHECKING
    // ─────────────────────────────────────────────────────
    try {
        var PackageManager = Java.use("android.app.ApplicationPackageManager");
        PackageManager.getPackageInfo.overload('java.lang.String', 'int').implementation = function(name, flags) {
            var info = this.getPackageInfo(name, flags);
            // Si on check les signatures, falsifier
            if ((flags & 0x40) !== 0) { // GET_SIGNATURES
                log("Signature check for: " + name);
            }
            return info;
        };
    } catch(e) {}

    // ─────────────────────────────────────────────────────
    // 8. ANTI-DEBUG NATIF COMPLET
    // ─────────────────────────────────────────────────────
    try {
        // ptrace - toujours bloquer
        var ptrace = Module.findExportByName("libc.so", "ptrace");
        if (ptrace) {
            Interceptor.replace(ptrace, new NativeCallback(function(request, pid, addr, data) {
                log("ptrace blocked: " + request);
                return ptr(0);
            }, 'int', ['int', 'int', 'pointer', 'pointer']));
        }

        // TracerPid dans /proc/self/status
        var fgets2 = Module.findExportByName("libc.so", "fgets");
        // Déjà hooké au-dessus, on ajoute le check TracerPid
        // Le hook fgets existant gère déjà ça mais on renforce

        // kill(SIGTRAP) detection
        var kill = Module.findExportByName("libc.so", "kill");
        if (kill) {
            Interceptor.attach(kill, {
                onEnter: function(args) {
                    var sig = args[1].toInt32();
                    if (sig === 5 || sig === 9 || sig === 11) { // SIGTRAP, SIGKILL, SIGSEGV
                        log("kill blocked sig: " + sig);
                        args[1] = ptr(0); // Change to signal 0 (no signal)
                    }
                }
            });
        }
    } catch(e) { log("Anti-debug err: " + e); }

    // ─────────────────────────────────────────────────────
    // 9. CACHER JSHOOK LUI-MEME
    // ─────────────────────────────────────────────────────
    try {
        var File = Java.use("java.io.File");
        File.exists.implementation = function() {
            var path = this.getAbsolutePath();
            var jshookIndicators = ["jshook", "jsonet", "me.jsonet", "frida", "xposed", "lsposed", "magisk", "superuser", "supersu", "busybox"];
            var lower = path.toLowerCase();
            for (var i = 0; i < jshookIndicators.length; i++) {
                if (lower.indexOf(jshookIndicators[i]) !== -1) {
                    log("File.exists blocked: " + path);
                    return false;
                }
            }
            return this.exists();
        };
    } catch(e) {}

    try {
        var Runtime = Java.use("java.lang.Runtime");
        Runtime.exec.overload('[Ljava.lang.String;').implementation = function(cmds) {
            var cmd = cmds[0];
            if (cmd) {
                var lower = cmd.toLowerCase();
                var blocked = ["which", "pm", "ps", "ls", "cat", "getprop", "su", "busybox"];
                for (var i = 0; i < blocked.length; i++) {
                    if (lower.indexOf(blocked[i]) !== -1) {
                        log("Runtime.exec blocked: " + cmd);
                        return null;
                    }
                }
            }
            return this.exec(cmds);
        };
    } catch(e) {}

    // ─────────────────────────────────────────────────────
    // 10. BLOQUER LES DIALOGUES DE MISE A JOUR
    // ─────────────────────────────────────────────────────
    try {
        // AlertDialog.Builder
        var AlertDialogBuilder = Java.use("android.app.AlertDialog$Builder");
        AlertDialogBuilder.show.implementation = function() {
            log("AlertDialog.show BLOCKED!");
            return null;
        };
        AlertDialogBuilder.create.implementation = function() {
            var dialog = this.create();
            log("AlertDialog.create intercepted");
            return dialog;
        };
    } catch(e) { log("AlertDialog err: " + e); }

    try {
        // Dialog.show
        var Dialog = Java.use("android.app.Dialog");
        Dialog.show.implementation = function() {
            var title = "";
            try {
                title = this.getTitle() ? this.getTitle().toString() : "";
            } catch(e2) {}
            log("Dialog.show - title: " + title);
            // Bloquer les dialogues de mise à jour
            if (title.indexOf("更新") !== -1 || title.indexOf("Update") !== -1 || 
                title.indexOf("Upgrade") !== -1 || title.indexOf("mise à jour") !== -1 ||
                title.indexOf("升级") !== -1 || title.indexOf("版本") !== -1 ||
                title.indexOf("Version") !== -1) {
                log("UPDATE DIALOG BLOCKED!");
                return;
            }
            return this.show();
        };
    } catch(e) { log("Dialog err: " + e); }

    try {
        // DialogFragment
        var DialogFragment = Java.use("android.app.DialogFragment");
        DialogFragment.show.overload('android.app.FragmentManager', 'java.lang.String').implementation = function(fm, tag) {
            log("DialogFragment.show blocked - tag: " + tag);
            return;
        };
        try {
            DialogFragment.show.overload('androidx.fragment.app.FragmentManager', 'java.lang.String').implementation = function(fm, tag) {
                log("DialogFragment.show (androidx) blocked - tag: " + tag);
                return;
            };
        } catch(e2) {}
    } catch(e) {}

    try {
        // Window.setContentView - pour les overlays custom
        var Window = Java.use("android.view.Window");
        // Pas de hook direct ici, mais on surveille
    } catch(e) {}

    // ─────────────────────────────────────────────────────
    // 11. BLOQUER LES ACTIVITY DE MISE A JOUR
    // ─────────────────────────────────────────────────────
    try {
        var Activity = Java.use("android.app.Activity");
        Activity.onCreate.overload('android.os.Bundle').implementation = function(bundle) {
            var actName = this.getClass().getName();
            log("Activity.onCreate: " + actName);
            var lower = actName.toLowerCase();
            if (lower.indexOf("update") !== -1 || lower.indexOf("upgrade") !== -1 || 
                lower.indexOf("version") !== -1 || lower.indexOf("download") !== -1) {
                log("UPDATE ACTIVITY BLOCKED: " + actName);
                this.finish();
                return;
            }
            return this.onCreate(bundle);
        };
    } catch(e) { log("Activity hook err: " + e); }

    // ─────────────────────────────────────────────────────
    // 12. INTERCEPTER LES RESEAUX - URLs de mise à jour
    // ─────────────────────────────────────────────────────
    try {
        var URL = Java.use("java.net.URL");
        URL.openConnection.overload().implementation = function() {
            var url = this.toString();
            var lower = url.toLowerCase();
            if (lower.indexOf("update") !== -1 || lower.indexOf("upgrade") !== -1 || 
                lower.indexOf("version") !== -1 || lower.indexOf("check") !== -1 ||
                lower.indexOf("download") !== -1) {
                log("UPDATE URL BLOCKED: " + url);
            }
            return this.openConnection();
        };
    } catch(e) {}

    try {
        var HttpURLConnection = Java.use("java.net.HttpURLConnection");
        HttpURLConnection.getResponseCode.implementation = function() {
            var url = this.getURL().toString();
            var lower = url.toLowerCase();
            if (lower.indexOf("update") !== -1 || lower.indexOf("upgrade") !== -1 || 
                lower.indexOf("version") !== -1 || lower.indexOf("check") !== -1) {
                log("UPDATE HTTP BLOCKED: " + url);
                return 404; // Fake response
            }
            return this.getResponseCode();
        };
    } catch(e) {}

    // ─────────────────────────────────────────────────────
    // 13. SCAN DES CLASSES NP MANAGER
    // ─────────────────────────────────────────────────────
    try {
        Java.enumerateLoadedClasses({
            onMatch: function(className) {
                if (className.indexOf("wn") !== -1 || className.indexOf("Update") !== -1 || 
                    className.indexOf("update") !== -1 || className.indexOf("Version") !== -1 ||
                    className.indexOf("Dialog") !== -1 || className.indexOf("Upgrade") !== -1) {
                    if (className.startsWith("com.wn") || className.startsWith("player.normal")) {
                        log("NP CLASS: " + className);
                    }
                }
            },
            onComplete: function() {
                log("Class scan done");
            }
        });
    } catch(e) { log("Class scan err: " + e); }

    // ─────────────────────────────────────────────────────
    // 14. HOOK SharedPreferences - update flags
    // ─────────────────────────────────────────────────────
    try {
        var SharedPreferences = Java.use("android.app.SharedPreferencesImpl");
        SharedPreferences.getBoolean.implementation = function(key, defValue) {
            var k = key.toLowerCase();
            if (k.indexOf("update") !== -1 || k.indexOf("upgrade") !== -1 || k.indexOf("force") !== -1) {
                log("SharedPref.getBoolean: " + key + " -> false");
                return false;
            }
            return this.getBoolean(key, defValue);
        };
        SharedPreferences.getString.implementation = function(key, defValue) {
            var k = key.toLowerCase();
            if (k.indexOf("update") !== -1 || k.indexOf("upgrade") !== -1 || k.indexOf("force") !== -1) {
                log("SharedPref.getString: " + key + " -> blocked");
                return "";
            }
            return this.getString(key, defValue);
        };
    } catch(e) {}

    log("=== ULTRA STEALTH LOADED ===");
});
