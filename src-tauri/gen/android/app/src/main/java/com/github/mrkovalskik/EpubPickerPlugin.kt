package com.github.mrkovalskik

import android.app.Activity
import android.content.Intent
import android.net.Uri
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import app.tauri.annotation.Command
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin

@TauriPlugin
class EpubPickerPlugin(private val activity: Activity) : Plugin(activity) {
    private var pendingInvoke: Invoke? = null

    // registerForActivityResult must be called before onStart — field initializers
    // run during registerPlugin() which is called before super.onCreate().
    private val launcher =
        (activity as ComponentActivity).registerForActivityResult(
            ActivityResultContracts.OpenDocument()
        ) { uri: Uri? ->
            val inv = pendingInvoke ?: return@registerForActivityResult
            pendingInvoke = null

            if (uri != null) {
                try {
                    activity.contentResolver.takePersistableUriPermission(
                        uri,
                        Intent.FLAG_GRANT_READ_URI_PERMISSION
                    )
                } catch (e: SecurityException) {
                    android.util.Log.w("EpubPickerPlugin", "takePersistableUriPermission: $e")
                }
                val result = JSObject()
                result.put("uri", uri.toString())
                inv.resolve(result)
            } else {
                // cancelled — resolve with empty object, Rust maps missing "uri" to None
                inv.resolve(JSObject())
            }
        }

    @Command
    fun pickEpubFile(invoke: Invoke) {
        pendingInvoke = invoke
        launcher.launch(arrayOf("application/epub+zip"))
    }
}
